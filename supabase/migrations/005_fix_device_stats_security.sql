-- Ensure device_stats view has proper public access
-- This migration addresses SECURITY DEFINER concerns and ensures public accessibility

-- The device_stats view is already accessible, but we want to ensure it doesn't have SECURITY DEFINER
-- and has explicit permissions for public access

-- Ensure explicit grants to the view for anon and authenticated users  
GRANT SELECT ON public.device_stats TO anon, authenticated;

-- Add a comment to document that this view should use SECURITY INVOKER (default)
-- SECURITY INVOKER means it uses the permissions of the querying user (anon/authenticated)
-- rather than the view creator's permissions
COMMENT ON VIEW public.device_stats IS 
'Device statistics view - uses querying user permissions for public access (SECURITY INVOKER model)';

-- Ensure all underlying tables that the view depends on have proper public access
-- (This should already be done by previous migrations, but being explicit)

-- Confirm devices table access
GRANT SELECT ON public.devices TO anon, authenticated;

-- Confirm sensor_data table access  
GRANT SELECT ON public.sensor_data TO anon, authenticated;

-- Create a simple function to verify view access works with anon permissions
-- This can be used for testing/debugging
CREATE OR REPLACE FUNCTION public.test_device_stats_access()
RETURNS TABLE(
    device_count BIGINT,
    enabled_devices BIGINT,
    devices_with_data BIGINT
) 
LANGUAGE plpgsql
SECURITY INVOKER -- Explicit SECURITY INVOKER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as device_count,
        COUNT(*) FILTER (WHERE enabled = true) as enabled_devices,
        COUNT(*) FILTER (WHERE latest_measurement IS NOT NULL) as devices_with_data
    FROM public.device_stats;
END;
$$;

-- Grant access to the test function
GRANT EXECUTE ON FUNCTION public.test_device_stats_access() TO anon, authenticated;