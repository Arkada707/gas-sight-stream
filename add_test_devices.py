#!/usr/bin/env python3
"""
Script to add test devices to the database
"""
import urllib.request
import urllib.parse
import json
import time

# Supabase configuration
SUPABASE_URL = "https://jjjcevuwigroasnyxohj.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqamNldnV3aWdyb2Fzbnl4b2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNzc3MzQsImV4cCI6MjA2OTk1MzczNH0.s5mdXvUN3fgxHHOZnjtFQn2UsAUq9euS9ML0BYs9nUg"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def create_test_devices():
    """Create several test devices"""
    print("📝 Creating test devices...")
    
    test_devices = [
        {
            "id": "device_main_tank_001",
            "name": "@TNK21B3A6",
            "mac_address": "C5:BA:A0:16:CF:65",
            "title": "Main Gas Tank #1",
            "location": "Warehouse A - Section 1",
            "enabled": True,
            "color": "#22c55e",
            "service_uuid": "0000fff0-0000-1000-8000-00805f9b34fb",
            "data_characteristic_uuid": "0000fff1-0000-1000-8000-00805f9b34fb"
        },
        {
            "id": "device_backup_tank_002",
            "name": "@TNK98X5Z2",
            "mac_address": "D6:CB:B1:27:D0:76",
            "title": "Backup Gas Tank #2",
            "location": "Warehouse B - Section 3",
            "enabled": True,
            "color": "#3b82f6",
            "service_uuid": "0000fff0-0000-1000-8000-00805f9b34fb",
            "data_characteristic_uuid": "0000fff1-0000-1000-8000-00805f9b34fb"
        },
        {
            "id": "device_emergency_tank_003",
            "name": "@TNK44K8M1",
            "mac_address": "E7:DC:C2:38:E1:87",
            "title": "Emergency Gas Tank #3",
            "location": "Emergency Station - Floor 2",
            "enabled": False,
            "color": "#f59e0b",
            "service_uuid": "0000fff0-0000-1000-8000-00805f9b34fb",
            "data_characteristic_uuid": "0000fff1-0000-1000-8000-00805f9b34fb"
        }
    ]
    
    created_count = 0
    
    for device in test_devices:
        try:
            data = json.dumps(device).encode('utf-8')
            req = urllib.request.Request(
                f"{SUPABASE_URL}/rest/v1/devices",
                data=data,
                headers=headers,
                method='POST'
            )
            
            with urllib.request.urlopen(req, timeout=10.0) as response:
                status_code = response.getcode()
                response_text = response.read().decode('utf-8')
                if status_code in [200, 201]:
                    print(f"✅ Created device: {device['title']}")
                    print(f"   Response: {response_text}")
                    created_count += 1
                else:
                    print(f"❌ Failed to create {device['title']}: {status_code}")
                    print(f"   Response: {response_text}")
        except urllib.error.HTTPError as e:
            if e.code == 409:
                print(f"⚠️  Device {device['title']} already exists (skipping)")
                created_count += 1
            else:
                print(f"❌ HTTP Error creating {device['title']}: {e.code} - {e.reason}")
                error_body = e.read().decode('utf-8')
                print(f"   Error details: {error_body}")
        except Exception as e:
            print(f"❌ Error creating {device['title']}: {e}")
    
    return created_count

def add_test_sensor_data():
    """Add some test sensor data for the devices"""
    print("\n📊 Adding test sensor data...")
    
    test_sensor_data = [
        {
            "device_id": "device_main_tank_001",
            "title_name": "Main Gas Tank #1",
            "tank_level": 68.5,
            "tank_level_unit": "cm",
            "updated_refresh": "2 minutes ago",
            "battery": "Full",
            "connection_strength": 95,
            "measurement": 82.3,
            "measurement_unit": "%",
            "technical_data": {
                "timestamp": "2025-08-14T14:30:00Z",
                "source": "test_script",
                "signal_quality": "excellent"
            }
        },
        {
            "device_id": "device_backup_tank_002", 
            "title_name": "Backup Gas Tank #2",
            "tank_level": 45.2,
            "tank_level_unit": "cm",
            "updated_refresh": "5 minutes ago",
            "battery": "Ok",
            "connection_strength": 78,
            "measurement": 54.6,
            "measurement_unit": "%",
            "technical_data": {
                "timestamp": "2025-08-14T14:27:00Z",
                "source": "test_script",
                "signal_quality": "good"
            }
        },
        {
            "device_id": "device_emergency_tank_003",
            "title_name": "Emergency Gas Tank #3", 
            "tank_level": 89.1,
            "tank_level_unit": "cm",
            "updated_refresh": "10 minutes ago",
            "battery": "Low",
            "connection_strength": 45,
            "measurement": 91.2,
            "measurement_unit": "%",
            "technical_data": {
                "timestamp": "2025-08-14T14:22:00Z",
                "source": "test_script",
                "signal_quality": "poor"
            }
        }
    ]
    
    added_count = 0
    
    for sensor_data in test_sensor_data:
        try:
            data = json.dumps(sensor_data).encode('utf-8')
            req = urllib.request.Request(
                f"{SUPABASE_URL}/rest/v1/sensor_data",
                data=data,
                headers=headers,
                method='POST'
            )
            
            with urllib.request.urlopen(req, timeout=10.0) as response:
                status_code = response.getcode()
                if status_code in [200, 201]:
                    print(f"✅ Added sensor data for: {sensor_data['title_name']}")
                    added_count += 1
                else:
                    print(f"❌ Failed to add sensor data for {sensor_data['title_name']}: {status_code}")
                    response_text = response.read().decode('utf-8')
                    print(f"   Response: {response_text}")
        except Exception as e:
            print(f"❌ Error adding sensor data for {sensor_data['title_name']}: {e}")
    
    return added_count

def verify_data():
    """Verify that the data was added successfully"""
    print("\n🔍 Verifying created data...")
    
    try:
        # Check devices
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/devices",
            headers=headers
        )
        
        with urllib.request.urlopen(req, timeout=10.0) as response:
            status_code = response.getcode()
            if status_code == 200:
                devices = json.loads(response.read().decode('utf-8'))
                print(f"✅ Found {len(devices)} devices in database")
                for device in devices:
                    print(f"   - {device['title']} (ID: {device['id']})")
            else:
                print(f"❌ Failed to verify devices: {status_code}")
    except Exception as e:
        print(f"❌ Error verifying devices: {e}")
    
    try:
        # Check sensor data
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/sensor_data",
            headers=headers
        )
        
        with urllib.request.urlopen(req, timeout=10.0) as response:
            status_code = response.getcode()
            if status_code == 200:
                sensor_data = json.loads(response.read().decode('utf-8'))
                print(f"✅ Found {len(sensor_data)} sensor readings in database")
            else:
                print(f"❌ Failed to verify sensor data: {status_code}")
    except Exception as e:
        print(f"❌ Error verifying sensor data: {e}")

def main():
    """Main function"""
    print("🚀 Adding test devices and sensor data")
    print("=" * 50)
    
    # Create test devices
    devices_created = create_test_devices()
    
    # Add test sensor data
    sensor_data_added = add_test_sensor_data()
    
    # Verify the data
    verify_data()
    
    print("\n" + "=" * 50)
    print("📋 Summary:")
    print(f"  Devices Created: {devices_created}")
    print(f"  Sensor Data Added: {sensor_data_added}")
    print("\n🎉 Test data setup complete!")
    print("You should now see devices in the Device Management page.")

if __name__ == "__main__":
    main()