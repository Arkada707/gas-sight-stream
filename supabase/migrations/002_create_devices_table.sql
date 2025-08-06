-- Create devices table for multi-device configuration and metadata
create table if not exists public.devices (
  id text primary key,
  name text not null,
  mac_address text not null unique,
  title text not null,
  location text not null default 'Unknown Location',
  service_uuid text not null default '0000fff0-0000-1000-8000-00805f9b34fb',
  data_characteristic_uuid text not null default '0000fff1-0000-1000-8000-00805f9b34fb',
  enabled boolean not null default true,
  color text not null default '#22c55e',
  -- Device discovery metadata
  rssi integer,
  confidence_score integer,
  last_discovered timestamp with time zone,
  discovery_metadata jsonb,
  -- Device status and configuration
  is_connected boolean not null default false,
  last_connected timestamp with time zone,
  connection_attempts integer not null default 0,
  total_packets_received bigint not null default 0,
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for efficient querying
create index if not exists devices_mac_address_idx on public.devices (mac_address);
create index if not exists devices_enabled_idx on public.devices (enabled);
create index if not exists devices_is_connected_idx on public.devices (is_connected);
create index if not exists devices_created_at_idx on public.devices (created_at desc);

-- Enable Row Level Security
alter table public.devices enable row level security;

-- Create policy to allow all operations for now (adjust as needed for production)
create policy "Allow all operations on devices" on public.devices
  for all using (true);

-- Create trigger to automatically update updated_at
drop trigger if exists set_devices_updated_at on public.devices;
create trigger set_devices_updated_at
  before update on public.devices
  for each row
  execute function public.handle_updated_at();

-- Add foreign key relationship from sensor_data to devices
-- This allows multiple sensor readings per device while maintaining device metadata
alter table public.sensor_data 
  add constraint fk_sensor_data_device_id 
  foreign key (device_id) references public.devices(id) 
  on delete cascade;

-- Create index on sensor_data.device_id for the foreign key
create index if not exists sensor_data_device_fk_idx on public.sensor_data (device_id);

-- Create view for device statistics
create or replace view public.device_stats as
select 
  d.id,
  d.name,
  d.title,
  d.location,
  d.color,
  d.enabled,
  d.is_connected,
  d.last_connected,
  d.total_packets_received,
  d.created_at as device_created_at,
  -- Latest sensor data
  s.tank_level as latest_tank_level,
  s.tank_level_unit,
  s.measurement as latest_measurement,
  s.measurement_unit,
  s.battery as latest_battery,
  s.connection_strength as latest_connection_strength,
  s.updated_refresh as latest_refresh,
  s.created_at as latest_reading_at,
  -- Data statistics
  (select count(*) from sensor_data where device_id = d.id) as total_readings,
  (
    select count(*) 
    from sensor_data 
    where device_id = d.id 
    and created_at >= now() - interval '24 hours'
  ) as readings_last_24h,
  (
    select avg(measurement) 
    from sensor_data 
    where device_id = d.id 
    and created_at >= now() - interval '24 hours'
  ) as avg_measurement_24h
from public.devices d
left join lateral (
  select * from public.sensor_data 
  where device_id = d.id 
  order by created_at desc 
  limit 1
) s on true
order by d.created_at desc;

-- Grant access to the view
grant select on public.device_stats to anon, authenticated;