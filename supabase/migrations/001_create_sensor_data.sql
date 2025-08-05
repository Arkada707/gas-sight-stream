-- Create sensor_data table for real-time IoT data streaming
create table if not exists public.sensor_data (
  id uuid default gen_random_uuid() primary key,
  device_id text not null,
  title_name text not null,
  tank_level numeric not null,
  tank_level_unit text default 'cm',
  updated_refresh text not null,
  battery text not null check (battery in ('Full', 'Ok', 'Low')),
  connection_strength integer not null check (connection_strength >= 0 and connection_strength <= 100),
  measurement numeric not null,
  measurement_unit text default '%',
  technical_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for efficient querying by device
create index if not exists sensor_data_device_id_idx on public.sensor_data (device_id);
create index if not exists sensor_data_created_at_idx on public.sensor_data (created_at desc);

-- Enable Row Level Security
alter table public.sensor_data enable row level security;

-- Create policy to allow all operations for now (adjust as needed for production)
create policy "Allow all operations on sensor_data" on public.sensor_data
  for all using (true);

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger if not exists set_updated_at
  before update on public.sensor_data
  for each row
  execute function public.handle_updated_at();