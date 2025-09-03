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
    def __init__(self, base_url: str = "http://localhost:8001/api"):
        # Use the backend URL from frontend .env file
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
            # Lead import functionality tests
            self.test_import_leads_basic,
            self.test_import_leads_phone_normalization,
            self.test_import_leads_duplicate_emails,
            self.test_import_leads_invalid_data,
            self.test_import_leads_user_excel_format,  # New test for user's Excel format
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
    
    # Check if we should run only import tests
    if len(sys.argv) > 1 and sys.argv[1] == "--import-only":
        tester = RealtorsPalAPITester()
        success = tester.run_import_tests_only()
    else:
        tester = RealtorsPalAPITester()
        success = tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())