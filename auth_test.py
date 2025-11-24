#!/usr/bin/env python3
"""
Marketing Site Auth Integration Test
Tests the fix for 405 errors on /auth/signup and /auth/login endpoints
"""

import requests
import sys
import json
import time
from datetime import datetime

class AuthTester:
    def __init__(self):
        # Read the production URL from frontend .env
        try:
            with open('/app/frontend/.env', 'r') as f:
                for line in f:
                    if line.startswith('REACT_APP_BACKEND_URL='):
                        frontend_url = line.split('=', 1)[1].strip()
                        self.base_url = f"{frontend_url}/api"
                        break
        except:
            self.base_url = "http://localhost:8001/api"  # fallback
        
        self.tests_run = 0
        self.tests_passed = 0

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED {details}")
        else:
            print(f"❌ {name}: FAILED {details}")

    def test_auth_signup_correct_endpoint(self) -> bool:
        """Test POST /api/auth/signup - Marketing site auth integration fix verification"""
        try:
            # Test the CORRECT endpoint that should work after the fix
            # Use timestamp to ensure unique email
            import time
            timestamp = int(time.time())
            payload = {
                "email": f"test-marketing-auth-{timestamp}@realtorspal.com",
                "password": "TestPass123!",
                "first_name": "Marketing",
                "last_name": "Test",
                "company": "Test Realty"
            }
            response = requests.post(f"{self.base_url}/auth/signup", json=payload, timeout=10)
            
            if response.status_code in [200, 201]:
                data = response.json()
                # Verify response contains required fields
                if ("access_token" in data and 
                    "refresh_token" in data and 
                    "user" in data):
                    
                    user_data = data.get("user", {})
                    if ("id" in user_data and 
                        user_data.get("email") == "test-marketing-auth@realtorspal.com"):
                        
                        self.log_test("Auth Signup Correct Endpoint", True, 
                                    f"Signup successful. User ID: {user_data.get('id')}, "
                                    f"Has tokens: access_token={bool(data.get('access_token'))}, "
                                    f"refresh_token={bool(data.get('refresh_token'))}")
                        return True
                    else:
                        self.log_test("Auth Signup Correct Endpoint", False, 
                                    f"Invalid user data in response: {user_data}")
                        return False
                else:
                    self.log_test("Auth Signup Correct Endpoint", False, 
                                f"Missing required fields in response: {data}")
                    return False
            else:
                self.log_test("Auth Signup Correct Endpoint", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Auth Signup Correct Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_auth_login_correct_endpoint(self) -> bool:
        """Test POST /api/auth/login - Marketing site auth integration fix verification"""
        try:
            # Test the CORRECT endpoint that should work after the fix
            payload = {
                "email": "test-marketing-auth@realtorspal.com",
                "password": "TestPass123!"
            }
            response = requests.post(f"{self.base_url}/auth/login", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                # Verify response contains required fields
                if ("access_token" in data and 
                    "refresh_token" in data and 
                    "user" in data):
                    
                    user_data = data.get("user", {})
                    if ("id" in user_data and 
                        user_data.get("email") == "test-marketing-auth@realtorspal.com"):
                        
                        self.log_test("Auth Login Correct Endpoint", True, 
                                    f"Login successful. User ID: {user_data.get('id')}, "
                                    f"Has tokens: access_token={bool(data.get('access_token'))}, "
                                    f"refresh_token={bool(data.get('refresh_token'))}")
                        return True
                    else:
                        self.log_test("Auth Login Correct Endpoint", False, 
                                    f"Invalid user data in response: {user_data}")
                        return False
                else:
                    self.log_test("Auth Login Correct Endpoint", False, 
                                f"Missing required fields in response: {data}")
                    return False
            else:
                self.log_test("Auth Login Correct Endpoint", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Auth Login Correct Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_auth_signup_incorrect_endpoint(self) -> bool:
        """Test POST /auth/signup (without /api prefix) - Should return 404 to confirm fix"""
        try:
            # Test the OLD INCORRECT endpoint that was causing 405 errors
            # After the fix, this should return 404 (endpoint doesn't exist)
            payload = {
                "email": "test-old-endpoint@realtorspal.com",
                "password": "TestPass123!",
                "first_name": "Old",
                "last_name": "Endpoint"
            }
            
            # Remove /api from base_url to test the old incorrect path
            old_base_url = self.base_url.replace('/api', '')
            response = requests.post(f"{old_base_url}/auth/signup", json=payload, timeout=10)
            
            if response.status_code == 404:
                self.log_test("Auth Signup Incorrect Endpoint", True, 
                            f"Old endpoint correctly returns 404 (endpoint doesn't exist). "
                            f"This confirms the fix - frontend now calls /api/auth/signup instead of /auth/signup")
                return True
            elif response.status_code == 405:
                self.log_test("Auth Signup Incorrect Endpoint", False, 
                            f"Still getting 405 Method Not Allowed - the original issue persists")
                return False
            else:
                self.log_test("Auth Signup Incorrect Endpoint", False, 
                            f"Unexpected status code: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Auth Signup Incorrect Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_auth_login_incorrect_endpoint(self) -> bool:
        """Test POST /auth/login (without /api prefix) - Should return 404 to confirm fix"""
        try:
            # Test the OLD INCORRECT endpoint that was causing 405 errors
            # After the fix, this should return 404 (endpoint doesn't exist)
            payload = {
                "email": "test-old-endpoint@realtorspal.com",
                "password": "TestPass123!"
            }
            
            # Remove /api from base_url to test the old incorrect path
            old_base_url = self.base_url.replace('/api', '')
            response = requests.post(f"{old_base_url}/auth/login", json=payload, timeout=10)
            
            if response.status_code == 404:
                self.log_test("Auth Login Incorrect Endpoint", True, 
                            f"Old endpoint correctly returns 404 (endpoint doesn't exist). "
                            f"This confirms the fix - frontend now calls /api/auth/login instead of /auth/login")
                return True
            elif response.status_code == 405:
                self.log_test("Auth Login Incorrect Endpoint", False, 
                            f"Still getting 405 Method Not Allowed - the original issue persists")
                return False
            else:
                self.log_test("Auth Login Incorrect Endpoint", False, 
                            f"Unexpected status code: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Auth Login Incorrect Endpoint", False, f"Exception: {str(e)}")
            return False

    def run_auth_tests(self):
        """Run all auth tests"""
        print("🔐 Marketing Site Auth Integration Test")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        print("Testing the fix for 405 errors on /auth/signup and /auth/login")
        print("=" * 60)
        
        # Run tests in order
        self.test_auth_signup_correct_endpoint()
        self.test_auth_login_correct_endpoint()
        self.test_auth_signup_incorrect_endpoint()
        self.test_auth_login_incorrect_endpoint()
        
        print("=" * 60)
        print(f"📊 Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All auth tests PASSED! Marketing site auth integration fix is working correctly.")
            return True
        else:
            print("⚠️  Some auth tests FAILED!")
            return False

if __name__ == "__main__":
    tester = AuthTester()
    success = tester.run_auth_tests()
    sys.exit(0 if success else 1)