#!/usr/bin/env python3
"""
Script to check what columns exist in the device_stats view
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

def check_device_stats_view():
    """Check what columns exist in the device_stats view"""
    print("🔍 Checking device_stats view...")
    
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/device_stats?limit=1",
            headers=headers
        )
        
        with urllib.request.urlopen(req, timeout=10.0) as response:
            status_code = response.getcode()
            if status_code == 200:
                data = json.loads(response.read().decode('utf-8'))
                print(f"✅ Device_stats view exists! Found {len(data)} records")
                if data:
                    print("\n📋 Available columns:")
                    for key in sorted(data[0].keys()):
                        print(f"  - {key}")
                else:
                    print("📋 View exists but no data found")
                return True
            else:
                print(f"❌ Query failed: {status_code}")
                return False
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print("❌ Device_stats view does not exist (404 error)")
        else:
            print(f"❌ HTTP Error: {e.code} - {e.reason}")
            error_body = e.read().decode('utf-8')
            print(f"Error details: {error_body}")
        return False
    except Exception as e:
        print(f"❌ Error checking view: {e}")
        return False

def check_devices_table_columns():
    """Check what columns exist in the devices table"""
    print("\n🔍 Checking devices table columns...")
    
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/devices?limit=1",
            headers=headers
        )
        
        with urllib.request.urlopen(req, timeout=10.0) as response:
            status_code = response.getcode()
            if status_code == 200:
                data = json.loads(response.read().decode('utf-8'))
                print(f"✅ Devices table exists! Found {len(data)} records")
                if data:
                    print("\n📋 Available columns:")
                    for key in sorted(data[0].keys()):
                        print(f"  - {key}")
                else:
                    print("📋 Table exists but no data found")
                return True
            else:
                print(f"❌ Query failed: {status_code}")
                return False
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error: {e.code} - {e.reason}")
        error_body = e.read().decode('utf-8')
        print(f"Error details: {error_body}")
        return False
    except Exception as e:
        print(f"❌ Error checking table: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Checking database schema")
    print("=" * 50)
    
    devices_exists = check_devices_table_columns()
    view_exists = check_device_stats_view()
    
    print("\n" + "=" * 50)
    print("📋 Summary:")
    print(f"  Devices Table: {'✅ EXISTS' if devices_exists else '❌ MISSING'}")
    print(f"  Device Stats View: {'✅ EXISTS' if view_exists else '❌ MISSING'}")
    
    if not view_exists:
        print("\n💡 The device_stats view needs to be recreated.")
        print("This can be done by running the SQL from the migration file.")

if __name__ == "__main__":
    main()