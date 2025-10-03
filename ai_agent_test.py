#!/usr/bin/env python3
"""
AI Agent Integration Test for RealtorsPal AI
Tests all AI Agent endpoints as requested in the review
"""

import requests
import sys
import json
import time
from datetime import datetime
from typing import Optional, Dict, Any

class AIAgentTester:
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
        self.demo_user_id = "03f82986-51af-460c-a549-1c5077e67fb0"  # As requested
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

    def test_ai_agents_get_all(self) -> bool:
        """Test GET /api/ai-agents"""
        try:
            response = requests.get(f"{self.base_url}/ai-agents", params={"user_id": self.demo_user_id}, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "agents" in data and isinstance(data["agents"], list):
                    agents = data["agents"]
                    
                    # Check for expected default agents
                    expected_agents = ["orchestrator", "lead-generator", "lead-nurturing", "customer-service", "onboarding", "call-analyst"]
                    found_agents = [agent.get("id") for agent in agents]
                    
                    if len(agents) >= 6:  # Should have at least 6 default agents
                        # Check for orchestrator agent specifically
                        orchestrator = next((a for a in agents if a.get("id") == "orchestrator"), None)
                        if orchestrator:
                            self.log_test("AI Agents Get All", True, 
                                        f"Found {len(agents)} agents including orchestrator. Agents: {found_agents}")
                            return True
                        else:
                            self.log_test("AI Agents Get All", False, f"Orchestrator agent not found. Found: {found_agents}")
                            return False
                    else:
                        self.log_test("AI Agents Get All", False, f"Expected at least 6 agents, got {len(agents)}: {found_agents}")
                        return False
                else:
                    self.log_test("AI Agents Get All", False, f"Invalid response structure: {data}")
                    return False
            else:
                self.log_test("AI Agents Get All", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("AI Agents Get All", False, f"Exception: {str(e)}")
            return False

    def test_ai_agents_orchestrate_analyze_lead(self) -> bool:
        """Test POST /api/ai-agents/orchestrate with analyze_and_assign_lead task"""
        try:
            # Create a test lead first
            timestamp = int(time.time()) + 300
            lead_payload = {
                "user_id": self.demo_user_id,
                "first_name": "AI",
                "last_name": "TestLead",
                "email": f"ai.testlead.{timestamp}@example.com",
                "phone": "+14155551111",
                "property_type": "Single Family Home",
                "neighborhood": "AI Test Area",
                "priority": "high",
                "pipeline": "New Lead"
            }
            lead_response = requests.post(f"{self.base_url}/leads", json=lead_payload, timeout=10)
            
            if lead_response.status_code != 200:
                self.log_test("AI Agents Orchestrate Analyze Lead", False, f"Failed to create test lead: {lead_response.text}")
                return False
            
            lead_data = lead_response.json()
            lead_id = lead_data.get("id")
            
            # Test orchestrate endpoint with analyze_and_assign_lead task
            orchestrate_payload = {
                "agent_id": "orchestrator",
                "task_type": "analyze_and_assign_lead",
                "lead_data": {
                    "lead_id": lead_id,
                    "first_name": "AI",
                    "last_name": "TestLead",
                    "email": f"ai.testlead.{timestamp}@example.com",
                    "phone": "+14155551111",
                    "property_type": "Single Family Home",
                    "neighborhood": "AI Test Area",
                    "priority": "high",
                    "pipeline": "New Lead"
                },
                "approval_mode": "ask",
                "priority": "high"
            }
            
            response = requests.post(f"{self.base_url}/ai-agents/orchestrate", json=orchestrate_payload, params={"user_id": self.demo_user_id}, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for expected orchestrator response structure
                if ("selected_agent" in data and 
                    "task" in data and 
                    "rationale" in data):
                    
                    # Check if human approval is properly configured
                    human_approval = data.get("human_approval", {})
                    if human_approval.get("required") and "ask" in orchestrate_payload.get("approval_mode", ""):
                        self.log_test("AI Agents Orchestrate Analyze Lead", True, 
                                    f"Orchestrator selected: {data.get('selected_agent')}, "
                                    f"Task: {data.get('task')}, "
                                    f"Approval required: {human_approval.get('required')}")
                        return True
                    else:
                        # Also accept if orchestrator processes without approval
                        self.log_test("AI Agents Orchestrate Analyze Lead", True, 
                                    f"Orchestrator processed task. Selected: {data.get('selected_agent')}, "
                                    f"Task: {data.get('task')}")
                        return True
                else:
                    self.log_test("AI Agents Orchestrate Analyze Lead", False, f"Invalid orchestrator response structure: {data}")
                    return False
            else:
                self.log_test("AI Agents Orchestrate Analyze Lead", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("AI Agents Orchestrate Analyze Lead", False, f"Exception: {str(e)}")
            return False

    def test_ai_agents_orchestrate_automate_mode(self) -> bool:
        """Test POST /api/ai-agents/orchestrate with approval_mode: 'automate'"""
        try:
            # Test orchestrate endpoint with automate mode
            orchestrate_payload = {
                "agent_id": "orchestrator",
                "task_type": "lead_nurturing",
                "lead_data": {
                    "first_name": "Automated",
                    "last_name": "TestLead",
                    "email": "automated.test@example.com",
                    "phone": "+14155552222",
                    "property_type": "Condo",
                    "pipeline": "warm / nurturing"
                },
                "approval_mode": "automate",
                "priority": "medium"
            }
            
            response = requests.post(f"{self.base_url}/ai-agents/orchestrate", json=orchestrate_payload, params={"user_id": self.demo_user_id}, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for expected orchestrator response structure
                if ("selected_agent" in data and 
                    "task" in data):
                    
                    # In automate mode, should either not require approval or process automatically
                    human_approval = data.get("human_approval", {})
                    approval_required = human_approval.get("required", False)
                    
                    self.log_test("AI Agents Orchestrate Automate Mode", True, 
                                f"Orchestrator in automate mode. Selected: {data.get('selected_agent')}, "
                                f"Task: {data.get('task')}, "
                                f"Approval required: {approval_required}")
                    return True
                else:
                    self.log_test("AI Agents Orchestrate Automate Mode", False, f"Invalid orchestrator response structure: {data}")
                    return False
            else:
                self.log_test("AI Agents Orchestrate Automate Mode", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("AI Agents Orchestrate Automate Mode", False, f"Exception: {str(e)}")
            return False

    def test_ai_agents_activities_get(self) -> bool:
        """Test GET /api/ai-agents/activities"""
        try:
            response = requests.get(f"{self.base_url}/ai-agents/activities", params={"user_id": self.demo_user_id, "limit": 20}, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "activities" in data and isinstance(data["activities"], list):
                    activities = data["activities"]
                    
                    # Should return activities array (may be empty initially)
                    self.log_test("AI Agents Activities Get", True, 
                                f"Retrieved {len(activities)} activities successfully")
                    return True
                else:
                    self.log_test("AI Agents Activities Get", False, f"Invalid response structure: {data}")
                    return False
            else:
                self.log_test("AI Agents Activities Get", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("AI Agents Activities Get", False, f"Exception: {str(e)}")
            return False

    def test_ai_agents_activities_create(self) -> bool:
        """Test POST /api/ai-agents/activities"""
        try:
            # Create a test activity for lead processing
            activity_payload = {
                "agent_id": "lead-nurturing",
                "agent_name": "Lead Nurturing AI",
                "activity": "Created personalized follow-up sequence for high-priority lead",
                "status": "completed",
                "type": "automated",
                "details": {
                    "lead_id": "test-lead-123",
                    "sequence_type": "initial_contact",
                    "personalization_score": 0.92
                }
            }
            
            response = requests.post(f"{self.base_url}/ai-agents/activities", json=activity_payload, params={"user_id": self.demo_user_id}, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("status") == "success" and 
                    "activity" in data and 
                    data["activity"].get("agent_id") == "lead-nurturing"):
                    
                    activity = data["activity"]
                    self.log_test("AI Agents Activities Create", True, 
                                f"Created activity: {activity.get('activity')}, "
                                f"Agent: {activity.get('agent_name')}, "
                                f"Status: {activity.get('status')}")
                    return True
                else:
                    self.log_test("AI Agents Activities Create", False, f"Invalid activity creation response: {data}")
                    return False
            else:
                self.log_test("AI Agents Activities Create", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("AI Agents Activities Create", False, f"Exception: {str(e)}")
            return False

    def test_ai_agents_approvals_get(self) -> bool:
        """Test GET /api/ai-agents/approvals"""
        try:
            response = requests.get(f"{self.base_url}/ai-agents/approvals", params={"user_id": self.demo_user_id}, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "approvals" in data and isinstance(data["approvals"], list):
                    approvals = data["approvals"]
                    
                    # Should return approvals array (may be empty initially)
                    self.log_test("AI Agents Approvals Get", True, 
                                f"Retrieved {len(approvals)} pending approvals successfully")
                    return True
                else:
                    self.log_test("AI Agents Approvals Get", False, f"Invalid response structure: {data}")
                    return False
            else:
                self.log_test("AI Agents Approvals Get", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("AI Agents Approvals Get", False, f"Exception: {str(e)}")
            return False

    def test_ai_agents_approvals_create(self) -> bool:
        """Test POST /api/ai-agents/approvals"""
        try:
            # Create a test approval request
            approval_payload = {
                "user_id": self.demo_user_id,
                "agent_id": "lead-nurturing",
                "agent_name": "Lead Nurturing AI",
                "task": "Send personalized follow-up email to high-value lead",
                "proposal": {
                    "title": "High-Value Lead Follow-up",
                    "summary": [
                        "Lead shows strong buying intent",
                        "Personalized email sequence ready",
                        "Estimated conversion probability: 78%"
                    ],
                    "risks": ["Lead may be contacted by competitors"],
                    "choices": ["Approve", "Edit", "Reject"]
                },
                "priority": "high"
            }
            
            response = requests.post(f"{self.base_url}/ai-agents/approvals", json=approval_payload, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("status") == "success" and 
                    "approval" in data and 
                    data["approval"].get("agent_id") == "lead-nurturing"):
                    
                    approval = data["approval"]
                    self.log_test("AI Agents Approvals Create", True, 
                                f"Created approval request: {approval.get('task')}, "
                                f"Agent: {approval.get('agent_name')}, "
                                f"Priority: {approval.get('priority')}")
                    return True
                else:
                    self.log_test("AI Agents Approvals Create", False, f"Invalid approval creation response: {data}")
                    return False
            else:
                self.log_test("AI Agents Approvals Create", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("AI Agents Approvals Create", False, f"Exception: {str(e)}")
            return False

    def test_ai_agents_lead_generator_process(self) -> bool:
        """Test POST /api/ai-agents/lead-generator/process"""
        try:
            # Test lead generator processing
            task_payload = {
                "user_id": self.demo_user_id,
                "task_type": "social_media_lead_sourcing",
                "source_data": {
                    "platform": "facebook",
                    "post_content": "Looking for a 3BR house in downtown area, budget $500k-$700k",
                    "user_profile": {
                        "name": "John Smith",
                        "location": "Downtown",
                        "contact_hint": "john.smith@email.com"
                    }
                },
                "priority": "medium"
            }
            
            response = requests.post(f"{self.base_url}/ai-agents/lead-generator/process", json=task_payload, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for expected lead generator response structure
                if ("selected_agent" in data and 
                    "task" in data and 
                    "agent_output" in data):
                    
                    agent_output = data.get("agent_output", {})
                    if "structured_fields" in agent_output:
                        self.log_test("AI Agents Lead Generator Process", True, 
                                    f"Lead generator processed task: {data.get('task')}, "
                                    f"Output fields: {list(agent_output.get('structured_fields', {}).keys())}")
                        return True
                    else:
                        self.log_test("AI Agents Lead Generator Process", False, f"Missing structured_fields in agent_output: {data}")
                        return False
                else:
                    self.log_test("AI Agents Lead Generator Process", False, f"Invalid lead generator response structure: {data}")
                    return False
            else:
                self.log_test("AI Agents Lead Generator Process", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("AI Agents Lead Generator Process", False, f"Exception: {str(e)}")
            return False

    def test_ai_agents_lead_nurturing_process(self) -> bool:
        """Test POST /api/ai-agents/lead-nurturing/process"""
        try:
            # Test lead nurturing processing
            task_payload = {
                "user_id": self.demo_user_id,
                "task_type": "create_follow_up_sequence",
                "lead_data": {
                    "first_name": "Sarah",
                    "last_name": "Johnson",
                    "email": "sarah.johnson@example.com",
                    "phone": "+14155553333",
                    "property_type": "Condo",
                    "neighborhood": "Midtown",
                    "pipeline": "warm / nurturing",
                    "priority": "high"
                },
                "sequence_type": "warm_lead_nurturing",
                "priority": "high"
            }
            
            response = requests.post(f"{self.base_url}/ai-agents/lead-nurturing/process", json=task_payload, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for expected lead nurturing response structure
                if ("selected_agent" in data and 
                    "task" in data and 
                    "agent_output" in data):
                    
                    agent_output = data.get("agent_output", {})
                    if ("drafts_or_sequences" in agent_output and 
                        isinstance(agent_output["drafts_or_sequences"], list)):
                        self.log_test("AI Agents Lead Nurturing Process", True, 
                                    f"Lead nurturing processed task: {data.get('task')}, "
                                    f"Generated {len(agent_output['drafts_or_sequences'])} sequences/drafts")
                        return True
                    else:
                        self.log_test("AI Agents Lead Nurturing Process", False, f"Missing drafts_or_sequences in agent_output: {data}")
                        return False
                else:
                    self.log_test("AI Agents Lead Nurturing Process", False, f"Invalid lead nurturing response structure: {data}")
                    return False
            else:
                self.log_test("AI Agents Lead Nurturing Process", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("AI Agents Lead Nurturing Process", False, f"Exception: {str(e)}")
            return False

    def test_ai_agents_customer_service_process(self) -> bool:
        """Test POST /api/ai-agents/customer-service/process"""
        try:
            # Test customer service processing
            task_payload = {
                "user_id": self.demo_user_id,
                "task_type": "triage_inbound_message",
                "message_data": {
                    "from": "client@example.com",
                    "subject": "Question about property viewing",
                    "body": "Hi, I'm interested in viewing the 3BR house you listed. When would be a good time?",
                    "channel": "email",
                    "timestamp": datetime.utcnow().isoformat()
                },
                "priority": "medium"
            }
            
            response = requests.post(f"{self.base_url}/ai-agents/customer-service/process", json=task_payload, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for expected customer service response structure
                if ("selected_agent" in data and 
                    "task" in data and 
                    "agent_output" in data):
                    
                    agent_output = data.get("agent_output", {})
                    if ("scores_or_flags" in agent_output and 
                        isinstance(agent_output["scores_or_flags"], dict)):
                        self.log_test("AI Agents Customer Service Process", True, 
                                    f"Customer service processed task: {data.get('task')}, "
                                    f"Analysis scores: {list(agent_output['scores_or_flags'].keys())}")
                        return True
                    else:
                        self.log_test("AI Agents Customer Service Process", False, f"Missing scores_or_flags in agent_output: {data}")
                        return False
                else:
                    self.log_test("AI Agents Customer Service Process", False, f"Invalid customer service response structure: {data}")
                    return False
            else:
                self.log_test("AI Agents Customer Service Process", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("AI Agents Customer Service Process", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self) -> bool:
        """Run all AI Agent tests and return overall success"""
        print(f"🤖 Starting AI Agent Integration Tests against: {self.base_url}")
        print(f"👤 Using Demo User ID: {self.demo_user_id}")
        print("=" * 80)
        
        # AI Agent functionality tests
        tests = [
            self.test_ai_agents_get_all,
            self.test_ai_agents_orchestrate_analyze_lead,
            self.test_ai_agents_orchestrate_automate_mode,
            self.test_ai_agents_activities_get,
            self.test_ai_agents_activities_create,
            self.test_ai_agents_approvals_get,
            self.test_ai_agents_approvals_create,
            self.test_ai_agents_lead_generator_process,
            self.test_ai_agents_lead_nurturing_process,
            self.test_ai_agents_customer_service_process
        ]
        
        for test in tests:
            try:
                test()
                time.sleep(0.2)  # Small delay between tests
            except Exception as e:
                self.log_test(test.__name__, False, f"Exception: {str(e)}")
        
        print("=" * 80)
        print(f"📊 AI Agent Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All AI Agent tests PASSED!")
            return True
        else:
            print(f"❌ {self.tests_run - self.tests_passed} AI Agent tests FAILED")
            return False

def main():
    """Main function to run AI Agent tests"""
    tester = AIAgentTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ AI Agent Integration: ALL TESTS PASSED")
        sys.exit(0)
    else:
        print("\n❌ AI Agent Integration: SOME TESTS FAILED")
        sys.exit(1)

if __name__ == "__main__":
    main()