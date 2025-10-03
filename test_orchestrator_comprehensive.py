#!/usr/bin/env python3
"""
Comprehensive test of the Main Orchestrator AI Live Activity Stream system
Tests all MongoDB collections and logging features
"""

import requests
import sys
import json
import time
from datetime import datetime

class ComprehensiveOrchestratorTester:
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
        self.created_lead_ids = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED {details}")
        else:
            print(f"❌ {name}: FAILED {details}")

    def create_test_lead(self, name_suffix: str) -> str:
        """Create a test lead and return its ID"""
        timestamp = int(time.time()) + len(self.created_lead_ids)
        lead_payload = {
            "user_id": self.demo_user_id,
            "first_name": f"TestLead{name_suffix}",
            "last_name": "Orchestrator",
            "email": f"testlead{name_suffix}.{timestamp}@example.com",
            "phone": f"+1415555{1000 + len(self.created_lead_ids):04d}",
            "property_type": "Single Family Home",
            "neighborhood": "Test Neighborhood",
            "pipeline": "warm / nurturing",
            "priority": "high"
        }
        
        response = requests.post(f"{self.base_url}/leads", json=lead_payload, timeout=10)
        if response.status_code == 200:
            lead_data = response.json()
            lead_id = lead_data.get("id")
            if lead_id:
                self.created_lead_ids.append(lead_id)
                return lead_id
        return None

    def test_agent_run_creation_and_logging(self) -> bool:
        """Test that agent runs are created and logged properly"""
        try:
            # Create a test lead
            lead_id = self.create_test_lead("AgentRun")
            if not lead_id:
                self.log_test("Agent Run Creation", False, "Failed to create test lead")
                return False
            
            # Execute NurturingAI to create agent run
            execute_params = {
                "agent_code": "NurturingAI",
                "lead_id": lead_id,
                "user_id": self.demo_user_id
            }
            response = requests.post(f"{self.base_url}/orchestrator/execute-agent", params=execute_params, timeout=15)
            
            if response.status_code != 200:
                self.log_test("Agent Run Creation", False, f"Execute agent failed: {response.text}")
                return False
            
            # Wait a moment for data to be written
            time.sleep(2)
            
            # Check that agent runs were created
            runs_response = requests.get(f"{self.base_url}/orchestrator/agent-runs/{self.demo_user_id}", timeout=10)
            if runs_response.status_code != 200:
                self.log_test("Agent Run Creation", False, f"Failed to get agent runs: {runs_response.text}")
                return False
            
            runs_data = runs_response.json()
            agent_runs = runs_data.get("agent_runs", [])
            
            # Find our specific run
            our_run = None
            for run in agent_runs:
                if run.get("lead_id") == lead_id and run.get("agent_code") == "NurturingAI":
                    our_run = run
                    break
            
            if not our_run:
                self.log_test("Agent Run Creation", False, f"Could not find agent run for lead {lead_id}")
                return False
            
            # Verify run structure
            required_fields = ["id", "agent_code", "lead_id", "user_id", "status", "started_at", "correlation_id"]
            missing_fields = [field for field in required_fields if field not in our_run]
            
            if missing_fields:
                self.log_test("Agent Run Creation", False, f"Missing fields in agent run: {missing_fields}")
                return False
            
            if our_run["status"] != "succeeded":
                self.log_test("Agent Run Creation", False, f"Expected succeeded status, got: {our_run['status']}")
                return False
            
            self.log_test("Agent Run Creation", True, 
                        f"Agent run created successfully. ID: {our_run['id']}, Status: {our_run['status']}")
            return True
            
        except Exception as e:
            self.log_test("Agent Run Creation", False, f"Exception: {str(e)}")
            return False

    def test_agent_events_logging(self) -> bool:
        """Test that agent events are logged during execution"""
        try:
            # Create a test lead
            lead_id = self.create_test_lead("Events")
            if not lead_id:
                self.log_test("Agent Events Logging", False, "Failed to create test lead")
                return False
            
            # Execute NurturingAI to create events
            execute_params = {
                "agent_code": "NurturingAI",
                "lead_id": lead_id,
                "user_id": self.demo_user_id
            }
            response = requests.post(f"{self.base_url}/orchestrator/execute-agent", params=execute_params, timeout=15)
            
            if response.status_code != 200:
                self.log_test("Agent Events Logging", False, f"Execute agent failed: {response.text}")
                return False
            
            # Wait for data to be written
            time.sleep(2)
            
            # Get activity stream to see events
            stream_response = requests.get(f"{self.base_url}/orchestrator/live-activity-stream/{self.demo_user_id}", timeout=10)
            if stream_response.status_code != 200:
                self.log_test("Agent Events Logging", False, f"Failed to get activity stream: {stream_response.text}")
                return False
            
            stream_data = stream_response.json()
            activity_stream = stream_data.get("activity_stream", [])
            
            # Find our specific run
            our_activity = None
            for activity in activity_stream:
                if activity.get("lead_id") == lead_id and activity.get("agent_code") == "NurturingAI":
                    our_activity = activity
                    break
            
            if not our_activity:
                self.log_test("Agent Events Logging", False, f"Could not find activity for lead {lead_id}")
                return False
            
            # Check events
            events = our_activity.get("events", [])
            if len(events) == 0:
                self.log_test("Agent Events Logging", False, "No events found in activity")
                return False
            
            # Verify event structure
            first_event = events[0]
            required_event_fields = ["id", "run_id", "ts", "type", "payload"]
            missing_event_fields = [field for field in required_event_fields if field not in first_event]
            
            if missing_event_fields:
                self.log_test("Agent Events Logging", False, f"Missing fields in event: {missing_event_fields}")
                return False
            
            # Check for different event types
            event_types = [event.get("type") for event in events]
            expected_types = ["INFO"]  # At minimum we should have INFO events
            
            has_expected_types = any(etype in event_types for etype in expected_types)
            if not has_expected_types:
                self.log_test("Agent Events Logging", False, f"Expected event types {expected_types}, got: {event_types}")
                return False
            
            self.log_test("Agent Events Logging", True, 
                        f"Events logged successfully. Count: {len(events)}, Types: {set(event_types)}")
            return True
            
        except Exception as e:
            self.log_test("Agent Events Logging", False, f"Exception: {str(e)}")
            return False

    def test_agent_tasks_creation(self) -> bool:
        """Test that agent tasks are created for Activity Board"""
        try:
            # Create a test lead
            lead_id = self.create_test_lead("Tasks")
            if not lead_id:
                self.log_test("Agent Tasks Creation", False, "Failed to create test lead")
                return False
            
            # Execute NurturingAI to create tasks
            execute_params = {
                "agent_code": "NurturingAI",
                "lead_id": lead_id,
                "user_id": self.demo_user_id
            }
            response = requests.post(f"{self.base_url}/orchestrator/execute-agent", params=execute_params, timeout=15)
            
            if response.status_code != 200:
                self.log_test("Agent Tasks Creation", False, f"Execute agent failed: {response.text}")
                return False
            
            # Wait for data to be written
            time.sleep(2)
            
            # Get agent tasks
            tasks_response = requests.get(f"{self.base_url}/orchestrator/agent-tasks/{self.demo_user_id}", timeout=10)
            if tasks_response.status_code != 200:
                self.log_test("Agent Tasks Creation", False, f"Failed to get agent tasks: {tasks_response.text}")
                return False
            
            tasks_data = tasks_response.json()
            agent_tasks = tasks_data.get("agent_tasks", [])
            
            # Find tasks for our lead
            our_tasks = [task for task in agent_tasks if task.get("lead_id") == lead_id]
            
            if len(our_tasks) == 0:
                self.log_test("Agent Tasks Creation", False, f"No tasks found for lead {lead_id}")
                return False
            
            # Verify task structure
            first_task = our_tasks[0]
            required_task_fields = ["id", "run_id", "lead_id", "user_id", "agent_code", "due_at", "channel", "title", "status", "created_at", "lead_name"]
            missing_task_fields = [field for field in required_task_fields if field not in first_task]
            
            if missing_task_fields:
                self.log_test("Agent Tasks Creation", False, f"Missing fields in task: {missing_task_fields}")
                return False
            
            # Verify lead name is resolved
            if not first_task["lead_name"] or "TestLead" not in first_task["lead_name"]:
                self.log_test("Agent Tasks Creation", False, f"Lead name not properly resolved: {first_task['lead_name']}")
                return False
            
            # Check for different channels
            channels = [task.get("channel") for task in our_tasks]
            valid_channels = ["sms", "email", "call", "phone"]
            
            has_valid_channels = all(channel in valid_channels for channel in channels)
            if not has_valid_channels:
                self.log_test("Agent Tasks Creation", False, f"Invalid channels found: {channels}")
                return False
            
            # Check for draft content
            tasks_with_drafts = [task for task in our_tasks if task.get("draft")]
            
            self.log_test("Agent Tasks Creation", True, 
                        f"Tasks created successfully. Count: {len(our_tasks)}, Channels: {set(channels)}, With drafts: {len(tasks_with_drafts)}")
            return True
            
        except Exception as e:
            self.log_test("Agent Tasks Creation", False, f"Exception: {str(e)}")
            return False

    def test_live_activity_stream_integration(self) -> bool:
        """Test that live activity stream shows complete integration"""
        try:
            # Create a test lead
            lead_id = self.create_test_lead("LiveStream")
            if not lead_id:
                self.log_test("Live Activity Stream Integration", False, "Failed to create test lead")
                return False
            
            # Execute multiple agents to create rich activity
            agents_to_test = ["NurturingAI", "CustomerServiceAI"]
            
            for agent_code in agents_to_test:
                execute_params = {
                    "agent_code": agent_code,
                    "lead_id": lead_id,
                    "user_id": self.demo_user_id
                }
                response = requests.post(f"{self.base_url}/orchestrator/execute-agent", params=execute_params, timeout=15)
                
                if response.status_code != 200:
                    self.log_test("Live Activity Stream Integration", False, f"Execute {agent_code} failed: {response.text}")
                    return False
                
                time.sleep(1)  # Brief pause between executions
            
            # Wait for all data to be written
            time.sleep(3)
            
            # Get live activity stream
            stream_response = requests.get(f"{self.base_url}/orchestrator/live-activity-stream/{self.demo_user_id}?limit=20", timeout=10)
            if stream_response.status_code != 200:
                self.log_test("Live Activity Stream Integration", False, f"Failed to get activity stream: {stream_response.text}")
                return False
            
            stream_data = stream_response.json()
            activity_stream = stream_data.get("activity_stream", [])
            
            # Find activities for our lead
            our_activities = [activity for activity in activity_stream if activity.get("lead_id") == lead_id]
            
            if len(our_activities) < 2:
                self.log_test("Live Activity Stream Integration", False, f"Expected at least 2 activities, got {len(our_activities)}")
                return False
            
            # Verify we have different agent codes
            agent_codes = [activity.get("agent_code") for activity in our_activities]
            unique_agents = set(agent_codes)
            
            if len(unique_agents) < 2:
                self.log_test("Live Activity Stream Integration", False, f"Expected multiple agents, got: {unique_agents}")
                return False
            
            # Verify each activity has events and tasks
            total_events = 0
            total_tasks = 0
            
            for activity in our_activities:
                events = activity.get("events", [])
                tasks = activity.get("tasks", [])
                total_events += len(events)
                total_tasks += len(tasks)
                
                # Verify lead name is resolved
                if not activity.get("lead_name") or "TestLead" not in activity["lead_name"]:
                    self.log_test("Live Activity Stream Integration", False, f"Lead name not resolved in activity: {activity.get('lead_name')}")
                    return False
            
            self.log_test("Live Activity Stream Integration", True, 
                        f"Live stream integration working. Activities: {len(our_activities)}, Agents: {unique_agents}, Events: {total_events}, Tasks: {total_tasks}")
            return True
            
        except Exception as e:
            self.log_test("Live Activity Stream Integration", False, f"Exception: {str(e)}")
            return False

    def test_lead_updates_integration(self) -> bool:
        """Test that lead updates are properly integrated with orchestrator"""
        try:
            # Create a test lead
            lead_id = self.create_test_lead("LeadUpdates")
            if not lead_id:
                self.log_test("Lead Updates Integration", False, "Failed to create test lead")
                return False
            
            # Get initial lead data
            initial_response = requests.get(f"{self.base_url}/leads?user_id={self.demo_user_id}", timeout=10)
            if initial_response.status_code != 200:
                self.log_test("Lead Updates Integration", False, f"Failed to get initial leads: {initial_response.text}")
                return False
            
            initial_leads = initial_response.json()
            our_lead = None
            for lead in initial_leads:
                if lead.get("id") == lead_id:
                    our_lead = lead
                    break
            
            if not our_lead:
                self.log_test("Lead Updates Integration", False, f"Could not find created lead {lead_id}")
                return False
            
            # Execute NurturingAI which should update the lead
            execute_params = {
                "agent_code": "NurturingAI",
                "lead_id": lead_id,
                "user_id": self.demo_user_id
            }
            response = requests.post(f"{self.base_url}/orchestrator/execute-agent", params=execute_params, timeout=15)
            
            if response.status_code != 200:
                self.log_test("Lead Updates Integration", False, f"Execute agent failed: {response.text}")
                return False
            
            # Check the response for lead updates
            execution_data = response.json()
            lead_updates = execution_data.get("lead_updates", {})
            
            if not lead_updates:
                self.log_test("Lead Updates Integration", False, "No lead updates in execution response")
                return False
            
            # Verify lead updates structure
            if "engagement_score" not in lead_updates:
                self.log_test("Lead Updates Integration", False, f"Missing engagement_score in lead updates: {lead_updates}")
                return False
            
            self.log_test("Lead Updates Integration", True, 
                        f"Lead updates working correctly. Updates: {lead_updates}")
            return True
            
        except Exception as e:
            self.log_test("Lead Updates Integration", False, f"Exception: {str(e)}")
            return False

    def run_comprehensive_tests(self):
        """Run all comprehensive orchestrator tests"""
        print("🚀 Comprehensive Main Orchestrator AI Live Activity Stream System Testing")
        print(f"📍 Base URL: {self.base_url}")
        print(f"👤 Demo User ID: {self.demo_user_id}")
        print("=" * 80)
        
        tests = [
            self.test_agent_run_creation_and_logging,
            self.test_agent_events_logging,
            self.test_agent_tasks_creation,
            self.test_live_activity_stream_integration,
            self.test_lead_updates_integration,
        ]
        
        for test in tests:
            test()
        
        print("=" * 80)
        print(f"📊 Results: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"🔧 Created {len(self.created_lead_ids)} test leads")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All comprehensive orchestrator tests PASSED!")
            return True
        else:
            print("⚠️  Some comprehensive orchestrator tests FAILED!")
            return False

if __name__ == "__main__":
    tester = ComprehensiveOrchestratorTester()
    success = tester.run_comprehensive_tests()
    sys.exit(0 if success else 1)