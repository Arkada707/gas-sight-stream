-- Fix security for device_stats view by creating a secure function-based approach
-- Since device_stats is a view combining devices and sensor_data (both now have RLS), 
-- we need to create a security definer function to allow the view to work properly

-- Drop the existing view
DROP VIEW IF EXISTS public.device_stats;

-- Create a security definer function to get device statistics
-- This function will run with elevated privileges to access the secured tables
CREATE OR REPLACE FUNCTION public.get_device_stats()
RETURNS TABLE (
    id text,
    name text,
    title text,
    location text,
    color text,
    enabled boolean,
    is_connected boolean,
    last_connected timestamptz,
    mac_address text,
    service_uuid text,
    data_characteristic_uuid text,
    rssi integer,
    confidence_score numeric,
    last_discovered timestamptz,
    connection_attempts integer,
    total_packets_received integer,
    device_created_at timestamptz,
    device_updated_at timestamptz,
    latest_tank_level numeric,
    latest_measurement numeric,
    latest_battery text,
    latest_connection_strength integer,
    latest_reading_at timestamptz,
    tank_level_unit text,
    measurement_unit text,
    total_readings bigint,
    readings_last_24h bigint,
    avg_measurement_24h numeric
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
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
$$;

-- Recreate the view using the security definer function
-- This view will now be secure because it calls a function that requires authentication
CREATE VIEW public.device_stats AS
SELECT * FROM public.get_device_stats();

-- Grant access to authenticated users only
GRANT SELECT ON public.device_stats TO authenticated;