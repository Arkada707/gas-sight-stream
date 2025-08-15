#!/usr/bin/env python3
"""
Script to test different ways to execute SQL in Supabase
"""
import urllib.request
import urllib.parse
import json

# Supabase configuration
SUPABASE_URL = "https://jjjcevuwigroasnyxohj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqamNldnV3aWdyb2Fzbnl4b2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzc3MzQsImV4cCI6MjA2OTk1MzczNH0.s5mdXvUN3fgxHHOZnjtFQn2UsAUq9euS9ML0BYs9nUg"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def test_sql_endpoints():
    """Test different SQL endpoints"""
    print("🔍 Testing SQL execution endpoints...")
    
    test_endpoints = [
        "/rest/v1/rpc/sql",
        "/rest/v1/rpc/exec_sql", 
        "/database/sql",
        "/sql",
        "/rpc/sql"
    ]
    
    simple_sql = "SELECT 1 as test;"
    
    for endpoint in test_endpoints:
        print(f"\n🧪 Testing endpoint: {endpoint}")
        
        try:
            data = json.dumps({"query": simple_sql}).encode('utf-8')
            req = urllib.request.Request(
                f"{SUPABASE_URL}{endpoint}",
                data=data,
                headers=headers,
                method='POST'
            )
            
            with urllib.request.urlopen(req, timeout=10.0) as response:
                status_code = response.getcode()
                print(f"✅ {endpoint}: Status {status_code}")
                response_text = response.read().decode('utf-8')
                print(f"   Response: {response_text[:100]}...")
                return endpoint
        except urllib.error.HTTPError as e:
            print(f"❌ {endpoint}: HTTP Error {e.code} - {e.reason}")
        except Exception as e:
            print(f"❌ {endpoint}: Error {e}")
    
    return None

def check_current_view_structure():
    """Check what the current view actually looks like"""
    print("\n🔍 Checking current device_stats view structure...")
    
    # Try to get schema information
    try:
        # Use PostgREST introspection
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/",
            headers=headers
        )
        
        with urllib.request.urlopen(req, timeout=10.0) as response:
            status_code = response.getcode()
            if status_code == 200:
                response_text = response.read().decode('utf-8')
                print("✅ PostgREST introspection available")
                
                # Look for device_stats in the response
                if 'device_stats' in response_text:
                    print("✅ device_stats view found in schema")
                else:
                    print("❌ device_stats view not found in schema")
                
                return True
            else:
                print(f"❌ Introspection failed: {status_code}")
                return False
    except Exception as e:
        print(f"❌ Introspection error: {e}")
        return False

def analyze_error_workaround():
    """Suggest workaround for the view issue"""
    print("\n💡 Analysis and Workaround:")
    print("=" * 50)
    print("The issue appears to be that the device_stats view either:")
    print("1. Doesn't exist in the current database")
    print("2. Has a different column structure than expected")
    print("3. Has permissions issues")
    print("\nSuggested solutions:")
    print("1. Use the devices table directly instead of device_stats view")
    print("2. Manually recreate the view in Supabase dashboard")
    print("3. Update the useDeviceData hook to handle the missing column gracefully")
    print("\nFor immediate fix, we should modify the useDeviceData hook to:")
    print("- Remove the ORDER BY device_created_at clause")
    print("- Or change it to ORDER BY created_at")
    print("- Or use the devices table directly for the initial query")

def main():
    """Main function"""
    print("🚀 Diagnosing device_stats view issue")
    print("=" * 50)
    
    # Test SQL endpoints
    working_endpoint = test_sql_endpoints()
    
    # Check current view structure
    check_current_view_structure()
    
    # Analyze and suggest fixes
    analyze_error_workaround()
    
    if working_endpoint:
        print(f"\n✅ Found working SQL endpoint: {working_endpoint}")
        print("You can use this endpoint to manually recreate the view")
    else:
        print("\n❌ No working SQL endpoints found")
        print("Manual recreation via Supabase dashboard is required")

if __name__ == "__main__":
    main()