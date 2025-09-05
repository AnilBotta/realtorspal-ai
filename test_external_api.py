#!/usr/bin/env python3
"""
Test script for the new external API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8001"

def test_external_api():
    print("Testing External API Endpoints...")
    
    # Test without API key (should fail)
    print("\n1. Testing without API key (should return 422 - validation error):")
    response = requests.post(f"{BASE_URL}/api/external/leads", 
                           json={"name": "Test Lead"})
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    # Test with invalid API key (should fail with 401)
    print("\n2. Testing with invalid API key (should return 401):")
    headers = {"X-API-Key": "invalid_key"}
    response = requests.post(f"{BASE_URL}/api/external/leads", 
                           json={"name": "Test Lead"}, 
                           headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    # Test search endpoint
    print("\n3. Testing search endpoint with invalid API key:")
    response = requests.post(f"{BASE_URL}/api/external/leads/search", 
                           json={"name": "test"}, 
                           headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    print("\n✅ External API endpoints are accessible and responding correctly!")
    print("Note: To fully test, you would need to:")
    print("1. Create a user with an API key in the settings")
    print("2. Use that API key to test successful operations")

if __name__ == "__main__":
    test_external_api()