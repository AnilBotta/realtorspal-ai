#!/usr/bin/env python3
"""
Debug script for partial leads API endpoints
"""

import requests
import json

# Use the production URL
BASE_URL = "https://crm-partial-leads.preview.emergentagent.com/api"

def test_partial_leads_endpoints():
    print("🔍 Testing Partial Leads API Endpoints...")
    
    # Test 1: GET /api/partial-leads
    print("\n1. Testing GET /api/partial-leads")
    try:
        response = requests.get(f"{BASE_URL}/partial-leads", timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:500]}...")
        if response.status_code == 200:
            data = response.json()
            print(f"   Found {len(data)} partial leads")
            if len(data) > 0:
                print(f"   First partial lead ID: {data[0].get('id', 'No ID')}")
                return data[0].get('id')  # Return first ID for further testing
    except Exception as e:
        print(f"   Exception: {e}")
    
    # Test 2: GET /api/partial-leads/{lead_id} with non-existent ID
    print("\n2. Testing GET /api/partial-leads/non-existent-id")
    try:
        response = requests.get(f"{BASE_URL}/partial-leads/non-existent-id", timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   Exception: {e}")
    
    # Test 2b: GET /api/partial-leads/{lead_id} with real ID
    print("\n2b. Testing GET /api/partial-leads/ed436bf7-f679-4a5e-99eb-1c9d57dd488e")
    try:
        response = requests.get(f"{BASE_URL}/partial-leads/ed436bf7-f679-4a5e-99eb-1c9d57dd488e", timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:500]}...")
    except Exception as e:
        print(f"   Exception: {e}")
    
    # Test 3: POST /api/partial-leads/{lead_id}/convert with non-existent ID
    print("\n3. Testing POST /api/partial-leads/non-existent-id/convert")
    try:
        payload = {
            "user_id": "03f82986-51af-460c-a549-1c5077e67fb0",
            "first_name": "Test",
            "last_name": "Convert",
            "email": "test@example.com",
            "phone": "+14155551234"
        }
        response = requests.post(f"{BASE_URL}/partial-leads/non-existent-id/convert", 
                               json=payload, timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   Exception: {e}")
    
    # Test 4: POST /api/partial-leads/{lead_id}/convert with invalid phone
    print("\n4. Testing POST /api/partial-leads/test-id/convert with invalid phone")
    try:
        payload = {
            "user_id": "03f82986-51af-460c-a549-1c5077e67fb0",
            "first_name": "Test",
            "last_name": "Invalid",
            "email": "test@example.com",
            "phone": "invalid-phone"  # This should trigger validation error
        }
        response = requests.post(f"{BASE_URL}/partial-leads/test-id/convert", 
                               json=payload, timeout=10)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   Exception: {e}")

if __name__ == "__main__":
    test_partial_leads_endpoints()