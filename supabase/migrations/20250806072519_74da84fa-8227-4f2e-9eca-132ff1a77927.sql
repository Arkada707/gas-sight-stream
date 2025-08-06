-- Create devices table
CREATE TABLE public.devices (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  title text NOT NULL,
  location text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '#22c55e',
  enabled boolean NOT NULL DEFAULT true,
  is_connected boolean NOT NULL DEFAULT false,
  last_connected timestamp with time zone,
  mac_address text NOT NULL,
  service_uuid text NOT NULL,
  data_characteristic_uuid text NOT NULL,
  rssi integer,
  confidence_score numeric,
  last_discovered timestamp with time zone,
  connection_attempts integer NOT NULL DEFAULT 0,
  total_packets_received integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Create policy for devices (allow all operations for now)
CREATE POLICY "Allow all operations on devices" 
ON public.devices 
FOR ALL 
USING (true);

-- Create device_stats view for comprehensive device data
CREATE VIEW public.device_stats AS
SELECT 
  d.id,
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
  -- Latest sensor data
  latest_data.tank_level AS latest_tank_level,
  latest_data.measurement AS latest_measurement,
  latest_data.battery AS latest_battery,
  latest_data.connection_strength AS latest_connection_strength,
  latest_data.created_at AS latest_reading_at,
  latest_data.tank_level_unit,
  latest_data.measurement_unit,
  -- Statistics
  COALESCE(stats.total_readings, 0) AS total_readings,
  COALESCE(stats.readings_last_24h, 0) AS readings_last_24h,
  COALESCE(stats.avg_measurement_24h, 0) AS avg_measurement_24h
FROM public.devices d
LEFT JOIN LATERAL (
  SELECT 
    tank_level,
    measurement,
    battery,
    connection_strength,
    created_at,
    tank_level_unit,
    measurement_unit
  FROM public.sensor_data sd
  WHERE sd.device_id = d.id
  ORDER BY sd.created_at DESC
  LIMIT 1
) latest_data ON true
LEFT JOIN LATERAL (
  SELECT 
    COUNT(*) AS total_readings,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS readings_last_24h,
    AVG(measurement) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS avg_measurement_24h
  FROM public.sensor_data sd
  WHERE sd.device_id = d.id
) stats ON true;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_devices_updated_at
BEFORE UPDATE ON public.devices
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();