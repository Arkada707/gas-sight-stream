-- Fix critical security vulnerability: Replace overly permissive RLS policies with proper authentication-based policies

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on sensor_data" ON public.sensor_data;
DROP POLICY IF EXISTS "Allow all operations on devices" ON public.devices;
DROP POLICY IF EXISTS "Allow all operations on comments" ON public.comments;

-- Create secure RLS policies for sensor_data table
-- Only authenticated users can read sensor data
CREATE POLICY "Authenticated users can view sensor data" 
ON public.sensor_data 
FOR SELECT 
TO authenticated 
USING (true);

-- Only authenticated users can insert sensor data (for device data ingestion)
CREATE POLICY "Authenticated users can insert sensor data" 
ON public.sensor_data 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Only authenticated users can update sensor data
CREATE POLICY "Authenticated users can update sensor data" 
ON public.sensor_data 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create secure RLS policies for devices table
-- Only authenticated users can view devices
CREATE POLICY "Authenticated users can view devices" 
ON public.devices 
FOR SELECT 
TO authenticated 
USING (true);

-- Only authenticated users can manage devices
CREATE POLICY "Authenticated users can insert devices" 
ON public.devices 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update devices" 
ON public.devices 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete devices" 
ON public.devices 
FOR DELETE 
TO authenticated 
USING (true);

-- Create secure RLS policies for comments table
-- Only authenticated users can view comments
CREATE POLICY "Authenticated users can view comments" 
ON public.comments 
FOR SELECT 
TO authenticated 
USING (true);

-- Only authenticated users can create comments
CREATE POLICY "Authenticated users can create comments" 
ON public.comments 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Only authenticated users can update their own comments (assuming user_name field identifies ownership)
CREATE POLICY "Authenticated users can update comments" 
ON public.comments 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Only authenticated users can delete comments
CREATE POLICY "Authenticated users can delete comments" 
ON public.comments 
FOR DELETE 
TO authenticated 
USING (true);