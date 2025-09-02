#!/usr/bin/env python3
"""
Backend API Smoke Test for RealtorsPal AI
Tests all endpoints defined in /app/backend/server.py
"""

import requests
import sys
import json
from typing import Optional, Dict, Any

class RealtorsPalAPITester:
    def __init__(self, base_url: str = "http://localhost:8001/api"):
        # Direct backend URL for testing
        self.base_url = base_url
        self.user_id: Optional[str] = None
        self.token: Optional[str] = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_lead_id: Optional[str] = None

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED {details}")
        else:
            print(f"❌ {name}: FAILED {details}")

    def test_health(self) -> bool:
        """Test GET /api/health"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            success = response.status_code == 200 and response.json().get("status") == "ok"
            self.log_test("Health Check", success, f"Status: {response.status_code}, Response: {response.json()}")
            return success
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
            return False

    def test_login(self) -> bool:
        """Test POST /api/auth/login with demo credentials"""
        try:
            payload = {"email": "demo@realtorspal.ai", "password": "Demo123!"}
            response = requests.post(f"{self.base_url}/auth/login", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "user" in data and "token" in data and "id" in data["user"]:
                    self.user_id = data["user"]["id"]
                    self.token = data["token"]
                    self.log_test("Login", True, f"User ID: {self.user_id}, Token: {self.token}")
                    return True
                else:
                    self.log_test("Login", False, f"Missing user/token in response: {data}")
                    return False
            else:
                self.log_test("Login", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Login", False, f"Exception: {str(e)}")
            return False

    def test_get_leads(self) -> bool:
        """Test GET /api/leads?user_id=<user_id>"""
        if not self.user_id:
            self.log_test("Get Leads", False, "No user_id available")
            return False
        
        try:
            response = requests.get(f"{self.base_url}/leads", params={"user_id": self.user_id}, timeout=10)
            
            if response.status_code == 200:
                leads = response.json()
                if isinstance(leads, list) and len(leads) >= 5:
                    self.log_test("Get Leads", True, f"Found {len(leads)} seeded leads")
                    return True
                else:
                    self.log_test("Get Leads", False, f"Expected array with >=5 leads, got: {leads}")
                    return False
            else:
                self.log_test("Get Leads", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Leads", False, f"Exception: {str(e)}")
            return False

    def test_create_lead(self) -> bool:
        """Test POST /api/leads"""
        if not self.user_id:
            self.log_test("Create Lead", False, "No user_id available")
            return False
        
        try:
            payload = {"name": "Test Lead API", "user_id": self.user_id}
            response = requests.post(f"{self.base_url}/leads", json=payload, timeout=10)
            
            if response.status_code == 200:
                lead = response.json()
                if "id" in lead and "name" in lead and lead["name"] == "Test Lead API":
                    self.created_lead_id = lead["id"]
                    self.log_test("Create Lead", True, f"Created lead with ID: {self.created_lead_id}")
                    return True
                else:
                    self.log_test("Create Lead", False, f"Invalid lead response: {lead}")
                    return False
            else:
                self.log_test("Create Lead", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Create Lead", False, f"Exception: {str(e)}")
            return False

    def test_update_lead_stage(self) -> bool:
        """Test PUT /api/leads/{lead_id}/stage"""
        if not self.created_lead_id:
            self.log_test("Update Lead Stage", False, "No created lead ID available")
            return False
        
        try:
            payload = {"stage": "Contacted"}
            response = requests.put(f"{self.base_url}/leads/{self.created_lead_id}/stage", json=payload, timeout=10)
            
            if response.status_code == 200:
                lead = response.json()
                if lead.get("stage") == "Contacted":
                    self.log_test("Update Lead Stage", True, f"Updated lead stage to: {lead['stage']}")
                    return True
                else:
                    self.log_test("Update Lead Stage", False, f"Stage not updated correctly: {lead}")
                    return False
            else:
                self.log_test("Update Lead Stage", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Update Lead Stage", False, f"Exception: {str(e)}")
            return False

    def test_analytics_dashboard(self) -> bool:
        """Test GET /api/analytics/dashboard?user_id=<user_id>"""
        if not self.user_id:
            self.log_test("Analytics Dashboard", False, "No user_id available")
            return False
        
        try:
            response = requests.get(f"{self.base_url}/analytics/dashboard", params={"user_id": self.user_id}, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "total_leads" in data and "by_stage" in data and data["total_leads"] >= 1:
                    self.log_test("Analytics Dashboard", True, f"Total leads: {data['total_leads']}, By stage: {data['by_stage']}")
                    return True
                else:
                    self.log_test("Analytics Dashboard", False, f"Invalid analytics response: {data}")
                    return False
            else:
                self.log_test("Analytics Dashboard", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Analytics Dashboard", False, f"Exception: {str(e)}")
            return False

    def test_get_settings(self) -> bool:
        """Test GET /api/settings?user_id=<user_id>"""
        if not self.user_id:
            self.log_test("Get Settings", False, "No user_id available")
            return False
        
        try:
            response = requests.get(f"{self.base_url}/settings", params={"user_id": self.user_id}, timeout=10)
            
            if response.status_code == 200:
                settings = response.json()
                if "user_id" in settings:
                    self.log_test("Get Settings", True, f"Settings retrieved: {settings}")
                    return True
                else:
                    self.log_test("Get Settings", False, f"Invalid settings response: {settings}")
                    return False
            else:
                self.log_test("Get Settings", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Get Settings", False, f"Exception: {str(e)}")
            return False

    def test_save_settings(self) -> bool:
        """Test POST /api/settings with dummy keys"""
        if not self.user_id:
            self.log_test("Save Settings", False, "No user_id available")
            return False
        
        try:
            payload = {
                "user_id": self.user_id,
                "openai_api_key": "test-openai-key",
                "anthropic_api_key": "test-anthropic-key",
                "gemini_api_key": "test-gemini-key"
            }
            response = requests.post(f"{self.base_url}/settings", json=payload, timeout=10)
            
            if response.status_code == 200:
                settings = response.json()
                if (settings.get("openai_api_key") == "test-openai-key" and 
                    settings.get("anthropic_api_key") == "test-anthropic-key"):
                    self.log_test("Save Settings", True, f"Settings saved successfully: {settings}")
                    return True
                else:
                    self.log_test("Save Settings", False, f"Settings not persisted correctly: {settings}")
                    return False
            else:
                self.log_test("Save Settings", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Save Settings", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self) -> bool:
        """Run all backend API tests"""
        print("🚀 Starting RealtorsPal AI Backend API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Test in logical order
        tests = [
            self.test_health,
            self.test_login,
            self.test_get_leads,
            self.test_create_lead,
            self.test_update_lead_stage,
            self.test_analytics_dashboard,
            self.test_get_settings,
            self.test_save_settings,
        ]
        
        for test in tests:
            test()
        
        print("=" * 60)
        print(f"📊 Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All backend API tests PASSED!")
            return True
        else:
            print("⚠️  Some backend API tests FAILED!")
            return False

def main():
    tester = RealtorsPalAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())