#!/usr/bin/env python3
"""
Script to test device creation and check actual column names
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

def create_test_device():
    """Create a test device to see the actual table structure"""
    print("📝 Creating test device...")
    
    import time
    device_id = f"test-column-check-{int(time.time())}"
    test_device = {
        "id": device_id,
        "name": "@TEST001",
        "mac_address": f"AA:BB:CC:DD:EE:{int(time.time()) % 256:02X}",
        "title": "Test Device for Column Check",
        "location": "Test Location",
        "enabled": True,
        "color": "#22c55e",
        "service_uuid": "0000fff0-0000-1000-8000-00805f9b34fb",
        "data_characteristic_uuid": "0000fff1-0000-1000-8000-00805f9b34fb"
    }
    
    try:
        data = json.dumps(test_device).encode('utf-8')
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/devices",
            data=data,
            headers=headers,
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=10.0) as response:
            status_code = response.getcode()
            if status_code in [200, 201]:
                print("✅ Test device created successfully!")
                return device_id
            else:
                print(f"❌ Device creation failed: {status_code}")
                response_text = response.read().decode('utf-8')
                print(f"Response: {response_text}")
                return None
    except urllib.error.HTTPError as e:
        print(f"❌ Device creation HTTP error: {e.code} - {e.reason}")
        error_body = e.read().decode('utf-8')
        print(f"Error details: {error_body}")
        return None
    except Exception as e:
        print(f"❌ Device creation error: {e}")
        return None

def check_view_with_data(device_id):
    """Check the view columns now that we have data"""
    print(f"\n🔍 Checking device_stats view with data for device {device_id}...")
    
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/device_stats?id=eq.{device_id}",
            headers=headers
        )
        
        with urllib.request.urlopen(req, timeout=10.0) as response:
            status_code = response.getcode()
            if status_code == 200:
                data = json.loads(response.read().decode('utf-8'))
                print(f"✅ Found {len(data)} records in device_stats view")
                if data:
                    print("\n📋 Available columns in device_stats view:")
                    for key in sorted(data[0].keys()):
                        value = data[0][key]
                        print(f"  - {key}: {type(value).__name__} = {value}")
                    return data[0]
                else:
                    print("📋 View exists but no data found")
                    return None
            else:
                print(f"❌ Query failed: {status_code}")
                return None
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error: {e.code} - {e.reason}")
        error_body = e.read().decode('utf-8')
        print(f"Error details: {error_body}")
        return None
    except Exception as e:
        print(f"❌ Error checking view: {e}")
        return None

def check_devices_table_with_data(device_id):
    """Check the devices table columns now that we have data"""
    print(f"\n🔍 Checking devices table with data for device {device_id}...")
    
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/devices?id=eq.{device_id}",
            headers=headers
        )
        
        with urllib.request.urlopen(req, timeout=10.0) as response:
            status_code = response.getcode()
            if status_code == 200:
                data = json.loads(response.read().decode('utf-8'))
                print(f"✅ Found {len(data)} records in devices table")
                if data:
                    print("\n📋 Available columns in devices table:")
                    for key in sorted(data[0].keys()):
                        value = data[0][key]
                        print(f"  - {key}: {type(value).__name__} = {value}")
                    return data[0]
                else:
                    print("📋 Table exists but no data found")
                    return None
            else:
                print(f"❌ Query failed: {status_code}")
                return None
    except Exception as e:
        print(f"❌ Error checking table: {e}")
        return None

def cleanup_test_device(device_id):
    """Clean up the test device"""
    print(f"\n🧹 Cleaning up test device {device_id}...")
    
    try:
        delete_req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/devices?id=eq.{device_id}",
            headers=headers,
            method='DELETE'
        )
        with urllib.request.urlopen(delete_req, timeout=10.0) as delete_response:
            print("✅ Test device cleaned up")
    except Exception as e:
        print(f"❌ Cleanup error: {e}")

def main():
    """Main function"""
    print("🚀 Testing device creation and checking column structure")
    print("=" * 60)
    
    # Create test device
    device_id = create_test_device()
    if device_id:
        # Check the actual column structure immediately
        devices_data = check_devices_table_with_data(device_id)
        view_data = check_view_with_data(device_id)
        
        print("\n" + "=" * 60)
        print("📋 Analysis:")
        if devices_data and 'created_at' in devices_data:
            print("✅ devices.created_at column exists")
        else:
            print("❌ devices.created_at column missing")
            if devices_data:
                print("Available devices columns:", list(devices_data.keys()))
            
        if view_data and 'device_created_at' in view_data:
            print("✅ device_stats.device_created_at column exists")
        else:
            print("❌ device_stats.device_created_at column missing")
            if view_data:
                # Look for similar column names
                created_cols = [k for k in view_data.keys() if 'created' in k.lower()]
                if created_cols:
                    print(f"💡 Found similar columns: {created_cols}")
                print("Available view columns:", list(view_data.keys()))
        
        # Clean up
        cleanup_test_device(device_id)
    else:
        print("❌ Failed to create test device, cannot check columns")

if __name__ == "__main__":
    main()