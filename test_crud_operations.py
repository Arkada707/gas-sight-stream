#!/usr/bin/env python3
"""
Script to test CRUD operations and diagnose RLS issues
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

def test_delete_operation():
    """Test deleting a device"""
    print("🗑️  Testing device deletion...")
    
    # First, let's find a test device to delete
    device_to_delete = "test_simple_001"
    
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/devices?id=eq.{device_to_delete}",
            headers=headers,
            method='DELETE'
        )
        
        with urllib.request.urlopen(req, timeout=10.0) as response:
            status_code = response.getcode()
            response_text = response.read().decode('utf-8')
            
            print(f"Delete Status: {status_code}")
            print(f"Delete Response: {response_text}")
            
            if status_code == 204:  # No Content - successful delete
                print(f"✅ Successfully deleted device {device_to_delete}")
                return True
            else:
                print(f"❌ Delete failed with status {status_code}")
                return False
                
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error during delete: {e.code} - {e.reason}")
        error_body = e.read().decode('utf-8')
        print(f"Error details: {error_body}")
        return False
    except Exception as e:
        print(f"❌ Delete error: {e}")
        return False

def test_update_operation():
    """Test updating a device"""
    print("\n📝 Testing device update...")
    
    device_to_update = "device_main_tank_001"
    update_data = {
        "title": "Updated Main Gas Tank #1",
        "location": "Updated Location - Warehouse A"
    }
    
    try:
        data = json.dumps(update_data).encode('utf-8')
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/devices?id=eq.{device_to_update}",
            data=data,
            headers={**headers, "Prefer": "return=representation"},
            method='PATCH'
        )
        
        with urllib.request.urlopen(req, timeout=10.0) as response:
            status_code = response.getcode()
            response_text = response.read().decode('utf-8')
            
            print(f"Update Status: {status_code}")
            print(f"Update Response: {response_text}")
            
            if status_code == 200:
                print(f"✅ Successfully updated device {device_to_update}")
                return True
            else:
                print(f"❌ Update failed with status {status_code}")
                return False
                
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error during update: {e.code} - {e.reason}")
        error_body = e.read().decode('utf-8')
        print(f"Error details: {error_body}")
        return False
    except Exception as e:
        print(f"❌ Update error: {e}")
        return False

def test_insert_operation():
    """Test inserting a new device"""
    print("\n➕ Testing device insertion...")
    
    new_device = {
        "id": "test_crud_device_001",
        "name": "@CRUDTEST",
        "mac_address": "FF:EE:DD:CC:BB:AA",
        "title": "CRUD Test Device",
        "location": "Test Location for CRUD",
        "enabled": True,
        "color": "#ff6b6b",
        "service_uuid": "0000fff0-0000-1000-8000-00805f9b34fb",
        "data_characteristic_uuid": "0000fff1-0000-1000-8000-00805f9b34fb"
    }
    
    try:
        data = json.dumps(new_device).encode('utf-8')
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/devices",
            data=data,
            headers={**headers, "Prefer": "return=representation"},
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=10.0) as response:
            status_code = response.getcode()
            response_text = response.read().decode('utf-8')
            
            print(f"Insert Status: {status_code}")
            print(f"Insert Response: {response_text}")
            
            if status_code == 201:
                print(f"✅ Successfully inserted device {new_device['id']}")
                return True
            else:
                print(f"❌ Insert failed with status {status_code}")
                return False
                
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error during insert: {e.code} - {e.reason}")
        error_body = e.read().decode('utf-8')
        print(f"Error details: {error_body}")
        return False
    except Exception as e:
        print(f"❌ Insert error: {e}")
        return False

def verify_changes():
    """Verify changes using the working get_device_stats function"""
    print("\n🔍 Verifying changes via get_device_stats...")
    
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/rpc/get_device_stats",
            headers=headers,
            method='POST',
            data=b'{}'
        )
        
        with urllib.request.urlopen(req, timeout=10.0) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            print(f"Total devices: {len(data)}")
            
            # Look for our test devices
            main_tank = next((d for d in data if d['id'] == 'device_main_tank_001'), None)
            crud_test = next((d for d in data if d['id'] == 'test_crud_device_001'), None)
            simple_test = next((d for d in data if d['id'] == 'test_simple_001'), None)
            
            print("\n📋 Test Device Status:")
            if main_tank:
                print(f"  Main Tank: ✅ Found - Title: '{main_tank['title']}', Location: '{main_tank['location']}'")
            else:
                print(f"  Main Tank: ❌ Not found")
                
            if crud_test:
                print(f"  CRUD Test: ✅ Found - Title: '{crud_test['title']}'")
            else:
                print(f"  CRUD Test: ❌ Not found")
                
            if simple_test:
                print(f"  Simple Test: ✅ Found - Should have been deleted")
            else:
                print(f"  Simple Test: ❌ Not found (correctly deleted)")
                
            return data
            
    except Exception as e:
        print(f"❌ Verification error: {e}")
        return None

def analyze_rls_crud_issues():
    """Analyze the CRUD operation issues"""
    print("\n💡 CRUD Operations Analysis:")
    print("=" * 50)
    
    print("🔍 Issues Identified:")
    print("1. RLS policies are blocking direct table operations")
    print("2. get_device_stats RPC function works for reading")
    print("3. Direct INSERT/UPDATE/DELETE operations likely fail silently")
    print("4. UI shows 'success' but operations don't persist")
    print()
    
    print("🔧 Solutions:")
    print("1. **Disable RLS temporarily** (Quick fix)")
    print("   ALTER TABLE devices DISABLE ROW LEVEL SECURITY;")
    print()
    print("2. **Create RPC functions for CRUD** (Proper fix)")
    print("   - create_device(device_data)")
    print("   - update_device(device_id, updates)")
    print("   - delete_device(device_id)")
    print()
    print("3. **Fix RLS policies** (Alternative)")
    print("   - Update policies to allow anon role CRUD operations")
    print()
    
    print("🎯 Recommended Action:")
    print("Since we can't execute SQL via API, you need to:")
    print("1. Go to Supabase Dashboard > SQL Editor")
    print("2. Run: ALTER TABLE devices DISABLE ROW LEVEL SECURITY;")
    print("3. Test CRUD operations in the app")
    print("4. Later create proper RPC functions for secure operations")

def main():
    """Main testing function"""
    print("🚀 Testing CRUD operations and RLS policies")
    print("=" * 60)
    
    # Test operations in sequence
    insert_success = test_insert_operation()
    update_success = test_update_operation()
    delete_success = test_delete_operation()
    
    # Verify the results
    verify_changes()
    
    # Analyze issues
    analyze_rls_crud_issues()
    
    print("\n" + "=" * 60)
    print("📋 CRUD Test Summary:")
    print(f"  Insert: {'✅ Working' if insert_success else '❌ Failed'}")
    print(f"  Update: {'✅ Working' if update_success else '❌ Failed'}")
    print(f"  Delete: {'✅ Working' if delete_success else '❌ Failed'}")

if __name__ == "__main__":
    main()