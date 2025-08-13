-- Ensure public access for all tables and views
-- This migration ensures all necessary permissions are granted for public access

-- Grant basic permissions to anon and authenticated roles for sensor_data table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sensor_data TO anon, authenticated;
GRANT USAGE ON SEQUENCE gen_random_uuid TO anon, authenticated;

-- Grant basic permissions to anon and authenticated roles for devices table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.devices TO anon, authenticated;

-- Grant basic permissions to anon and authenticated roles for comments table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO anon, authenticated;

-- Grant access to views
GRANT SELECT ON public.device_stats TO anon, authenticated;

-- Update RLS policies to be more explicit about public access
-- Sensor data policies
DROP POLICY IF EXISTS "Allow all operations on sensor_data" ON public.sensor_data;
CREATE POLICY "Public read access to sensor_data" 
ON public.sensor_data FOR SELECT 
USING (true);

CREATE POLICY "Public insert access to sensor_data" 
ON public.sensor_data FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public update access to sensor_data" 
ON public.sensor_data FOR UPDATE 
USING (true) WITH CHECK (true);

CREATE POLICY "Public delete access to sensor_data" 
ON public.sensor_data FOR DELETE 
USING (true);

-- Device policies
DROP POLICY IF EXISTS "Allow all operations on devices" ON public.devices;
CREATE POLICY "Public read access to devices" 
ON public.devices FOR SELECT 
USING (true);

CREATE POLICY "Public insert access to devices" 
ON public.devices FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public update access to devices" 
ON public.devices FOR UPDATE 
USING (true) WITH CHECK (true);

CREATE POLICY "Public delete access to devices" 
ON public.devices FOR DELETE 
USING (true);

-- Comment policies
DROP POLICY IF EXISTS "Allow all operations on comments" ON public.comments;
DROP POLICY IF EXISTS "Allow all users to read comments" ON public.comments;
DROP POLICY IF EXISTS "Allow all users to create comments" ON public.comments;
DROP POLICY IF EXISTS "Allow all users to update their comments" ON public.comments;
DROP POLICY IF EXISTS "Allow all users to delete comments" ON public.comments;

CREATE POLICY "Public read access to comments" 
ON public.comments FOR SELECT 
USING (true);

CREATE POLICY "Public insert access to comments" 
ON public.comments FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public update access to comments" 
ON public.comments FOR UPDATE 
USING (true) WITH CHECK (true);

CREATE POLICY "Public delete access to comments" 
ON public.comments FOR DELETE 
USING (true);

-- Enable realtime for all tables (in case not already enabled)
ALTER TABLE public.sensor_data REPLICA IDENTITY FULL;
ALTER TABLE public.devices REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;

-- Add tables to realtime publication if not already added
DO $$
BEGIN
    -- Add sensor_data to realtime
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_data;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, do nothing
        NULL;
    END;
    
    -- Add devices to realtime
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, do nothing
        NULL;
    END;
    
    -- Add comments to realtime (might already be there)
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
    EXCEPTION WHEN duplicate_object THEN
        -- Table already in publication, do nothing
        NULL;
    END;
END $$;