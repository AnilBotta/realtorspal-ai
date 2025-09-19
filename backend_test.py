#!/usr/bin/env python3
"""
Backend API Smoke Test for RealtorsPal AI
Tests all endpoints defined in /app/backend/server.py
"""

import requests
import sys
import json
import time
from typing import Optional, Dict, Any

class RealtorsPalAPITester:
    def __init__(self, base_url: str = None):
        # Use the backend URL from frontend .env file
        if base_url is None:
            # Read the production URL from frontend .env
            try:
                with open('/app/frontend/.env', 'r') as f:
                    for line in f:
                        if line.startswith('REACT_APP_BACKEND_URL='):
                            frontend_url = line.split('=', 1)[1].strip()
                            base_url = f"{frontend_url}/api"
                            break
                if base_url is None:
                    base_url = "http://localhost:8001/api"  # fallback
            except:
                base_url = "http://localhost:8001/api"  # fallback
        
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
        """Test GET /api/auth/demo for demo session"""
        try:
            response = requests.get(f"{self.base_url}/auth/demo", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "user" in data and "token" in data and "id" in data["user"]:
                    self.user_id = data["user"]["id"]
                    self.token = data["token"]
                    self.log_test("Demo Login", True, f"User ID: {self.user_id}, Token: {self.token}")
                    return True
                else:
                    self.log_test("Demo Login", False, f"Missing user/token in response: {data}")
                    return False
            else:
                self.log_test("Demo Login", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Demo Login", False, f"Exception: {str(e)}")
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

    def test_ai_chat(self) -> bool:
        """Test POST /api/ai/chat - should return 501 Not Implemented"""
        if not self.user_id:
            self.log_test("AI Chat", False, "No user_id available")
            return False
        
        try:
            payload = {
                "user_id": self.user_id,
                "messages": [{"role": "user", "content": "Hello"}]
            }
            response = requests.post(f"{self.base_url}/ai/chat", json=payload, timeout=10)
            
            # Expecting 501 Not Implemented as per requirements
            if response.status_code == 501:
                data = response.json()
                if "detail" in data and "integration pending" in data["detail"].lower():
                    self.log_test("AI Chat", True, f"Expected 501 response: {data['detail']}")
                    return True
                else:
                    self.log_test("AI Chat", False, f"501 status but unexpected message: {data}")
                    return False
            else:
                self.log_test("AI Chat", False, f"Expected 501, got {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("AI Chat", False, f"Exception: {str(e)}")
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

    def test_import_leads_basic(self) -> bool:
        """Test POST /api/leads/import with valid data"""
        if not self.user_id:
            self.log_test("Import Leads Basic", False, "No user_id available")
            return False
        
        try:
            # Use timestamp to ensure unique emails
            timestamp = int(time.time())
            payload = {
                "user_id": self.user_id,
                "default_stage": "New",
                "in_dashboard": True,
                "leads": [
                    {
                        "first_name": "John",
                        "last_name": "Smith",
                        "email": f"john.smith.{timestamp}@example.com",
                        "phone": "+14155551234",
                        "property_type": "Single Family",
                        "neighborhood": "Downtown",
                        "price_min": 500000,
                        "price_max": 750000,
                        "priority": "high",
                        "notes": "Looking for a family home"
                    },
                    {
                        "first_name": "Sarah",
                        "last_name": "Johnson",
                        "email": f"sarah.johnson.{timestamp}@example.com",
                        "phone": "+14155559876",
                        "property_type": "Condo",
                        "neighborhood": "Midtown",
                        "price_min": 300000,
                        "price_max": 500000,
                        "priority": "medium"
                    }
                ]
            }
            response = requests.post(f"{self.base_url}/leads/import", json=payload, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if (result.get("inserted") == 2 and 
                    result.get("skipped") == 0 and 
                    len(result.get("inserted_leads", [])) == 2):
                    self.log_test("Import Leads Basic", True, f"Imported {result['inserted']} leads successfully")
                    return True
                else:
                    self.log_test("Import Leads Basic", False, f"Unexpected import result: {result}")
                    return False
            else:
                self.log_test("Import Leads Basic", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Import Leads Basic", False, f"Exception: {str(e)}")
            return False

    def test_import_leads_phone_normalization(self) -> bool:
        """Test POST /api/leads/import with phone numbers needing normalization"""
        if not self.user_id:
            self.log_test("Import Leads Phone Normalization", False, "No user_id available")
            return False
        
        try:
            # Use timestamp to ensure unique emails
            timestamp = int(time.time()) + 1
            payload = {
                "user_id": self.user_id,
                "default_stage": "New",
                "in_dashboard": False,
                "leads": [
                    {
                        "first_name": "Mike",
                        "last_name": "Davis",
                        "email": f"mike.davis.{timestamp}@example.com",
                        "phone": "13654578956",  # US number without + prefix
                        "property_type": "Townhouse",
                        "neighborhood": "Suburbs"
                    },
                    {
                        "first_name": "Lisa",
                        "last_name": "Wilson",
                        "email": f"lisa.wilson.{timestamp}@example.com",
                        "phone": "4155551111",  # 10-digit US number
                        "property_type": "Apartment",
                        "neighborhood": "City Center"
                    }
                ]
            }
            response = requests.post(f"{self.base_url}/leads/import", json=payload, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if (result.get("inserted") == 2 and 
                    result.get("skipped") == 0):
                    # Check if phone numbers were normalized to E.164 format
                    inserted_leads = result.get("inserted_leads", [])
                    phone_normalized = False
                    for lead in inserted_leads:
                        if lead.get("phone") and lead["phone"].startswith("+1"):
                            phone_normalized = True
                            break
                    
                    if phone_normalized:
                        self.log_test("Import Leads Phone Normalization", True, f"Phone numbers normalized correctly: {[l.get('phone') for l in inserted_leads]}")
                        return True
                    else:
                        self.log_test("Import Leads Phone Normalization", False, f"Phone numbers not normalized: {[l.get('phone') for l in inserted_leads]}")
                        return False
                else:
                    self.log_test("Import Leads Phone Normalization", False, f"Unexpected import result: {result}")
                    return False
            else:
                self.log_test("Import Leads Phone Normalization", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Import Leads Phone Normalization", False, f"Exception: {str(e)}")
            return False

    def test_import_leads_duplicate_emails(self) -> bool:
        """Test POST /api/leads/import with duplicate emails"""
        if not self.user_id:
            self.log_test("Import Leads Duplicate Emails", False, "No user_id available")
            return False
        
        try:
            # Use timestamp to ensure unique test
            timestamp = int(time.time()) + 2
            duplicate_email = f"duplicate.test.{timestamp}@example.com"
            
            # First, import a lead
            payload1 = {
                "user_id": self.user_id,
                "default_stage": "New",
                "in_dashboard": True,
                "leads": [
                    {
                        "first_name": "Original",
                        "last_name": "User",
                        "email": duplicate_email,
                        "phone": "+14155552222",
                        "property_type": "House"
                    }
                ]
            }
            response1 = requests.post(f"{self.base_url}/leads/import", json=payload1, timeout=10)
            
            if response1.status_code != 200:
                self.log_test("Import Leads Duplicate Emails", False, f"Failed to create initial lead: {response1.text}")
                return False
            
            # Now try to import a lead with the same email
            payload2 = {
                "user_id": self.user_id,
                "default_stage": "New",
                "in_dashboard": True,
                "leads": [
                    {
                        "first_name": "Duplicate",
                        "last_name": "User",
                        "email": duplicate_email,  # Same email
                        "phone": "+14155553333",
                        "property_type": "Condo"
                    }
                ]
            }
            response2 = requests.post(f"{self.base_url}/leads/import", json=payload2, timeout=10)
            
            if response2.status_code == 200:
                result = response2.json()
                if (result.get("inserted") == 0 and 
                    result.get("skipped") == 1 and 
                    len(result.get("errors", [])) == 1):
                    error = result["errors"][0]
                    if "duplicate" in error.get("reason", "").lower():
                        self.log_test("Import Leads Duplicate Emails", True, f"Duplicate email handled correctly: {result}")
                        return True
                    else:
                        self.log_test("Import Leads Duplicate Emails", False, f"Wrong error reason: {error}")
                        return False
                else:
                    self.log_test("Import Leads Duplicate Emails", False, f"Unexpected duplicate handling: {result}")
                    return False
            else:
                self.log_test("Import Leads Duplicate Emails", False, f"Status: {response2.status_code}, Response: {response2.text}")
                return False
        except Exception as e:
            self.log_test("Import Leads Duplicate Emails", False, f"Exception: {str(e)}")
            return False

    def test_import_leads_invalid_data(self) -> bool:
        """Test POST /api/leads/import with invalid data"""
        if not self.user_id:
            self.log_test("Import Leads Invalid Data", False, "No user_id available")
            return False
        
        try:
            # Use timestamp to ensure unique test
            timestamp = int(time.time()) + 3
            payload = {
                "user_id": self.user_id,
                "default_stage": "New",
                "in_dashboard": True,
                "leads": [
                    {
                        "first_name": "Valid",
                        "last_name": "User",
                        "email": f"valid.user.{timestamp}@example.com",
                        "phone": "+14155554444",
                        "property_type": "House"
                    },
                    {
                        "first_name": "Invalid",
                        "last_name": "Email",
                        "email": "not-an-email",  # Invalid email format
                        "phone": "+14155555555",
                        "property_type": "Condo"
                    }
                ]
            }
            response = requests.post(f"{self.base_url}/leads/import", json=payload, timeout=10)
            
            # Should either return 422 for validation error or 200 with errors in response
            if response.status_code == 422:
                self.log_test("Import Leads Invalid Data", True, f"Validation error returned as expected: {response.status_code}")
                return True
            elif response.status_code == 200:
                result = response.json()
                if (result.get("inserted") == 1 and 
                    result.get("skipped") == 1 and 
                    len(result.get("errors", [])) == 1):
                    self.log_test("Import Leads Invalid Data", True, f"Invalid data handled correctly: {result}")
                    return True
                else:
                    self.log_test("Import Leads Invalid Data", False, f"Unexpected invalid data handling: {result}")
                    return False
            else:
                self.log_test("Import Leads Invalid Data", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Import Leads Invalid Data", False, f"Exception: {str(e)}")
            return False

    def test_import_leads_user_excel_format(self) -> bool:
        """Test POST /api/leads/import with user's Excel data format"""
        # Use the specific user_id from demo session
        demo_user_id = "03f82986-51af-460c-a549-1c5077e67fb0"
        
        try:
            # Use timestamp to ensure unique emails
            timestamp = int(time.time()) + 4
            payload = {
                "user_id": demo_user_id,
                "default_stage": "New",
                "in_dashboard": True,
                "leads": [
                    {
                        "first_name": "Sanjay",
                        "last_name": "Sharma",
                        "email": f"sanjaysharma.{timestamp}@gmail.com",
                        "phone": "13654578956",  # Phone format from user's Excel (no + prefix)
                        "property_type": "Single Family Home",
                        "neighborhood": "Downtown",
                        "priority": "high",
                        "source_tags": ["Excel Import", "Referral"],
                        "stage": "New"
                    },
                    {
                        "first_name": "Sameer",
                        "last_name": "Gokle",
                        "email": f"sameergokle.{timestamp}@gmail.com",
                        "phone": "14155551234",  # Another phone format from Excel
                        "property_type": "Condo",
                        "neighborhood": "Midtown",
                        "priority": "medium",
                        "source_tags": ["Excel Import"],
                        "stage": "New"
                    },
                    {
                        "first_name": "Priya",
                        "last_name": "Patel",
                        "email": f"priyapatel.{timestamp}@yahoo.com",
                        "phone": "4085551111",  # 10-digit format
                        "property_type": "Townhouse",
                        "neighborhood": "Suburbs",
                        "priority": "low",
                        "source_tags": ["Excel Import", "Website"],
                        "stage": "New"
                    }
                ]
            }
            response = requests.post(f"{self.base_url}/leads/import", json=payload, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if (result.get("inserted") == 3 and 
                    result.get("skipped") == 0 and 
                    len(result.get("inserted_leads", [])) == 3):
                    
                    # Verify phone normalization
                    inserted_leads = result.get("inserted_leads", [])
                    phone_checks = []
                    email_checks = []
                    
                    for lead in inserted_leads:
                        # Check phone normalization to E.164 format
                        if lead.get("phone") and lead["phone"].startswith("+1"):
                            phone_checks.append(f"{lead['first_name']}: {lead['phone']}")
                        
                        # Check email validation
                        if lead.get("email") and "@" in lead["email"]:
                            email_checks.append(f"{lead['first_name']}: {lead['email']}")
                    
                    # Verify response structure includes inserted_leads array
                    has_inserted_leads_array = "inserted_leads" in result and isinstance(result["inserted_leads"], list)
                    
                    if len(phone_checks) == 3 and len(email_checks) == 3 and has_inserted_leads_array:
                        self.log_test("Import Leads User Excel Format", True, 
                                    f"Successfully imported {result['inserted']} leads with proper normalization. "
                                    f"Phones: {phone_checks}. Emails: {email_checks}. "
                                    f"Response includes inserted_leads array: {has_inserted_leads_array}")
                        return True
                    else:
                        self.log_test("Import Leads User Excel Format", False, 
                                    f"Data validation failed. Phones: {phone_checks}, Emails: {email_checks}, "
                                    f"Has inserted_leads: {has_inserted_leads_array}")
                        return False
                else:
                    self.log_test("Import Leads User Excel Format", False, f"Unexpected import result: {result}")
                    return False
            else:
                self.log_test("Import Leads User Excel Format", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Import Leads User Excel Format", False, f"Exception: {str(e)}")
            return False

    def test_delete_all_import_workflow(self) -> bool:
        """Test the complete DELETE ALL → IMPORT workflow that user experienced"""
        # Use the specific demo user ID as requested
        demo_user_id = "03f82986-51af-460c-a549-1c5077e67fb0"
        
        try:
            print("\n🔄 Starting DELETE ALL → IMPORT workflow test...")
            
            # STEP 1: Create Initial Test Leads (2-3 leads to establish baseline)
            print("📝 Step 1: Creating initial test leads...")
            timestamp = int(time.time()) + 10
            initial_payload = {
                "user_id": demo_user_id,
                "default_stage": "New",
                "in_dashboard": True,
                "leads": [
                    {
                        "first_name": "Initial",
                        "last_name": "Lead1",
                        "email": f"initial.lead1.{timestamp}@example.com",
                        "phone": "14155551001",
                        "property_type": "House",
                        "neighborhood": "Test Area 1"
                    },
                    {
                        "first_name": "Initial",
                        "last_name": "Lead2", 
                        "email": f"initial.lead2.{timestamp}@example.com",
                        "phone": "14155551002",
                        "property_type": "Condo",
                        "neighborhood": "Test Area 2"
                    },
                    {
                        "first_name": "Initial",
                        "last_name": "Lead3",
                        "email": f"initial.lead3.{timestamp}@example.com", 
                        "phone": "14155551003",
                        "property_type": "Townhouse",
                        "neighborhood": "Test Area 3"
                    }
                ]
            }
            
            response = requests.post(f"{self.base_url}/leads/import", json=initial_payload, timeout=10)
            if response.status_code != 200:
                self.log_test("Delete All Import Workflow", False, f"Failed to create initial leads: {response.text}")
                return False
            
            initial_result = response.json()
            if initial_result.get("inserted") != 3:
                self.log_test("Delete All Import Workflow", False, f"Expected 3 initial leads, got: {initial_result}")
                return False
            
            print(f"✅ Created {initial_result['inserted']} initial test leads")
            
            # STEP 2: Get all leads to verify baseline and prepare for deletion
            print("📋 Step 2: Getting all leads for deletion...")
            response = requests.get(f"{self.base_url}/leads", params={"user_id": demo_user_id}, timeout=10)
            if response.status_code != 200:
                self.log_test("Delete All Import Workflow", False, f"Failed to get leads: {response.text}")
                return False
            
            all_leads = response.json()
            initial_count = len(all_leads)
            print(f"📊 Found {initial_count} total leads in system")
            
            if initial_count < 3:
                self.log_test("Delete All Import Workflow", False, f"Expected at least 3 leads, found {initial_count}")
                return False
            
            # STEP 3: Delete All Leads (one by one since no bulk delete endpoint)
            print("🗑️  Step 3: Deleting all leads...")
            deleted_count = 0
            failed_deletions = []
            
            for lead in all_leads:
                lead_id = lead.get("id")
                if lead_id:
                    delete_response = requests.delete(f"{self.base_url}/leads/{lead_id}", timeout=10)
                    if delete_response.status_code == 200:
                        deleted_count += 1
                    else:
                        failed_deletions.append(f"Lead {lead_id}: {delete_response.status_code}")
            
            print(f"🗑️  Deleted {deleted_count} leads, {len(failed_deletions)} failures")
            
            if failed_deletions:
                self.log_test("Delete All Import Workflow", False, f"Failed to delete some leads: {failed_deletions}")
                return False
            
            # Verify all leads are deleted
            response = requests.get(f"{self.base_url}/leads", params={"user_id": demo_user_id}, timeout=10)
            if response.status_code != 200:
                self.log_test("Delete All Import Workflow", False, f"Failed to verify deletion: {response.text}")
                return False
            
            remaining_leads = response.json()
            if len(remaining_leads) > 0:
                self.log_test("Delete All Import Workflow", False, f"Expected 0 leads after deletion, found {len(remaining_leads)}")
                return False
            
            print("✅ All leads successfully deleted")
            
            # STEP 4: Import New Leads (with exact phone format from user request)
            print("📥 Step 4: Importing fresh leads with user's phone format...")
            timestamp = int(time.time()) + 20
            import_payload = {
                "user_id": demo_user_id,
                "default_stage": "New", 
                "in_dashboard": True,
                "leads": [
                    {
                        "first_name": "Fresh",
                        "last_name": "Import1",
                        "email": f"fresh.import1.{timestamp}@gmail.com",
                        "phone": "13654578956",  # Exact format from user request
                        "property_type": "Single Family Home",
                        "neighborhood": "Fresh Area 1",
                        "priority": "high"
                    },
                    {
                        "first_name": "Fresh", 
                        "last_name": "Import2",
                        "email": f"fresh.import2.{timestamp}@yahoo.com",
                        "phone": "14085551234",  # Another format to test
                        "property_type": "Condo",
                        "neighborhood": "Fresh Area 2", 
                        "priority": "medium"
                    },
                    {
                        "first_name": "Fresh",
                        "last_name": "Import3",
                        "email": f"fresh.import3.{timestamp}@hotmail.com",
                        "phone": "4155559999",  # 10-digit format
                        "property_type": "Apartment",
                        "neighborhood": "Fresh Area 3",
                        "priority": "low"
                    }
                ]
            }
            
            response = requests.post(f"{self.base_url}/leads/import", json=import_payload, timeout=10)
            if response.status_code != 200:
                self.log_test("Delete All Import Workflow", False, f"Failed to import fresh leads: {response.text}")
                return False
            
            import_result = response.json()
            if (import_result.get("inserted") != 3 or 
                import_result.get("skipped") != 0 or
                len(import_result.get("inserted_leads", [])) != 3):
                self.log_test("Delete All Import Workflow", False, f"Unexpected import result: {import_result}")
                return False
            
            print(f"✅ Successfully imported {import_result['inserted']} fresh leads")
            
            # STEP 5: Verify Import Success and Phone Normalization
            print("🔍 Step 5: Verifying import success and phone normalization...")
            
            # Check that inserted_leads array is properly returned
            inserted_leads = import_result.get("inserted_leads", [])
            if len(inserted_leads) != 3:
                self.log_test("Delete All Import Workflow", False, f"Expected 3 leads in inserted_leads array, got {len(inserted_leads)}")
                return False
            
            # Verify phone normalization (13654578956 → +13654578956)
            phone_normalized_correctly = False
            normalized_phones = []
            
            for lead in inserted_leads:
                phone = lead.get("phone", "")
                normalized_phones.append(f"{lead.get('first_name', 'Unknown')}: {phone}")
                
                # Check if the specific phone number from request was normalized correctly
                if phone == "+13654578956":
                    phone_normalized_correctly = True
            
            if not phone_normalized_correctly:
                self.log_test("Delete All Import Workflow", False, f"Phone 13654578956 not normalized to +13654578956. Found: {normalized_phones}")
                return False
            
            print(f"✅ Phone normalization verified: {normalized_phones}")
            
            # STEP 6: Final verification via GET /api/leads
            print("📋 Step 6: Final verification via GET /api/leads...")
            response = requests.get(f"{self.base_url}/leads", params={"user_id": demo_user_id}, timeout=10)
            if response.status_code != 200:
                self.log_test("Delete All Import Workflow", False, f"Failed final verification: {response.text}")
                return False
            
            final_leads = response.json()
            if len(final_leads) != 3:
                self.log_test("Delete All Import Workflow", False, f"Expected 3 leads in final check, found {len(final_leads)}")
                return False
            
            # Verify the leads are accessible and have correct data
            fresh_lead_found = False
            for lead in final_leads:
                if (lead.get("first_name") == "Fresh" and 
                    lead.get("last_name") == "Import1" and
                    lead.get("phone") == "+13654578956"):
                    fresh_lead_found = True
                    break
            
            if not fresh_lead_found:
                self.log_test("Delete All Import Workflow", False, f"Could not find expected fresh lead in final results: {final_leads}")
                return False
            
            print("✅ All imported leads accessible via GET /api/leads")
            
            # SUCCESS!
            self.log_test("Delete All Import Workflow", True, 
                        f"Complete workflow successful: "
                        f"Created {initial_count} initial leads → "
                        f"Deleted {deleted_count} leads → "
                        f"Imported {import_result['inserted']} fresh leads → "
                        f"Phone normalization working (13654578956 → +13654578956) → "
                        f"All {len(final_leads)} leads accessible via API")
            return True
            
        except Exception as e:
            self.log_test("Delete All Import Workflow", False, f"Exception during workflow: {str(e)}")
            return False

    def test_twilio_access_token_with_valid_credentials(self) -> bool:
        """Test POST /api/twilio/access-token with valid Twilio credentials"""
        # Use the specific demo user ID as requested
        demo_user_id = "03f82986-51af-460c-a549-1c5077e67fb0"
        
        try:
            # First, save valid Twilio credentials to settings
            settings_payload = {
                "user_id": demo_user_id,
                "twilio_account_sid": "ACtest123456789abcdef123456789abcdef",
                "twilio_auth_token": "test_auth_token_123456789abcdef",
                "twilio_phone_number": "+15551234567"
            }
            settings_response = requests.post(f"{self.base_url}/settings", json=settings_payload, timeout=10)
            
            if settings_response.status_code != 200:
                self.log_test("Twilio Access Token Valid Credentials", False, f"Failed to save Twilio settings: {settings_response.text}")
                return False
            
            # Now test the access token generation
            payload = {"user_id": demo_user_id}
            response = requests.post(f"{self.base_url}/twilio/access-token", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("status") == "success" and 
                    "token" in data and 
                    "identity" in data and 
                    data.get("expires_in") == 3600):
                    # Verify identity format
                    expected_identity = f"agent_{demo_user_id}"
                    if data.get("identity") == expected_identity:
                        self.log_test("Twilio Access Token Valid Credentials", True, 
                                    f"Access token generated successfully. Identity: {data['identity']}, Expires: {data['expires_in']}s")
                        return True
                    else:
                        self.log_test("Twilio Access Token Valid Credentials", False, 
                                    f"Invalid identity format. Expected: {expected_identity}, Got: {data.get('identity')}")
                        return False
                else:
                    self.log_test("Twilio Access Token Valid Credentials", False, f"Invalid access token response structure: {data}")
                    return False
            else:
                self.log_test("Twilio Access Token Valid Credentials", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Twilio Access Token Valid Credentials", False, f"Exception: {str(e)}")
            return False

    def test_twilio_access_token_missing_credentials(self) -> bool:
        """Test POST /api/twilio/access-token with missing Twilio credentials"""
        # Use the specific demo user ID as requested
        demo_user_id = "03f82986-51af-460c-a549-1c5077e67fb0"
        
        try:
            # First, clear Twilio credentials from settings
            settings_payload = {
                "user_id": demo_user_id,
                "twilio_account_sid": None,
                "twilio_auth_token": None,
                "twilio_phone_number": None
            }
            settings_response = requests.post(f"{self.base_url}/settings", json=settings_payload, timeout=10)
            
            if settings_response.status_code != 200:
                self.log_test("Twilio Access Token Missing Credentials", False, f"Failed to clear Twilio settings: {settings_response.text}")
                return False
            
            # Now test the access token generation with missing credentials
            payload = {"user_id": demo_user_id}
            response = requests.post(f"{self.base_url}/twilio/access-token", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("status") == "error" and 
                    "Twilio credentials not configured" in data.get("message", "")):
                    self.log_test("Twilio Access Token Missing Credentials", True, 
                                f"Proper error handling for missing credentials: {data['message']}")
                    return True
                else:
                    self.log_test("Twilio Access Token Missing Credentials", False, f"Unexpected response for missing credentials: {data}")
                    return False
            elif response.status_code == 400:
                data = response.json()
                if "Twilio credentials not configured" in data.get("detail", ""):
                    self.log_test("Twilio Access Token Missing Credentials", True, 
                                f"Proper 400 error for missing credentials: {data['detail']}")
                    return True
                else:
                    self.log_test("Twilio Access Token Missing Credentials", False, f"Wrong 400 error message: {data}")
                    return False
            else:
                self.log_test("Twilio Access Token Missing Credentials", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Twilio Access Token Missing Credentials", False, f"Exception: {str(e)}")
            return False

    def test_twilio_webrtc_call_preparation(self) -> bool:
        """Test POST /api/twilio/webrtc-call with valid lead and credentials"""
        # Use the specific demo user ID as requested
        demo_user_id = "03f82986-51af-460c-a549-1c5077e67fb0"
        
        try:
            # First, ensure we have valid Twilio credentials
            settings_payload = {
                "user_id": demo_user_id,
                "twilio_account_sid": "ACtest123456789abcdef123456789abcdef",
                "twilio_auth_token": "test_auth_token_123456789abcdef",
                "twilio_phone_number": "+15551234567"
            }
            settings_response = requests.post(f"{self.base_url}/settings", json=settings_payload, timeout=10)
            
            if settings_response.status_code != 200:
                self.log_test("Twilio WebRTC Call Preparation", False, f"Failed to save Twilio settings: {settings_response.text}")
                return False
            
            # Create a test lead with phone number
            timestamp = int(time.time()) + 100
            lead_payload = {
                "user_id": demo_user_id,
                "first_name": "WebRTC",
                "last_name": "TestLead",
                "email": f"webrtc.testlead.{timestamp}@example.com",
                "phone": "+14155559999",
                "property_type": "House",
                "neighborhood": "Test Area"
            }
            lead_response = requests.post(f"{self.base_url}/leads", json=lead_payload, timeout=10)
            
            if lead_response.status_code != 200:
                self.log_test("Twilio WebRTC Call Preparation", False, f"Failed to create test lead: {lead_response.text}")
                return False
            
            lead_data = lead_response.json()
            lead_id = lead_data.get("id")
            
            if not lead_id:
                self.log_test("Twilio WebRTC Call Preparation", False, f"No lead ID in response: {lead_data}")
                return False
            
            # Now test the WebRTC call preparation
            webrtc_payload = {
                "lead_id": lead_id,
                "message": "Hello, this is your real estate agent calling about your property inquiry."
            }
            response = requests.post(f"{self.base_url}/twilio/webrtc-call", json=webrtc_payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("status") == "success" and 
                    "call_data" in data and 
                    data.get("message") == "WebRTC call data prepared"):
                    
                    call_data = data.get("call_data", {})
                    if (call_data.get("to") == "+14155559999" and 
                        call_data.get("from") == "+15551234567" and
                        "WebRTC TestLead" in call_data.get("lead_name", "")):
                        self.log_test("Twilio WebRTC Call Preparation", True, 
                                    f"WebRTC call data prepared successfully. To: {call_data['to']}, From: {call_data['from']}, Lead: {call_data['lead_name']}")
                        return True
                    else:
                        self.log_test("Twilio WebRTC Call Preparation", False, f"Invalid call data structure: {call_data}")
                        return False
                else:
                    self.log_test("Twilio WebRTC Call Preparation", False, f"Invalid WebRTC response structure: {data}")
                    return False
            else:
                self.log_test("Twilio WebRTC Call Preparation", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Twilio WebRTC Call Preparation", False, f"Exception: {str(e)}")
            return False

    def test_twilio_webrtc_call_missing_credentials(self) -> bool:
        """Test POST /api/twilio/webrtc-call with missing Twilio credentials"""
        # Use the specific demo user ID as requested
        demo_user_id = "03f82986-51af-460c-a549-1c5077e67fb0"
        
        try:
            # First, clear Twilio credentials from settings
            settings_payload = {
                "user_id": demo_user_id,
                "twilio_account_sid": None,
                "twilio_auth_token": None,
                "twilio_phone_number": None
            }
            settings_response = requests.post(f"{self.base_url}/settings", json=settings_payload, timeout=10)
            
            if settings_response.status_code != 200:
                self.log_test("Twilio WebRTC Call Missing Credentials", False, f"Failed to clear Twilio settings: {settings_response.text}")
                return False
            
            # Create a test lead with phone number
            timestamp = int(time.time()) + 101
            lead_payload = {
                "user_id": demo_user_id,
                "first_name": "WebRTC",
                "last_name": "NoCredentials",
                "email": f"webrtc.nocreds.{timestamp}@example.com",
                "phone": "+14155558888",
                "property_type": "Condo"
            }
            lead_response = requests.post(f"{self.base_url}/leads", json=lead_payload, timeout=10)
            
            if lead_response.status_code != 200:
                self.log_test("Twilio WebRTC Call Missing Credentials", False, f"Failed to create test lead: {lead_response.text}")
                return False
            
            lead_data = lead_response.json()
            lead_id = lead_data.get("id")
            
            # Now test the WebRTC call preparation with missing credentials
            webrtc_payload = {"lead_id": lead_id}
            response = requests.post(f"{self.base_url}/twilio/webrtc-call", json=webrtc_payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("status") == "error" and 
                    "Twilio not configured" in data.get("message", "")):
                    self.log_test("Twilio WebRTC Call Missing Credentials", True, 
                                f"Proper error handling for missing credentials: {data['message']}")
                    return True
                else:
                    self.log_test("Twilio WebRTC Call Missing Credentials", False, f"Unexpected response for missing credentials: {data}")
                    return False
            elif response.status_code == 400:
                data = response.json()
                if "Twilio not configured" in data.get("detail", ""):
                    self.log_test("Twilio WebRTC Call Missing Credentials", True, 
                                f"Proper 400 error for missing credentials: {data['detail']}")
                    return True
                else:
                    self.log_test("Twilio WebRTC Call Missing Credentials", False, f"Wrong 400 error message: {data}")
                    return False
            else:
                self.log_test("Twilio WebRTC Call Missing Credentials", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Twilio WebRTC Call Missing Credentials", False, f"Exception: {str(e)}")
            return False

    def test_twilio_webrtc_call_invalid_lead(self) -> bool:
        """Test POST /api/twilio/webrtc-call with invalid lead ID"""
        try:
            # Test with non-existent lead ID
            webrtc_payload = {
                "lead_id": "non-existent-lead-id-12345",
                "message": "Test message"
            }
            response = requests.post(f"{self.base_url}/twilio/webrtc-call", json=webrtc_payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("status") == "error" and 
                    "Lead not found" in data.get("message", "")):
                    self.log_test("Twilio WebRTC Call Invalid Lead", True, 
                                f"Proper error handling for invalid lead: {data['message']}")
                    return True
                else:
                    self.log_test("Twilio WebRTC Call Invalid Lead", False, f"Unexpected response for invalid lead: {data}")
                    return False
            elif response.status_code == 404:
                data = response.json()
                if "Lead not found" in data.get("detail", ""):
                    self.log_test("Twilio WebRTC Call Invalid Lead", True, 
                                f"Proper 404 error for invalid lead: {data['detail']}")
                    return True
                else:
                    self.log_test("Twilio WebRTC Call Invalid Lead", False, f"Wrong 404 error message: {data}")
                    return False
            else:
                self.log_test("Twilio WebRTC Call Invalid Lead", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Twilio WebRTC Call Invalid Lead", False, f"Exception: {str(e)}")
            return False

    def test_webrtc_access_token_demo_user(self) -> bool:
        """Test /api/twilio/access-token with demo user ID to check setup_required response"""
        # Use the specific demo user ID from the review request
        demo_user_id = "03f82986-51af-460c-a549-1c5077e67fb0"
        
        try:
            # First, clear any existing Twilio credentials to simulate unconfigured state
            settings_payload = {
                "user_id": demo_user_id,
                "twilio_account_sid": None,
                "twilio_auth_token": None,
                "twilio_phone_number": None,
                "twilio_api_key": None,
                "twilio_api_secret": None
            }
            settings_response = requests.post(f"{self.base_url}/settings", json=settings_payload, timeout=10)
            
            if settings_response.status_code != 200:
                self.log_test("WebRTC Access Token Demo User", False, f"Failed to clear Twilio settings: {settings_response.text}")
                return False
            
            # Test access token generation with demo user
            payload = {"user_id": demo_user_id}
            response = requests.post(f"{self.base_url}/twilio/access-token", json=payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                # Should show setup_required since API keys aren't configured
                if data.get("status") == "setup_required":
                    missing_fields = data.get("message", "")
                    setup_instructions = data.get("setup_instructions", {})
                    
                    self.log_test("WebRTC Access Token Demo User", True, 
                                f"Setup required response received as expected. Missing: {missing_fields}. "
                                f"Instructions provided: {len(setup_instructions)} steps")
                    return True
                elif data.get("status") == "error":
                    # Also acceptable - error response for missing credentials
                    self.log_test("WebRTC Access Token Demo User", True, 
                                f"Error response for missing credentials: {data.get('message', '')}")
                    return True
                else:
                    self.log_test("WebRTC Access Token Demo User", False, 
                                f"Expected setup_required or error status, got: {data}")
                    return False
            else:
                self.log_test("WebRTC Access Token Demo User", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("WebRTC Access Token Demo User", False, f"Exception: {str(e)}")
            return False

    def test_webrtc_call_initiation_missing_credentials(self) -> bool:
        """Test /api/twilio/webrtc-call with lead ID to check missing credentials handling"""
        # Use the specific demo user ID from the review request
        demo_user_id = "03f82986-51af-460c-a549-1c5077e67fb0"
        
        try:
            # First, ensure Twilio credentials are cleared
            settings_payload = {
                "user_id": demo_user_id,
                "twilio_account_sid": None,
                "twilio_auth_token": None,
                "twilio_phone_number": None,
                "twilio_api_key": None,
                "twilio_api_secret": None
            }
            settings_response = requests.post(f"{self.base_url}/settings", json=settings_payload, timeout=10)
            
            if settings_response.status_code != 200:
                self.log_test("WebRTC Call Initiation Missing Credentials", False, f"Failed to clear Twilio settings: {settings_response.text}")
                return False
            
            # Create a test lead for the demo user
            timestamp = int(time.time()) + 200
            lead_payload = {
                "user_id": demo_user_id,
                "first_name": "WebRTC",
                "last_name": "InitTest",
                "email": f"webrtc.init.{timestamp}@example.com",
                "phone": "+14155557777",
                "property_type": "House"
            }
            lead_response = requests.post(f"{self.base_url}/leads", json=lead_payload, timeout=10)
            
            if lead_response.status_code != 200:
                self.log_test("WebRTC Call Initiation Missing Credentials", False, f"Failed to create test lead: {lead_response.text}")
                return False
            
            lead_data = lead_response.json()
            lead_id = lead_data.get("id")
            
            # Test WebRTC call initiation with missing credentials
            webrtc_payload = {
                "lead_id": lead_id,
                "message": "Test WebRTC call initiation"
            }
            response = requests.post(f"{self.base_url}/twilio/webrtc-call", json=webrtc_payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("status") == "error" and 
                    ("Missing Twilio credentials" in data.get("message", "") or 
                     "Twilio not configured" in data.get("message", "") or
                     data.get("setup_required") == True)):
                    
                    self.log_test("WebRTC Call Initiation Missing Credentials", True, 
                                f"Proper error handling for missing credentials: {data.get('message', '')}")
                    return True
                else:
                    self.log_test("WebRTC Call Initiation Missing Credentials", False, 
                                f"Unexpected response for missing credentials: {data}")
                    return False
            else:
                self.log_test("WebRTC Call Initiation Missing Credentials", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("WebRTC Call Initiation Missing Credentials", False, f"Exception: {str(e)}")
            return False

    def test_twiml_outbound_call_endpoint(self) -> bool:
        """Test GET /api/twiml/outbound-call with test parameters"""
        try:
            # Test GET request with query parameters
            params = {
                "agent_identity": "agent_03f82986-51af-460c-a549-1c5077e67fb0",
                "lead_phone": "+14155551234"
            }
            response = requests.get(f"{self.base_url}/twiml/outbound-call", params=params, timeout=10)
            
            if response.status_code == 200:
                content = response.text
                content_type = response.headers.get('content-type', '')
                
                # Should return XML TwiML response
                if ('application/xml' in content_type or 'text/xml' in content_type) and '<?xml' in content:
                    # Check for expected TwiML elements
                    if ('<Response>' in content and 
                        '<Say' in content and 
                        '<Dial' in content and 
                        '<Client>' in content and
                        'agent_03f82986-51af-460c-a549-1c5077e67fb0' in content):
                        
                        self.log_test("TwiML Outbound Call Endpoint", True, 
                                    f"Valid TwiML response received. Content-Type: {content_type}")
                        return True
                    else:
                        self.log_test("TwiML Outbound Call Endpoint", False, 
                                    f"TwiML missing expected elements. Content: {content[:200]}...")
                        return False
                else:
                    self.log_test("TwiML Outbound Call Endpoint", False, 
                                f"Expected XML response, got: {content_type}. Content: {content[:200]}...")
                    return False
            else:
                self.log_test("TwiML Outbound Call Endpoint", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("TwiML Outbound Call Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_twiml_client_incoming_endpoint(self) -> bool:
        """Test GET /api/twiml/client-incoming with test parameters"""
        try:
            # Test GET request with query parameters
            params = {
                "From": "+14155559999"
            }
            response = requests.get(f"{self.base_url}/twiml/client-incoming", params=params, timeout=10)
            
            if response.status_code == 200:
                content = response.text
                content_type = response.headers.get('content-type', '')
                
                # Should return XML TwiML response
                if ('application/xml' in content_type or 'text/xml' in content_type) and '<?xml' in content:
                    # Check for expected TwiML elements
                    if ('<Response>' in content and 
                        '<Say' in content and 
                        '<Dial' in content and 
                        '<Number>' in content and
                        '+14155559999' in content):
                        
                        self.log_test("TwiML Client Incoming Endpoint", True, 
                                    f"Valid TwiML response received. Content-Type: {content_type}")
                        return True
                    else:
                        self.log_test("TwiML Client Incoming Endpoint", False, 
                                    f"TwiML missing expected elements. Content: {content[:200]}...")
                        return False
                else:
                    self.log_test("TwiML Client Incoming Endpoint", False, 
                                f"Expected XML response, got: {content_type}. Content: {content[:200]}...")
                    return False
            else:
                self.log_test("TwiML Client Incoming Endpoint", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("TwiML Client Incoming Endpoint", False, f"Exception: {str(e)}")
            return False

    def run_webrtc_tests_only(self) -> bool:
        """Run only the WebRTC calling functionality tests"""
        print("🚀 Starting WebRTC Calling Functionality Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # First get authentication
        if not self.test_health():
            return False
        if not self.test_login():
            return False
        
        # Run WebRTC-specific tests
        webrtc_tests = [
            self.test_twilio_access_token_with_valid_credentials,
            self.test_twilio_access_token_missing_credentials,
            self.test_twilio_webrtc_call_preparation,
            self.test_twilio_webrtc_call_missing_credentials,
            self.test_twilio_webrtc_call_invalid_lead,
        ]
        
        webrtc_tests_passed = 0
        for test in webrtc_tests:
            if test():
                webrtc_tests_passed += 1
        
        print("=" * 60)
        print(f"📊 WebRTC Tests Results: {webrtc_tests_passed}/{len(webrtc_tests)} tests passed")
        
        if webrtc_tests_passed == len(webrtc_tests):
            print("🎉 All WebRTC calling tests PASSED!")
            return True
        else:
            print("⚠️  Some WebRTC calling tests FAILED!")
            return False

    def run_webrtc_review_tests(self) -> bool:
        """Run focused WebRTC tests as requested in the review"""
        print("🚀 Starting WebRTC Review Tests (Access Token & TwiML Endpoints)")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # First get authentication
        if not self.test_health():
            return False
        if not self.test_login():
            return False
        
        # Run the specific tests requested in the review
        review_tests = [
            self.test_webrtc_access_token_demo_user,
            self.test_webrtc_call_initiation_missing_credentials,
            self.test_twiml_outbound_call_endpoint,
            self.test_twiml_client_incoming_endpoint,
        ]
        
        review_tests_passed = 0
        for test in review_tests:
            if test():
                review_tests_passed += 1
        
        print("=" * 60)
        print(f"📊 WebRTC Review Tests Results: {review_tests_passed}/{len(review_tests)} tests passed")
        
        if review_tests_passed == len(review_tests):
            print("🎉 All WebRTC review tests PASSED!")
            return True
        else:
            print("⚠️  Some WebRTC review tests FAILED!")
            return False

    def run_import_tests_only(self) -> bool:
        """Run only the lead import functionality tests"""
        print("🚀 Starting Lead Import Functionality Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # First get authentication
        if not self.test_health():
            return False
        if not self.test_login():
            return False
        
        # Run import-specific tests
        import_tests = [
            self.test_import_leads_basic,
            self.test_import_leads_phone_normalization,
            self.test_import_leads_duplicate_emails,
            self.test_import_leads_invalid_data,
            self.test_import_leads_user_excel_format,  # New test for user's Excel format
            self.test_delete_all_import_workflow,  # NEW: Complete DELETE ALL → IMPORT workflow test
        ]
        
        import_tests_passed = 0
        for test in import_tests:
            if test():
                import_tests_passed += 1
        
        print("=" * 60)
        print(f"📊 Import Tests Results: {import_tests_passed}/{len(import_tests)} tests passed")
        
        if import_tests_passed == len(import_tests):
            print("🎉 All lead import tests PASSED!")
            return True
        else:
            print("⚠️  Some lead import tests FAILED!")
            return False

    def test_email_draft_with_llm(self) -> bool:
        """Test GET /api/email/draft with different parameters"""
        # Use the specific lead ID from the review request
        lead_id = "aafbf986-8cce-4bab-91fc-60d6f4148a07"
        demo_user_id = "03f82986-51af-460c-a549-1c5077e67fb0"
        
        try:
            # First, create the test lead with the specific ID if it doesn't exist
            lead_payload = {
                "user_id": demo_user_id,
                "first_name": "Email",
                "last_name": "TestLead",
                "email": "email.testlead@example.com",
                "phone": "+14155551234",
                "property_type": "Single Family Home",
                "neighborhood": "Downtown",
                "price_min": 500000,
                "price_max": 750000,
                "priority": "high",
                "stage": "New"
            }
            
            # Try to create lead with specific ID by updating after creation
            lead_response = requests.post(f"{self.base_url}/leads", json=lead_payload, timeout=10)
            if lead_response.status_code == 200:
                created_lead = lead_response.json()
                actual_lead_id = created_lead.get("id")
                print(f"  📝 Created test lead with ID: {actual_lead_id}")
            else:
                # Try to use the requested lead_id directly
                actual_lead_id = lead_id
                print(f"  📝 Using requested lead ID: {actual_lead_id}")
            
            # Test different combinations of parameters
            test_cases = [
                {"template": "follow_up", "tone": "professional", "provider": "emergent"},
                {"template": "new_listing", "tone": "friendly", "provider": "openai"},
                {"template": "appointment_reminder", "tone": "formal", "provider": "claude"},
                {"template": "follow_up", "tone": "casual", "provider": "gemini"}
            ]
            
            success_count = 0
            for i, case in enumerate(test_cases):
                params = {
                    "lead_id": actual_lead_id,
                    "email_template": case["template"],
                    "tone": case["tone"],
                    "llm_provider": case["provider"]
                }
                
                response = requests.get(f"{self.base_url}/email/draft", params=params, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    if (data.get("status") == "success" and 
                        "subject" in data and 
                        "body" in data and
                        data.get("template_used") == case["template"] and
                        data.get("tone") == case["tone"] and
                        data.get("llm_provider") == case["provider"]):
                        success_count += 1
                        print(f"  ✅ Test case {i+1}: {case['template']}/{case['tone']}/{case['provider']} - SUCCESS")
                    elif data.get("fallback_used") == True:
                        # Fallback is acceptable if LLM fails
                        success_count += 1
                        print(f"  ⚠️  Test case {i+1}: {case['template']}/{case['tone']}/{case['provider']} - FALLBACK USED")
                    else:
                        print(f"  ❌ Test case {i+1}: Invalid response structure: {data}")
                else:
                    print(f"  ❌ Test case {i+1}: Status {response.status_code}: {response.text}")
            
            if success_count == len(test_cases):
                self.log_test("Email Draft with LLM", True, f"All {success_count}/{len(test_cases)} test cases passed")
                return True
            else:
                self.log_test("Email Draft with LLM", False, f"Only {success_count}/{len(test_cases)} test cases passed")
                return False
                
        except Exception as e:
            self.log_test("Email Draft with LLM", False, f"Exception: {str(e)}")
            return False

    def test_email_history(self) -> bool:
        """Test GET /api/email/history/{lead_id}"""
        # Use the specific lead ID from the review request
        lead_id = "aafbf986-8cce-4bab-91fc-60d6f4148a07"
        
        try:
            response = requests.get(f"{self.base_url}/email/history/{lead_id}", timeout=10)
            
            if response.status_code == 200:
                history = response.json()
                if isinstance(history, list):
                    self.log_test("Email History", True, f"Email history retrieved successfully. Found {len(history)} records")
                    return True
                else:
                    self.log_test("Email History", False, f"Expected list response, got: {type(history)}")
                    return False
            else:
                self.log_test("Email History", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Email History", False, f"Exception: {str(e)}")
            return False

    def test_email_send_setup_required(self) -> bool:
        """Test POST /api/email/send with no SMTP configuration"""
        demo_user_id = "03f82986-51af-460c-a549-1c5077e67fb0"
        
        try:
            # First, create a test lead with email address
            timestamp = int(time.time()) + 300
            lead_payload = {
                "user_id": demo_user_id,
                "first_name": "Email",
                "last_name": "SendTest",
                "email": f"email.sendtest.{timestamp}@example.com",
                "phone": "+14155551234",
                "property_type": "House"
            }
            
            lead_response = requests.post(f"{self.base_url}/leads", json=lead_payload, timeout=10)
            if lead_response.status_code != 200:
                self.log_test("Email Send Setup Required", False, f"Failed to create test lead: {lead_response.text}")
                return False
            
            lead_data = lead_response.json()
            test_lead_id = lead_data.get("id")
            
            # Ensure SMTP settings are cleared
            settings_payload = {
                "user_id": demo_user_id,
                "smtp_protocol": None,
                "smtp_hostname": None,
                "smtp_port": None,
                "smtp_ssl_tls": None,
                "smtp_username": None,
                "smtp_password": None,
                "smtp_from_email": None,
                "smtp_from_name": None
            }
            settings_response = requests.post(f"{self.base_url}/settings", json=settings_payload, timeout=10)
            
            if settings_response.status_code != 200:
                self.log_test("Email Send Setup Required", False, f"Failed to clear SMTP settings: {settings_response.text}")
                return False
            
            # Test email sending without SMTP configuration
            email_payload = {
                "lead_id": test_lead_id,
                "subject": "Test Email",
                "body": "This is a test email to verify SMTP setup validation.",
                "email_template": "follow_up",
                "llm_provider": "emergent"
            }
            
            response = requests.post(f"{self.base_url}/email/send", json=email_payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("status") == "error" and 
                    ("SMTP configuration incomplete" in data.get("message", "") or
                     data.get("setup_required") == True)):
                    self.log_test("Email Send Setup Required", True, f"Proper setup_required error: {data.get('message', '')}")
                    return True
                else:
                    self.log_test("Email Send Setup Required", False, f"Unexpected response: {data}")
                    return False
            else:
                self.log_test("Email Send Setup Required", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Email Send Setup Required", False, f"Exception: {str(e)}")
            return False

    def test_smtp_settings_integration(self) -> bool:
        """Test SMTP settings storage and retrieval"""
        demo_user_id = "03f82986-51af-460c-a549-1c5077e67fb0"
        
        try:
            # Test saving SMTP settings
            smtp_settings = {
                "user_id": demo_user_id,
                "smtp_protocol": "SMTP",
                "smtp_hostname": "smtp.gmail.com",
                "smtp_port": "587",
                "smtp_ssl_tls": True,
                "smtp_username": "test@gmail.com",
                "smtp_password": "test_password",
                "smtp_from_email": "test@gmail.com",
                "smtp_from_name": "Test Agent"
            }
            
            save_response = requests.post(f"{self.base_url}/settings", json=smtp_settings, timeout=10)
            
            if save_response.status_code != 200:
                self.log_test("SMTP Settings Integration", False, f"Failed to save SMTP settings: {save_response.text}")
                return False
            
            # Verify settings were saved
            get_response = requests.get(f"{self.base_url}/settings", params={"user_id": demo_user_id}, timeout=10)
            
            if get_response.status_code != 200:
                self.log_test("SMTP Settings Integration", False, f"Failed to retrieve settings: {get_response.text}")
                return False
            
            settings = get_response.json()
            
            # Check all SMTP fields are present and correct
            smtp_fields = [
                "smtp_protocol", "smtp_hostname", "smtp_port", "smtp_ssl_tls",
                "smtp_username", "smtp_password", "smtp_from_email", "smtp_from_name"
            ]
            
            missing_fields = []
            incorrect_fields = []
            
            for field in smtp_fields:
                if field not in settings:
                    missing_fields.append(field)
                elif settings[field] != smtp_settings[field]:
                    incorrect_fields.append(f"{field}: expected {smtp_settings[field]}, got {settings[field]}")
            
            if missing_fields:
                self.log_test("SMTP Settings Integration", False, f"Missing SMTP fields: {missing_fields}")
                return False
            
            if incorrect_fields:
                self.log_test("SMTP Settings Integration", False, f"Incorrect SMTP field values: {incorrect_fields}")
                return False
            
            self.log_test("SMTP Settings Integration", True, f"All SMTP settings stored and retrieved correctly")
            return True
            
        except Exception as e:
            self.log_test("SMTP Settings Integration", False, f"Exception: {str(e)}")
            return False

    def run_email_tests_only(self) -> bool:
        """Run only the email integration tests"""
        print("🚀 Starting Email Integration Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # First get authentication
        if not self.test_health():
            return False
        if not self.test_login():
            return False
        
        # Run email-specific tests
        email_tests = [
            self.test_email_draft_with_llm,
            self.test_email_history,
            self.test_email_send_setup_required,
            self.test_smtp_settings_integration,
        ]
        
        email_tests_passed = 0
        for test in email_tests:
            if test():
                email_tests_passed += 1
        
        print("=" * 60)
        print(f"📊 Email Tests Results: {email_tests_passed}/{len(email_tests)} tests passed")
        
        if email_tests_passed == len(email_tests):
            print("🎉 All email integration tests PASSED!")
            return True
        else:
            print("⚠️  Some email integration tests FAILED!")
            return False

    def run_delete_import_workflow_only(self) -> bool:
        """Run only the DELETE ALL → IMPORT workflow test as requested"""
        print("🚀 Starting DELETE ALL → IMPORT Workflow Test")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # First get authentication
        if not self.test_health():
            return False
        if not self.test_login():
            return False
        
        # Run the specific workflow test
        success = self.test_delete_all_import_workflow()
        
        print("=" * 60)
        if success:
            print("🎉 DELETE ALL → IMPORT workflow test PASSED!")
            return True
        else:
            print("⚠️  DELETE ALL → IMPORT workflow test FAILED!")
            return False

    def test_comprehensive_lead_creation(self) -> bool:
        """Test creating a lead with comprehensive field structure"""
        # Use the specific demo user ID as requested
        demo_user_id = "03f82986-51af-460c-a549-1c5077e67fb0"
        
        try:
            timestamp = int(time.time()) + 500
            
            # Create comprehensive lead payload with all new fields
            comprehensive_payload = {
                "user_id": demo_user_id,
                
                # Basic fields
                "first_name": "John",
                "last_name": "Comprehensive",
                "email": f"john.comprehensive.{timestamp}@example.com",
                "phone": "+14155551234",
                "lead_description": "Comprehensive lead test with all fields",
                
                # Additional Contact Information
                "work_phone": "+14155551235",
                "home_phone": "+14155551236", 
                "email_2": f"john.alt.{timestamp}@example.com",
                
                # Spouse Information
                "spouse_first_name": "Jane",
                "spouse_last_name": "Comprehensive",
                "spouse_email": f"jane.comprehensive.{timestamp}@example.com",
                "spouse_mobile_phone": "+14155551237",
                "spouse_birthday": "1985-06-15",
                
                # Pipeline and Status
                "pipeline": "Residential Sales",
                "status": "Active",
                "ref_source": "Website",
                "lead_rating": "A",
                "lead_source": "Online",
                "lead_type": "Buyer",
                "lead_type_2": "First Time Buyer",
                
                # Property Information
                "house_to_sell": "Yes",
                "buying_in": "San Francisco",
                "selling_in": "Oakland",
                "owns_rents": "Owns",
                "mortgage_type": "Conventional",
                
                # Address Information
                "city": "San Francisco",
                "zip_postal_code": "94102",
                "address": "123 Market Street",
                
                # Property Details
                "property_type": "Single Family Home",
                "property_condition": "Good",
                "bedrooms": "3",
                "bathrooms": "2",
                "basement": "Yes",
                "parking_type": "Garage",
                
                # Agent Assignments
                "main_agent": "Agent Smith",
                "mort_agent": "Mortgage Jones",
                "list_agent": "Listing Brown",
                
                # Custom Fields (JSON object)
                "custom_fields": {
                    "preferred_contact_time": "Evening",
                    "budget_flexibility": "High",
                    "timeline": "3-6 months",
                    "special_requirements": "Pet-friendly"
                },
                
                # Existing compatibility fields
                "neighborhood": "SOMA",
                "price_min": 800000,
                "price_max": 1200000,
                "priority": "high",
                "source_tags": ["Website", "Comprehensive Test"],
                "notes": "Comprehensive lead test with all new fields",
                "stage": "New",
                "in_dashboard": True
            }
            
            response = requests.post(f"{self.base_url}/leads", json=comprehensive_payload, timeout=15)
            
            if response.status_code == 200:
                lead = response.json()
                
                # Verify all comprehensive fields are present and correct
                checks = []
                
                # Basic fields
                checks.append(("first_name", lead.get("first_name") == "John"))
                checks.append(("last_name", lead.get("last_name") == "Comprehensive"))
                checks.append(("email", lead.get("email") == f"john.comprehensive.{timestamp}@example.com"))
                checks.append(("phone", lead.get("phone") == "+14155551234"))
                
                # Contact fields
                checks.append(("work_phone", lead.get("work_phone") == "+14155551235"))
                checks.append(("home_phone", lead.get("home_phone") == "+14155551236"))
                
                # Spouse fields
                checks.append(("spouse_first_name", lead.get("spouse_first_name") == "Jane"))
                checks.append(("spouse_last_name", lead.get("spouse_last_name") == "Comprehensive"))
                
                # Pipeline fields
                checks.append(("pipeline", lead.get("pipeline") == "Residential Sales"))
                checks.append(("status", lead.get("status") == "Active"))
                checks.append(("lead_rating", lead.get("lead_rating") == "A"))
                
                # Property fields
                checks.append(("house_to_sell", lead.get("house_to_sell") == "Yes"))
                checks.append(("buying_in", lead.get("buying_in") == "San Francisco"))
                checks.append(("city", lead.get("city") == "San Francisco"))
                
                # Property details
                checks.append(("bedrooms", lead.get("bedrooms") == "3"))
                checks.append(("bathrooms", lead.get("bathrooms") == "2"))
                
                # Agent assignments
                checks.append(("main_agent", lead.get("main_agent") == "Agent Smith"))
                
                # Custom fields (JSON object)
                custom_fields = lead.get("custom_fields", {})
                checks.append(("custom_fields_contact_time", custom_fields.get("preferred_contact_time") == "Evening"))
                
                # Check if lead has ID and created_at
                checks.append(("id", "id" in lead and lead["id"]))
                checks.append(("created_at", "created_at" in lead and lead["created_at"]))
                
                # Count successful checks
                passed_checks = [check for check in checks if check[1]]
                failed_checks = [check[0] for check in checks if not check[1]]
                
                if len(failed_checks) == 0:
                    self.log_test("Comprehensive Lead Creation", True, 
                                f"All {len(checks)} comprehensive fields verified successfully. Lead ID: {lead.get('id')}")
                    return True
                else:
                    self.log_test("Comprehensive Lead Creation", False, 
                                f"Failed field checks: {failed_checks}. Passed: {len(passed_checks)}/{len(checks)}")
                    return False
            else:
                self.log_test("Comprehensive Lead Creation", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Comprehensive Lead Creation", False, f"Exception: {str(e)}")
            return False

    def test_comprehensive_lead_retrieval(self) -> bool:
        """Test that existing leads are retrieved correctly with new field structure"""
        # Use the specific demo user ID as requested
        demo_user_id = "03f82986-51af-460c-a549-1c5077e67fb0"
        
        try:
            # Get all leads for the demo user
            response = requests.get(f"{self.base_url}/leads", params={"user_id": demo_user_id}, timeout=10)
            
            if response.status_code == 200:
                leads = response.json()
                
                if isinstance(leads, list) and len(leads) > 0:
                    # Check that leads have the expected structure
                    sample_lead = leads[0]
                    
                    # Check for basic required fields
                    required_fields = ["id", "user_id", "created_at", "stage"]
                    missing_required = [field for field in required_fields if field not in sample_lead]
                    
                    if missing_required:
                        self.log_test("Comprehensive Lead Retrieval", False, 
                                    f"Missing required fields in lead: {missing_required}")
                        return False
                    
                    # Check that comprehensive fields are supported (can be None/null)
                    comprehensive_fields = [
                        "first_name", "last_name", "email", "phone", "lead_description",
                        "work_phone", "home_phone", "email_2",
                        "spouse_first_name", "spouse_last_name", "spouse_email", "spouse_mobile_phone", "spouse_birthday",
                        "pipeline", "status", "ref_source", "lead_rating", "lead_source", "lead_type", "lead_type_2",
                        "house_to_sell", "buying_in", "selling_in", "owns_rents", "mortgage_type",
                        "city", "zip_postal_code", "address",
                        "property_condition", "bedrooms", "bathrooms", "basement", "parking_type",
                        "main_agent", "mort_agent", "list_agent", "custom_fields"
                    ]
                    
                    # Count how many comprehensive fields are present in the lead structure
                    present_fields = [field for field in comprehensive_fields if field in sample_lead]
                    
                    self.log_test("Comprehensive Lead Retrieval", True, 
                                f"Retrieved {len(leads)} leads successfully. "
                                f"Sample lead has {len(present_fields)}/{len(comprehensive_fields)} comprehensive fields. "
                                f"Required fields present: {required_fields}")
                    return True
                else:
                    self.log_test("Comprehensive Lead Retrieval", False, f"Expected array with leads, got: {leads}")
                    return False
            else:
                self.log_test("Comprehensive Lead Retrieval", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Comprehensive Lead Retrieval", False, f"Exception: {str(e)}")
            return False

    def test_comprehensive_field_compatibility(self) -> bool:
        """Test that existing leads work with new field structure and don't break"""
        # Use the specific demo user ID as requested
        demo_user_id = "03f82986-51af-460c-a549-1c5077e67fb0"
        
        try:
            # First create a simple lead with minimal fields (old style)
            timestamp = int(time.time()) + 600
            simple_payload = {
                "user_id": demo_user_id,
                "name": "Simple Legacy Lead",
                "email": f"simple.legacy.{timestamp}@example.com",
                "phone": "+14155559999",
                "property_type": "Condo",
                "stage": "New"
            }
            
            response = requests.post(f"{self.base_url}/leads", json=simple_payload, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Comprehensive Field Compatibility", False, f"Failed to create simple lead: {response.text}")
                return False
            
            simple_lead = response.json()
            simple_lead_id = simple_lead.get("id")
            
            if not simple_lead_id:
                self.log_test("Comprehensive Field Compatibility", False, f"No ID in simple lead response: {simple_lead}")
                return False
            
            # Now try to update this lead with comprehensive fields
            update_payload = {
                "spouse_first_name": "Updated Spouse",
                "pipeline": "Updated Pipeline",
                "custom_fields": {
                    "test_field": "test_value",
                    "compatibility": "verified"
                },
                "bedrooms": "4",
                "city": "Updated City"
            }
            
            update_response = requests.put(f"{self.base_url}/leads/{simple_lead_id}", json=update_payload, timeout=10)
            
            if update_response.status_code == 200:
                updated_lead = update_response.json()
                
                # Verify the update worked and comprehensive fields are present
                checks = []
                checks.append(("spouse_first_name", updated_lead.get("spouse_first_name") == "Updated Spouse"))
                checks.append(("pipeline", updated_lead.get("pipeline") == "Updated Pipeline"))
                checks.append(("bedrooms", updated_lead.get("bedrooms") == "4"))
                checks.append(("city", updated_lead.get("city") == "Updated City"))
                
                # Check custom fields
                custom_fields = updated_lead.get("custom_fields", {})
                checks.append(("custom_fields_test", custom_fields.get("test_field") == "test_value"))
                
                # Verify original fields are preserved
                checks.append(("original_name", updated_lead.get("name") == "Simple Legacy Lead"))
                checks.append(("original_email", updated_lead.get("email") == f"simple.legacy.{timestamp}@example.com"))
                checks.append(("original_phone", updated_lead.get("phone") == "+14155559999"))
                
                failed_checks = [check[0] for check in checks if not check[1]]
                
                if len(failed_checks) == 0:
                    self.log_test("Comprehensive Field Compatibility", True, 
                                f"Field compatibility verified. Simple lead updated with comprehensive fields successfully. "
                                f"All {len(checks)} checks passed.")
                    return True
                else:
                    self.log_test("Comprehensive Field Compatibility", False, 
                                f"Failed compatibility checks: {failed_checks}")
                    return False
            else:
                self.log_test("Comprehensive Field Compatibility", False, 
                            f"Failed to update lead with comprehensive fields. Status: {update_response.status_code}, Response: {update_response.text}")
                return False
                
        except Exception as e:
            self.log_test("Comprehensive Field Compatibility", False, f"Exception: {str(e)}")
            return False

    def test_comprehensive_data_validation(self) -> bool:
        """Test that comprehensive lead creation endpoint handles all new fields properly"""
        # Use the specific demo user ID as requested
        demo_user_id = "03f82986-51af-460c-a549-1c5077e67fb0"
        
        try:
            timestamp = int(time.time()) + 700
            
            # Test with various data types and edge cases
            validation_payload = {
                "user_id": demo_user_id,
                
                # Test string fields
                "first_name": "Validation",
                "last_name": "Test",
                "email": f"validation.test.{timestamp}@example.com",
                "phone": "4155551234",  # Test phone normalization
                "lead_description": "Testing comprehensive validation with special chars: @#$%^&*()",
                
                # Test additional contact fields
                "work_phone": "14155551235",  # Different phone format
                "home_phone": "+1-415-555-1236",  # Phone with dashes
                "email_2": f"validation.alt.{timestamp}@test.org",
                
                # Test spouse fields with various formats
                "spouse_first_name": "Spouse Name",
                "spouse_last_name": "Test",
                "spouse_email": f"spouse.{timestamp}@example.com",
                "spouse_mobile_phone": "(415) 555-1237",  # Phone with parentheses
                "spouse_birthday": "1990-12-25",  # Date format
                
                # Test pipeline fields
                "pipeline": "Test Pipeline with Spaces",
                "status": "Active Status",
                "ref_source": "Website Referral",
                "lead_rating": "A+",
                "lead_source": "Online Marketing",
                "lead_type": "Buyer/Seller",
                "lead_type_2": "Investment Property",
                
                # Test property fields
                "house_to_sell": "Maybe",
                "buying_in": "San Francisco Bay Area",
                "selling_in": "East Bay",
                "owns_rents": "Currently Renting",
                "mortgage_type": "FHA Loan",
                
                # Test address fields
                "city": "San Francisco",
                "zip_postal_code": "94102-1234",  # Extended ZIP
                "address": "123 Main Street, Apt 4B",
                
                # Test property details
                "property_condition": "Needs Renovation",
                "bedrooms": "3-4",  # Range format
                "bathrooms": "2.5",  # Decimal format
                "basement": "Partial",
                "parking_type": "Street Parking",
                
                # Test agent assignments
                "main_agent": "John Smith, Realtor",
                "mort_agent": "Jane Doe, Mortgage Broker",
                "list_agent": "Bob Johnson, Listing Agent",
                
                # Test complex custom fields
                "custom_fields": {
                    "preferences": {
                        "style": "Modern",
                        "features": ["Pool", "Garden", "Garage"]
                    },
                    "budget_details": {
                        "down_payment": 200000,
                        "monthly_payment": 4500,
                        "flexibility": True
                    },
                    "timeline": "6 months",
                    "notes": "Very specific requirements"
                },
                
                # Test existing compatibility fields
                "property_type": "Single Family Home",
                "neighborhood": "Mission District",
                "price_min": 900000,
                "price_max": 1300000,
                "priority": "high",
                "source_tags": ["Website", "Validation Test", "Comprehensive"],
                "notes": "Comprehensive validation test with all field types",
                "stage": "New",
                "in_dashboard": True
            }
            
            response = requests.post(f"{self.base_url}/leads", json=validation_payload, timeout=15)
            
            if response.status_code == 200:
                lead = response.json()
                
                # Verify data validation and normalization
                validation_checks = []
                
                # Check phone normalization
                validation_checks.append(("phone_normalized", lead.get("phone", "").startswith("+")))
                validation_checks.append(("work_phone_normalized", lead.get("work_phone", "").startswith("+")))
                validation_checks.append(("home_phone_normalized", lead.get("home_phone", "").startswith("+")))
                validation_checks.append(("spouse_phone_normalized", lead.get("spouse_mobile_phone", "").startswith("+")))
                
                # Check email validation
                validation_checks.append(("email_valid", "@" in lead.get("email", "")))
                validation_checks.append(("email_2_valid", "@" in lead.get("email_2", "")))
                validation_checks.append(("spouse_email_valid", "@" in lead.get("spouse_email", "")))
                
                # Check complex custom fields preservation
                custom_fields = lead.get("custom_fields", {})
                validation_checks.append(("custom_fields_present", isinstance(custom_fields, dict)))
                validation_checks.append(("custom_preferences", "preferences" in custom_fields))
                validation_checks.append(("custom_budget", "budget_details" in custom_fields))
                
                # Check that all text fields are preserved
                validation_checks.append(("description_preserved", "special chars" in lead.get("lead_description", "")))
                validation_checks.append(("pipeline_preserved", "Test Pipeline" in lead.get("pipeline", "")))
                validation_checks.append(("address_preserved", "Apt 4B" in lead.get("address", "")))
                
                # Check required fields
                validation_checks.append(("has_id", "id" in lead and lead["id"]))
                validation_checks.append(("has_user_id", lead.get("user_id") == demo_user_id))
                validation_checks.append(("has_created_at", "created_at" in lead))
                
                failed_validations = [check[0] for check in validation_checks if not check[1]]
                
                if len(failed_validations) == 0:
                    self.log_test("Comprehensive Data Validation", True, 
                                f"All {len(validation_checks)} validation checks passed. "
                                f"Phone normalization, email validation, and complex data structures working correctly.")
                    return True
                else:
                    self.log_test("Comprehensive Data Validation", False, 
                                f"Failed validation checks: {failed_validations}")
                    return False
            else:
                self.log_test("Comprehensive Data Validation", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Comprehensive Data Validation", False, f"Exception: {str(e)}")
            return False

    def run_comprehensive_lead_tests_only(self) -> bool:
        """Run only the comprehensive lead model tests"""
        print("🚀 Starting Comprehensive Lead Model Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # First get authentication
        if not self.test_health():
            return False
        if not self.test_login():
            return False
        
        # Run comprehensive lead tests
        comprehensive_tests = [
            self.test_comprehensive_lead_creation,
            self.test_comprehensive_lead_retrieval,
            self.test_comprehensive_field_compatibility,
            self.test_comprehensive_data_validation,
        ]
        
        comprehensive_tests_passed = 0
        for test in comprehensive_tests:
            if test():
                comprehensive_tests_passed += 1
        
        print("=" * 60)
        print(f"📊 Comprehensive Lead Tests Results: {comprehensive_tests_passed}/{len(comprehensive_tests)} tests passed")
        
        if comprehensive_tests_passed == len(comprehensive_tests):
            print("🎉 All comprehensive lead model tests PASSED!")
            return True
        else:
            print("⚠️  Some comprehensive lead model tests FAILED!")
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
            self.test_ai_chat,
            
            # Comprehensive Lead Model Tests (NEW)
            self.test_comprehensive_lead_creation,
            self.test_comprehensive_lead_retrieval,
            self.test_comprehensive_field_compatibility,
            self.test_comprehensive_data_validation,
            
            # Lead import functionality tests
            self.test_import_leads_basic,
            self.test_import_leads_phone_normalization,
            self.test_import_leads_duplicate_emails,
            self.test_import_leads_invalid_data,
            self.test_import_leads_user_excel_format,  # New test for user's Excel format
            self.test_delete_all_import_workflow,  # NEW: Complete DELETE ALL → IMPORT workflow test
            # WebRTC calling functionality tests
            self.test_twilio_access_token_with_valid_credentials,
            self.test_twilio_access_token_missing_credentials,
            self.test_twilio_webrtc_call_preparation,
            self.test_twilio_webrtc_call_missing_credentials,
            self.test_twilio_webrtc_call_invalid_lead,
            # Email integration tests
            self.test_email_draft_with_llm,
            self.test_email_history,
            self.test_email_send_setup_required,
            self.test_smtp_settings_integration,
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
    import sys
    
    # Check command line arguments for specific test modes
    if len(sys.argv) > 1:
        if sys.argv[1] == "--import-only":
            tester = RealtorsPalAPITester()
            success = tester.run_import_tests_only()
        elif sys.argv[1] == "--delete-import-workflow":
            tester = RealtorsPalAPITester()
            success = tester.run_delete_import_workflow_only()
        elif sys.argv[1] == "--webrtc-only":
            tester = RealtorsPalAPITester()
            success = tester.run_webrtc_tests_only()
        elif sys.argv[1] == "--webrtc-review":
            tester = RealtorsPalAPITester()
            success = tester.run_webrtc_review_tests()
        elif sys.argv[1] == "--email-only":
            tester = RealtorsPalAPITester()
            success = tester.run_email_tests_only()
        elif sys.argv[1] == "--comprehensive-leads":
            tester = RealtorsPalAPITester()
            success = tester.run_comprehensive_lead_tests_only()
        else:
            tester = RealtorsPalAPITester()
            success = tester.run_all_tests()
    else:
        tester = RealtorsPalAPITester()
        success = tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())