#!/usr/bin/env python3
"""
Test only the Main Orchestrator AI Live Activity Stream system
"""

import requests
import sys
import json
import time
from datetime import datetime

class OrchestratorTester:
    def __init__(self):
        # Use the backend URL from frontend .env file
        try:
            with open('/app/frontend/.env', 'r') as f:
                for line in f:
                    if line.startswith('REACT_APP_BACKEND_URL='):
                        frontend_url = line.split('=', 1)[1].strip()
                        self.base_url = f"{frontend_url}/api"
                        break
        except:
            self.base_url = "http://localhost:8001/api"  # fallback
        
        self.demo_user_id = "03f82986-51af-460c-a549-1c5077e67fb0"
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

    def test_orchestrator_live_activity_stream(self) -> bool:
        """Test GET /api/orchestrator/live-activity-stream/{user_id}"""
        try:
            response = requests.get(f"{self.base_url}/orchestrator/live-activity-stream/{self.demo_user_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("status") == "success" and 
                    "activity_stream" in data and 
                    "count" in data and
                    isinstance(data["activity_stream"], list)):
                    
                    activity_stream = data["activity_stream"]
                    count = data["count"]
                    
                    self.log_test("Orchestrator Live Activity Stream", True, 
                                f"Activity stream retrieved successfully. Count: {count}, Items: {len(activity_stream)}")
                    return True
                else:
                    self.log_test("Orchestrator Live Activity Stream", False, f"Invalid response structure: {data}")
                    return False
            else:
                self.log_test("Orchestrator Live Activity Stream", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Orchestrator Live Activity Stream", False, f"Exception: {str(e)}")
            return False

    def test_orchestrator_agent_runs(self) -> bool:
        """Test GET /api/orchestrator/agent-runs/{user_id}"""
        try:
            response = requests.get(f"{self.base_url}/orchestrator/agent-runs/{self.demo_user_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("status") == "success" and 
                    "agent_runs" in data and 
                    "count" in data and
                    isinstance(data["agent_runs"], list)):
                    
                    agent_runs = data["agent_runs"]
                    count = data["count"]
                    
                    self.log_test("Orchestrator Agent Runs", True, 
                                f"Agent runs retrieved successfully. Count: {count}, Runs: {len(agent_runs)}")
                    return True
                else:
                    self.log_test("Orchestrator Agent Runs", False, f"Invalid response structure: {data}")
                    return False
            else:
                self.log_test("Orchestrator Agent Runs", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Orchestrator Agent Runs", False, f"Exception: {str(e)}")
            return False

    def test_orchestrator_agent_tasks(self) -> bool:
        """Test GET /api/orchestrator/agent-tasks/{user_id}"""
        try:
            response = requests.get(f"{self.base_url}/orchestrator/agent-tasks/{self.demo_user_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("status") == "success" and 
                    "agent_tasks" in data and 
                    "count" in data and
                    isinstance(data["agent_tasks"], list)):
                    
                    agent_tasks = data["agent_tasks"]
                    count = data["count"]
                    
                    self.log_test("Orchestrator Agent Tasks", True, 
                                f"Agent tasks retrieved successfully. Count: {count}, Tasks: {len(agent_tasks)}")
                    return True
                else:
                    self.log_test("Orchestrator Agent Tasks", False, f"Invalid response structure: {data}")
                    return False
            else:
                self.log_test("Orchestrator Agent Tasks", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Orchestrator Agent Tasks", False, f"Exception: {str(e)}")
            return False

    def test_orchestrator_execute_agent_nurturing(self) -> bool:
        """Test POST /api/orchestrator/execute-agent with NurturingAI"""
        try:
            # First, create a test lead for nurturing
            timestamp = int(time.time()) + 300
            lead_payload = {
                "user_id": self.demo_user_id,
                "first_name": "Orchestrator",
                "last_name": "TestLead",
                "email": f"orchestrator.test.{timestamp}@example.com",
                "phone": "+14155558888",
                "property_type": "Single Family Home",
                "neighborhood": "Test Neighborhood",
                "pipeline": "warm / nurturing",
                "priority": "high"
            }
            lead_response = requests.post(f"{self.base_url}/leads", json=lead_payload, timeout=10)
            
            if lead_response.status_code != 200:
                self.log_test("Orchestrator Execute Agent Nurturing", False, f"Failed to create test lead: {lead_response.text}")
                return False
            
            lead_data = lead_response.json()
            lead_id = lead_data.get("id")
            
            if not lead_id:
                self.log_test("Orchestrator Execute Agent Nurturing", False, f"No lead ID in response: {lead_data}")
                return False
            
            # Now execute NurturingAI agent
            execute_params = {
                "agent_code": "NurturingAI",
                "lead_id": lead_id,
                "user_id": self.demo_user_id
            }
            response = requests.post(f"{self.base_url}/orchestrator/execute-agent", params=execute_params, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("agent_code") == "NurturingAI" and 
                    data.get("lead_id") == lead_id and
                    "run" in data and
                    "lead_updates" in data):
                    
                    run_data = data["run"]
                    if (run_data.get("status") in ["succeeded", "running"] and
                        "events" in run_data and
                        "tasks" in run_data):
                        
                        self.log_test("Orchestrator Execute Agent Nurturing", True, 
                                    f"NurturingAI executed successfully. Status: {run_data['status']}, Events: {len(run_data['events'])}, Tasks: {len(run_data['tasks'])}")
                        return True
                    else:
                        self.log_test("Orchestrator Execute Agent Nurturing", False, f"Invalid run data structure: {run_data}")
                        return False
                else:
                    self.log_test("Orchestrator Execute Agent Nurturing", False, f"Invalid execute response structure: {data}")
                    return False
            else:
                self.log_test("Orchestrator Execute Agent Nurturing", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Orchestrator Execute Agent Nurturing", False, f"Exception: {str(e)}")
            return False

    def run_tests(self):
        """Run all orchestrator tests"""
        print("🚀 Testing Main Orchestrator AI Live Activity Stream System")
        print(f"📍 Base URL: {self.base_url}")
        print(f"👤 Demo User ID: {self.demo_user_id}")
        print("=" * 60)
        
        tests = [
            self.test_orchestrator_live_activity_stream,
            self.test_orchestrator_agent_runs,
            self.test_orchestrator_agent_tasks,
            self.test_orchestrator_execute_agent_nurturing,
        ]
        
        for test in tests:
            test()
        
        print("=" * 60)
        print(f"📊 Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All orchestrator tests PASSED!")
            return True
        else:
            print("⚠️  Some orchestrator tests FAILED!")
            return False

if __name__ == "__main__":
    tester = OrchestratorTester()
    success = tester.run_tests()
    sys.exit(0 if success else 1)