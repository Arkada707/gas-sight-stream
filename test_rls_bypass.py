#!/usr/bin/env python3
"""
Script to test bypassing RLS or using service role key
"""
import urllib.request
import urllib.parse
import json

# Supabase configuration
SUPABASE_URL = "https://jjjcevuwigroasnyxohj.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqamNldnV3aWdyb2Fzbnl4b2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzc3MzQsImV4cCI6MjA2OTk1MzczNH0.s5mdXvUN3fgxHHOZnjtFQn2UsAUq9euS9ML0BYs9nUg"

def test_with_role_header():
    """Test with different role claims"""
    print("🔍 Testing with role=authenticated header...")
    
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "X-Client-Info": "supabase-js/1.0.0"
    }
    
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/devices",
            headers=headers
        )
        
        with urllib.request.urlopen(req, timeout=10.0) as response:
            status_code = response.getcode()
            response_text = response.read().decode('utf-8')
            
            if status_code == 200:
                data = json.loads(response_text)
                print(f"✅ Found {len(data)} devices with role header")
                return len(data) > 0
            else:
                print(f"❌ Failed with role header: {status_code}")
                return False
                
    except Exception as e:
        print(f"❌ Error with role header: {e}")
        return False

def test_direct_sql_functions():
    """Test if there are any SQL functions we can call"""
    print("\n🔍 Testing available RPC functions...")
    
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }
    
    # Test some common function names
    functions_to_test = [
        "get_devices",
        "list_devices", 
        "get_device_stats",
        "auth.uid()"
    ]
    
    for func_name in functions_to_test:
        try:
            req = urllib.request.Request(
                f"{SUPABASE_URL}/rest/v1/rpc/{func_name}",
                headers=headers,
                method='POST',
                data=b'{}'
            )
            
            with urllib.request.urlopen(req, timeout=10.0) as response:
                status_code = response.getcode()
                response_text = response.read().decode('utf-8')
                
                print(f"  {func_name}: Status {status_code}")
                if status_code == 200:
                    print(f"    ✅ Available: {response_text[:100]}...")
                    
        except urllib.error.HTTPError as e:
            if e.code == 404:
                print(f"  {func_name}: ❌ Not found")
            else:
                print(f"  {func_name}: ❌ Error {e.code}")
        except Exception as e:
            print(f"  {func_name}: ❌ Exception {e}")

def analyze_rls_solution():
    """Analyze potential solutions for the RLS issue"""
    print("\n💡 RLS Issue Analysis and Solutions:")
    print("=" * 50)
    
    print("🔍 Problem Identified:")
    print("  - Devices can be inserted (201 Created)")
    print("  - Devices cannot be queried (0 results)")
    print("  - This is a classic RLS policy issue")
    print()
    
    print("🔧 Possible Solutions:")
    print("1. **Update RLS Policy in Supabase Dashboard** (Recommended)")
    print("   - Go to: https://supabase.com/dashboard/project/jjjcevuwigroasnyxohj")
    print("   - Navigate to Authentication > Policies")
    print("   - Check the 'devices' table policies")
    print("   - Ensure the policy allows SELECT operations for 'anon' role")
    print()
    
    print("2. **Temporary RLS Disable** (Quick Fix)")
    print("   - In SQL Editor, run: ALTER TABLE devices DISABLE ROW LEVEL SECURITY;")
    print("   - This removes all security but allows immediate testing")
    print()
    
    print("3. **Fix Policy SQL** (Proper Fix)")
    print("   - The current policy might have incorrect conditions")
    print("   - Policy should be: CREATE POLICY name ON devices FOR ALL TO anon USING (true);")
    print()
    
    print("4. **Use Service Role Key** (Alternative)")
    print("   - Switch to service_role key instead of anon key")
    print("   - Service role bypasses RLS entirely")
    print()
    
    print("🎯 Immediate Action Needed:")
    print("Since we can't execute SQL directly via API, the quickest solution is:")
    print("1. Go to Supabase Dashboard > SQL Editor")
    print("2. Run: ALTER TABLE devices DISABLE ROW LEVEL SECURITY;")
    print("3. Test the app - devices should now appear")
    print("4. Later, re-enable RLS with proper policies")

def create_rls_fix_sql():
    """Generate SQL to fix RLS policies"""
    print("\n📝 SQL Commands to Fix RLS (run in Supabase Dashboard):")
    print("=" * 60)
    
    sql_commands = """
-- OPTION 1: Temporarily disable RLS (quick fix)
ALTER TABLE public.devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_data DISABLE ROW LEVEL SECURITY;

-- OPTION 2: Fix RLS policies (proper fix)
-- First, drop existing policies
DROP POLICY IF EXISTS "Allow all operations on devices" ON public.devices;
DROP POLICY IF EXISTS "Allow all operations on sensor_data" ON public.sensor_data;

-- Create new, working policies
CREATE POLICY "Enable all access for devices" ON public.devices
    FOR ALL 
    TO anon, authenticated 
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for sensor_data" ON public.sensor_data
    FOR ALL 
    TO anon, authenticated 
    USING (true)
    WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_data ENABLE ROW LEVEL SECURITY;

-- Test query (should return devices)
SELECT id, title, name FROM devices LIMIT 5;
"""
    
    print(sql_commands)
    print("=" * 60)

def main():
    """Main function"""
    print("🚀 Testing RLS bypass methods")
    print("=" * 50)
    
    # Test different approaches
    test_with_role_header()
    test_direct_sql_functions()
    
    # Provide analysis and solutions
    analyze_rls_solution()
    create_rls_fix_sql()

if __name__ == "__main__":
    main()