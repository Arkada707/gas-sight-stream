#!/usr/bin/env python3
"""
Script to debug device fetching issues
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

def test_devices_table():
    """Test direct access to devices table"""
    print("🔍 Testing devices table access...")
    
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/devices",
            headers=headers
        )
        
        with urllib.request.urlopen(req, timeout=10.0) as response:
            status_code = response.getcode()
            response_text = response.read().decode('utf-8')
            
            print(f"Status: {status_code}")
            print(f"Response length: {len(response_text)}")
            
            if status_code == 200:
                devices = json.loads(response_text)
                print(f"✅ Found {len(devices)} devices")
                
                if devices:
                    print("\n📋 Device details:")
                    for i, device in enumerate(devices):
                        print(f"  {i+1}. {device.get('title', 'No title')} (ID: {device.get('id', 'No ID')})")
                        print(f"     Enabled: {device.get('enabled', 'Unknown')}")
                        print(f"     Location: {device.get('location', 'Unknown')}")
                else:
                    print("❌ No devices found in response")
                    
                return devices
            else:
                print(f"❌ HTTP Error: {status_code}")
                print(f"Response: {response_text}")
                return None
                
    except Exception as e:
        print(f"❌ Error testing devices table: {e}")
        return None

def test_device_stats_view():
    """Test access to device_stats view"""
    print("\n🔍 Testing device_stats view access...")
    
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/device_stats",
            headers=headers
        )
        
        with urllib.request.urlopen(req, timeout=10.0) as response:
            status_code = response.getcode()
            response_text = response.read().decode('utf-8')
            
            print(f"Status: {status_code}")
            print(f"Response length: {len(response_text)}")
            
            if status_code == 200:
                view_data = json.loads(response_text)
                print(f"✅ Found {len(view_data)} records in device_stats view")
                
                if view_data:
                    print("\n📋 View record details:")
                    for i, record in enumerate(view_data):
                        print(f"  {i+1}. {record.get('title', 'No title')} (ID: {record.get('id', 'No ID')})")
                        print(f"     device_created_at: {record.get('device_created_at', 'Missing')}")
                        print(f"     total_readings: {record.get('total_readings', 'Missing')}")
                        print(f"     Available columns: {list(record.keys())[:10]}...")
                else:
                    print("❌ No records found in view")
                    
                return view_data
            else:
                print(f"❌ HTTP Error: {status_code}")
                print(f"Response: {response_text}")
                return None
                
    except Exception as e:
        print(f"❌ Error testing device_stats view: {e}")
        return None

def test_device_stats_with_ordering():
    """Test device_stats view with ordering"""
    print("\n🔍 Testing device_stats view with device_created_at ordering...")
    
    try:
        # Test the exact query that's failing in the app
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/device_stats?order=device_created_at.desc",
            headers=headers
        )
        
        with urllib.request.urlopen(req, timeout=10.0) as response:
            status_code = response.getcode()
            response_text = response.read().decode('utf-8')
            
            print(f"Status: {status_code}")
            
            if status_code == 200:
                view_data = json.loads(response_text)
                print(f"✅ Ordering by device_created_at works! Found {len(view_data)} records")
                return True
            else:
                print(f"❌ Ordering failed: {status_code}")
                print(f"Response: {response_text}")
                return False
                
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error with ordering: {e.code} - {e.reason}")
        error_body = e.read().decode('utf-8')
        print(f"Error details: {error_body}")
        return False
    except Exception as e:
        print(f"❌ Error testing ordering: {e}")
        return False

def test_sensor_data():
    """Test sensor data table"""
    print("\n🔍 Testing sensor_data table...")
    
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/sensor_data",
            headers=headers
        )
        
        with urllib.request.urlopen(req, timeout=10.0) as response:
            status_code = response.getcode()
            response_text = response.read().decode('utf-8')
            
            if status_code == 200:
                sensor_data = json.loads(response_text)
                print(f"✅ Found {len(sensor_data)} sensor readings")
                
                if sensor_data:
                    print("📋 Sample sensor data:")
                    for i, reading in enumerate(sensor_data[:3]):  # Show first 3
                        print(f"  {i+1}. Device: {reading.get('device_id', 'Unknown')}")
                        print(f"     Measurement: {reading.get('measurement', 'Unknown')}{reading.get('measurement_unit', '')}")
                        print(f"     Battery: {reading.get('battery', 'Unknown')}")
                        
                return sensor_data
            else:
                print(f"❌ Sensor data query failed: {status_code}")
                return None
                
    except Exception as e:
        print(f"❌ Error testing sensor data: {e}")
        return None

def main():
    """Main debugging function"""
    print("🚀 Debugging device fetching issues")
    print("=" * 60)
    
    # Test devices table
    devices = test_devices_table()
    
    # Test device_stats view
    view_data = test_device_stats_view()
    
    # Test ordering functionality
    ordering_works = test_device_stats_with_ordering()
    
    # Test sensor data
    sensor_data = test_sensor_data()
    
    print("\n" + "=" * 60)
    print("📋 Debug Summary:")
    print(f"  Devices table: {'✅ Working' if devices is not None else '❌ Failed'} ({len(devices) if devices else 0} records)")
    print(f"  Device_stats view: {'✅ Working' if view_data is not None else '❌ Failed'} ({len(view_data) if view_data else 0} records)")
    print(f"  View ordering: {'✅ Working' if ordering_works else '❌ Failed'}")
    print(f"  Sensor data: {'✅ Working' if sensor_data is not None else '❌ Failed'} ({len(sensor_data) if sensor_data else 0} records)")
    
    # Analysis
    print("\n💡 Analysis:")
    if devices and len(devices) > 0:
        print("✅ Devices exist in the database")
        if view_data is None or len(view_data) == 0:
            print("❌ Device_stats view is not returning data - this is likely the issue!")
            print("   The view might not be properly joining data or there's a permissions issue")
        elif not ordering_works:
            print("❌ Ordering by device_created_at is failing - column might not exist in view")
        else:
            print("✅ Everything should be working - check React app for other issues")
    else:
        print("❌ No devices in database - need to check why device creation appeared successful but data isn't persisting")

if __name__ == "__main__":
    main()