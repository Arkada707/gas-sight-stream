#!/usr/bin/env python3
"""
Script to check RLS policies and debug database access
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

def test_simple_device_insert():
    """Try inserting a very simple device"""
    print("🔍 Testing simple device insert...")
    
    simple_device = {
        "id": "test_simple_001",
        "name": "TestDevice",
        "mac_address": "AA:BB:CC:DD:EE:99", 
        "title": "Simple Test Device",
        "service_uuid": "0000fff0-0000-1000-8000-00805f9b34fb",
        "data_characteristic_uuid": "0000fff1-0000-1000-8000-00805f9b34fb"
    }
    
    try:
        data = json.dumps(simple_device).encode('utf-8')
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/devices",
            data=data,
            headers=headers,
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=10.0) as response:
            status_code = response.getcode()
            response_text = response.read().decode('utf-8')
            print(f"Insert Status: {status_code}")
            print(f"Insert Response: {response_text}")
            
            if status_code in [200, 201]:
                print("✅ Simple device insert successful")
                return True
            else:
                print(f"❌ Simple device insert failed")
                return False
                
    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error: {e.code} - {e.reason}")
        error_body = e.read().decode('utf-8')
        print(f"Error details: {error_body}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_device_query_variations():
    """Try different ways to query devices"""
    print("\n🔍 Testing device query variations...")
    
    query_variations = [
        "/rest/v1/devices",
        "/rest/v1/devices?select=*",
        "/rest/v1/devices?select=id,title,name",
        "/rest/v1/devices?limit=10"
    ]
    
    for query in query_variations:
        print(f"\n📋 Testing query: {query}")
        try:
            req = urllib.request.Request(
                f"{SUPABASE_URL}{query}",
                headers=headers
            )
            
            with urllib.request.urlopen(req, timeout=10.0) as response:
                status_code = response.getcode()
                response_text = response.read().decode('utf-8')
                
                print(f"  Status: {status_code}")
                if status_code == 200:
                    data = json.loads(response_text)
                    print(f"  Records: {len(data)}")
                    if data:
                        print(f"  Sample: {data[0].get('title', 'No title')}")
                else:
                    print(f"  Error: {response_text}")
                    
        except Exception as e:
            print(f"  Exception: {e}")

def test_specific_device_lookup():
    """Look for specific devices by ID"""
    print("\n🔍 Testing specific device lookups...")
    
    device_ids = [
        "device_main_tank_001",
        "device_backup_tank_002", 
        "device_emergency_tank_003",
        "test_simple_001"
    ]
    
    for device_id in device_ids:
        print(f"\n📋 Looking for device: {device_id}")
        try:
            req = urllib.request.Request(
                f"{SUPABASE_URL}/rest/v1/devices?id=eq.{device_id}",
                headers=headers
            )
            
            with urllib.request.urlopen(req, timeout=10.0) as response:
                status_code = response.getcode()
                response_text = response.read().decode('utf-8')
                
                if status_code == 200:
                    data = json.loads(response_text)
                    if data:
                        print(f"  ✅ Found: {data[0].get('title', 'No title')}")
                        print(f"  Details: enabled={data[0].get('enabled')}, location={data[0].get('location')}")
                    else:
                        print(f"  ❌ Not found")
                else:
                    print(f"  ❌ Query failed: {status_code}")
                    
        except Exception as e:
            print(f"  ❌ Exception: {e}")

def test_count_query():
    """Test count query to see if RLS is filtering results"""
    print("\n🔍 Testing count query...")
    
    try:
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/devices?select=count",
            headers={**headers, "Prefer": "count=exact"}
        )
        
        with urllib.request.urlopen(req, timeout=10.0) as response:
            status_code = response.getcode()
            count_header = response.headers.get('Content-Range', 'Unknown')
            response_text = response.read().decode('utf-8')
            
            print(f"Status: {status_code}")
            print(f"Content-Range: {count_header}")
            print(f"Response: {response_text}")
            
            if 'Content-Range' in response.headers:
                # Content-Range format: "0-24/3573" where 3573 is total count
                range_info = response.headers['Content-Range']
                if '/' in range_info:
                    total_count = range_info.split('/')[-1]
                    print(f"Total device count: {total_count}")
                    
    except Exception as e:
        print(f"Count query error: {e}")

def main():
    """Main debugging function"""
    print("🚀 Debugging RLS policies and database access")
    print("=" * 60)
    
    # Test simple insert
    insert_success = test_simple_device_insert()
    
    # Test query variations
    test_device_query_variations()
    
    # Test specific lookups
    test_specific_device_lookup()
    
    # Test count query
    test_count_query()
    
    print("\n" + "=" * 60)
    print("💡 Debugging Analysis:")
    if insert_success:
        print("✅ Device insertion works")
        print("❌ But queries return no results - likely RLS policy issue")
        print("🔧 Suggestion: Check RLS policies in Supabase dashboard")
        print("   The 'Allow all operations' policy might not be working correctly")
    else:
        print("❌ Device insertion is failing")
        print("🔧 Check database permissions and constraints")

if __name__ == "__main__":
    main()