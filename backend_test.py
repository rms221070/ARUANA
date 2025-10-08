import requests
import sys
import json
import base64
from datetime import datetime
from io import BytesIO
from PIL import Image

class DetectionSystemTester:
    def __init__(self, base_url="https://object-spotter-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test_name": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {name}")
        if details:
            print(f"   Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            if not success:
                try:
                    error_detail = response.json() if response.content else "No response content"
                    details += f", Response: {error_detail}"
                except:
                    details += f", Response: {response.text[:200]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.content else {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def create_test_image(self):
        """Create a simple test image as base64"""
        # Create a simple 100x100 red square
        img = Image.new('RGB', (100, 100), color='red')
        buffer = BytesIO()
        img.save(buffer, format='JPEG')
        img_data = buffer.getvalue()
        return base64.b64encode(img_data).decode('utf-8')

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_alerts_crud(self):
        """Test alerts CRUD operations"""
        # Create alert
        success, alert_data = self.run_test(
            "Create Alert",
            "POST",
            "alerts",
            200,
            data={"object_name": "test_person", "enabled": True}
        )
        
        if not success:
            return False
        
        alert_id = alert_data.get('id')
        if not alert_id:
            self.log_test("Create Alert - Get ID", False, "No alert ID returned")
            return False

        # Get alerts
        success, alerts = self.run_test("Get Alerts", "GET", "alerts", 200)
        if success:
            found_alert = any(alert['id'] == alert_id for alert in alerts)
            self.log_test("Find Created Alert", found_alert, f"Alert ID: {alert_id}")

        # Toggle alert
        success, _ = self.run_test(
            "Toggle Alert",
            "PATCH",
            f"alerts/{alert_id}?enabled=false",
            200
        )

        # Delete alert
        success, _ = self.run_test("Delete Alert", "DELETE", f"alerts/{alert_id}", 200)
        
        return True

    def test_detections_api(self):
        """Test detections API"""
        # Get detections (should work even if empty)
        success, detections = self.run_test("Get Detections", "GET", "detections?limit=10", 200)
        return success

    def test_analyze_frame(self):
        """Test frame analysis with mock image"""
        test_image = self.create_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        # Test cloud detection
        success, result = self.run_test(
            "Analyze Frame - Cloud",
            "POST",
            "detect/analyze-frame",
            200,
            data={
                "source": "upload",
                "detection_type": "cloud",
                "image_data": image_data
            }
        )
        
        if success:
            # Check if result has expected fields
            has_id = 'id' in result
            has_description = 'description' in result
            has_timestamp = 'timestamp' in result
            
            self.log_test("Frame Analysis - Response Structure", 
                         has_id and has_description and has_timestamp,
                         f"ID: {has_id}, Description: {has_description}, Timestamp: {has_timestamp}")

        # Test local detection (might not work without TensorFlow setup)
        success_local, _ = self.run_test(
            "Analyze Frame - Local",
            "POST",
            "detect/analyze-frame",
            200,
            data={
                "source": "webcam",
                "detection_type": "local",
                "image_data": image_data
            }
        )

        return success or success_local

    def test_export_reports(self):
        """Test report export functionality"""
        # Test JSON export
        success_json, _ = self.run_test("Export Report - JSON", "GET", "reports/export?format=json", 200)
        
        # Test CSV export
        success_csv, _ = self.run_test("Export Report - CSV", "GET", "reports/export?format=csv", 200)
        
        return success_json and success_csv

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend API Tests for Detection System")
        print("=" * 60)
        
        # Test basic connectivity
        self.test_root_endpoint()
        
        # Test alerts functionality
        self.test_alerts_crud()
        
        # Test detections API
        self.test_detections_api()
        
        # Test frame analysis (core functionality)
        self.test_analyze_frame()
        
        # Test export functionality
        self.test_export_reports()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"  - {test['test_name']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = DetectionSystemTester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'success_rate': (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0,
                'timestamp': datetime.now().isoformat()
            },
            'detailed_results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())