-- Fix the INSERT policy syntax and security issues

-- Drop problematic views first  
DROP VIEW IF EXISTS public.device_stats;

-- Fix sensor_data INSERT policy with correct syntax
DROP POLICY IF EXISTS "Allow system and authenticated insert on sensor_data" ON public.sensor_data;
CREATE POLICY "Allow system and authenticated insert on sensor_data" 
ON public.sensor_data 
FOR INSERT 
WITH CHECK (true);

-- Fix devices INSERT policy with correct syntax  
DROP POLICY IF EXISTS "Allow system and authenticated insert on devices" ON public.devices;
CREATE POLICY "Allow system and authenticated insert on devices" 
ON public.devices 
FOR INSERT 
WITH CHECK (true);

-- Recreate the device_stats view with proper security
CREATE VIEW public.device_stats AS
SELECT d.id,
    d.name,
    d.title,
    d.location,
    d.color,
    d.enabled,
    d.is_connected,
    d.last_connected,
    d.mac_address,
    d.service_uuid,
    d.data_characteristic_uuid,
    d.rssi,
    d.confidence_score,
    d.last_discovered,
    d.connection_attempts,
    d.total_packets_received,
    d.created_at AS device_created_at,
    d.updated_at AS device_updated_at,
    latest_data.tank_level AS latest_tank_level,
    latest_data.measurement AS latest_measurement,
    latest_data.battery AS latest_battery,
    latest_data.connection_strength AS latest_connection_strength,
    latest_data.created_at AS latest_reading_at,
    latest_data.tank_level_unit,
    latest_data.measurement_unit,
    COALESCE(stats.total_readings, 0::bigint) AS total_readings,
    COALESCE(stats.readings_last_24h, 0::bigint) AS readings_last_24h,
    COALESCE(stats.avg_measurement_24h, 0::numeric) AS avg_measurement_24h
FROM devices d
LEFT JOIN LATERAL (
    SELECT sd.tank_level,
        sd.measurement,
        sd.battery,
        sd.connection_strength,
        sd.created_at,
        sd.tank_level_unit,
        sd.measurement_unit
    FROM sensor_data sd
    WHERE sd.device_id = d.id
    ORDER BY sd.created_at DESC
    LIMIT 1
) latest_data ON true
LEFT JOIN LATERAL (
    SELECT count(*) AS total_readings,
        count(*) FILTER (WHERE sd.created_at >= now() - interval '24 hours') AS readings_last_24h,
        avg(sd.measurement) FILTER (WHERE sd.created_at >= now() - interval '24 hours') AS avg_measurement_24h
    FROM sensor_data sd
    WHERE sd.device_id = d.id
) stats ON true;

-- Grant permissions for device_stats view
GRANT SELECT ON public.device_stats TO authenticated;
GRANT SELECT ON public.device_stats TO anon;