-- Fix critical security vulnerability: Secure device_stats table with RLS policies

-- Enable Row Level Security on device_stats table
ALTER TABLE public.device_stats ENABLE ROW LEVEL SECURITY;

-- Create secure RLS policies for device_stats table
-- Only authenticated users can view device statistics
CREATE POLICY "Authenticated users can view device stats" 
ON public.device_stats 
FOR SELECT 
TO authenticated 
USING (true);

-- Only authenticated users can insert device statistics (for system operations)
CREATE POLICY "Authenticated users can insert device stats" 
ON public.device_stats 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Only authenticated users can update device statistics
CREATE POLICY "Authenticated users can update device stats" 
ON public.device_stats 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Only authenticated users can delete device statistics
CREATE POLICY "Authenticated users can delete device stats" 
ON public.device_stats 
FOR DELETE 
TO authenticated 
USING (true);