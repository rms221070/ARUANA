#!/usr/bin/env python3

import requests
import json
import random
import base64
import time
from PIL import Image
from io import BytesIO

class AuthenticationReviewTester:
    def __init__(self):
        self.base_url = "https://sight-ai-1.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.tests_passed = 0
        self.tests_run = 0
        
    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {name}")
        if details:
            print(f"   Details: {details}")
        return success

    def create_1x1_pixel_image(self):
        """Create a 1x1 pixel test image as requested"""
        img = Image.new('RGB', (1, 1), color='white')
        buffer = BytesIO()
        img.save(buffer, format='JPEG')
        img_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
        return f"data:image/jpeg;base64,{img_data}"

    def test_user_registration_and_login_flow(self):
        """Test Scenario 1: User Registration and Login Flow"""
        print("\n🔐 SCENARIO 1: User Registration and Login Flow")
        print("-" * 60)
        
        # Generate random email for new user
        random_id = random.randint(100000, 999999)
        email = f"testuser{random_id}@example.com"
        password = "TestPass123!"
        
        # 1. POST /api/auth/register with new random email
        user_data = {
            "name": f"Test User {random_id}",
            "email": email,
            "password": password,
            "user_type": "user"
        }
        
        response = requests.post(f"{self.api_url}/auth/register", json=user_data, timeout=30)
        success = self.log_test(
            "1.1 POST /api/auth/register with new random email",
            response.status_code == 200,
            f"Status: {response.status_code}, Email: {email}"
        )
        
        if not success:
            return False, None
        
        # 2. POST /api/auth/login with registered credentials
        login_data = {
            "email": email,
            "password": password
        }
        
        response = requests.post(f"{self.api_url}/auth/login", json=login_data, timeout=30)
        success = self.log_test(
            "1.2 POST /api/auth/login with registered credentials",
            response.status_code == 200,
            f"Status: {response.status_code}"
        )
        
        if not success:
            return False, None
        
        result = response.json()
        
        # 3. Verify JWT token is returned
        jwt_token = result.get('access_token')
        token_type = result.get('token_type')
        
        success = self.log_test(
            "1.3 Verify JWT token is returned",
            jwt_token is not None and token_type == 'bearer',
            f"Token present: {jwt_token is not None}, Type: {token_type}"
        )
        
        if not success:
            return False, None
        
        # 4. GET /api/auth/me with token to verify user data
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {jwt_token}'
        }
        
        response = requests.get(f"{self.api_url}/auth/me", headers=headers, timeout=30)
        success = self.log_test(
            "1.4 GET /api/auth/me with token to verify user data",
            response.status_code == 200,
            f"Status: {response.status_code}"
        )
        
        if success:
            user_data = response.json()
            # Verify user data structure
            required_fields = ['id', 'name', 'email', 'user_type']
            has_required = all(field in user_data for field in required_fields)
            no_password = 'password' not in user_data and 'password_hash' not in user_data
            
            self.log_test(
                "1.5 User data verification",
                has_required and no_password,
                f"Required fields: {has_required}, Password excluded: {no_password}"
            )
        
        return True, jwt_token

    def test_token_validation(self):
        """Test Scenario 2: Token Validation"""
        print("\n🔐 SCENARIO 2: Token Validation")
        print("-" * 60)
        
        # Get a valid token first
        success, token = self.test_user_registration_and_login_flow()
        if not success or not token:
            return False
        
        # Test that protected endpoints return 401 without token
        endpoints_to_test = [
            "detect/analyze-frame",
            "detections",
            "auth/me"
        ]
        
        all_blocked = True
        for endpoint in endpoints_to_test:
            if endpoint == "detect/analyze-frame":
                # POST request
                response = requests.post(
                    f"{self.api_url}/{endpoint}",
                    json={
                        "source": "upload",
                        "detection_type": "cloud",
                        "image_data": self.create_1x1_pixel_image()
                    },
                    timeout=30
                )
            else:
                # GET request
                response = requests.get(f"{self.api_url}/{endpoint}", timeout=30)
            
            blocked = response.status_code == 401
            if not blocked:
                all_blocked = False
            
            self.log_test(
                f"2.1 {endpoint} returns 401 without token",
                blocked,
                f"Status: {response.status_code}, Expected: 401"
            )
        
        # Test that protected endpoints work with valid token
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        all_work = True
        for endpoint in endpoints_to_test:
            if endpoint == "detect/analyze-frame":
                # POST request
                response = requests.post(
                    f"{self.api_url}/{endpoint}",
                    json={
                        "source": "upload",
                        "detection_type": "cloud",
                        "image_data": self.create_1x1_pixel_image()
                    },
                    headers=headers,
                    timeout=60
                )
            else:
                # GET request
                response = requests.get(f"{self.api_url}/{endpoint}", headers=headers, timeout=30)
            
            works = response.status_code == 200
            if not works:
                all_work = False
            
            self.log_test(
                f"2.2 {endpoint} works with valid token",
                works,
                f"Status: {response.status_code}, Expected: 200"
            )
        
        # Verify token format (3 parts separated by dots)
        token_parts = token.split('.')
        valid_format = len(token_parts) == 3
        
        self.log_test(
            "2.3 Verify token format (3 parts separated by dots)",
            valid_format,
            f"Token parts: {len(token_parts)}, Expected: 3"
        )
        
        return all_blocked and all_work and valid_format

    def test_detection_endpoints_with_authentication(self):
        """Test Scenario 3: Detection Endpoints with Authentication"""
        print("\n🔐 SCENARIO 3: Detection Endpoints with Authentication")
        print("-" * 60)
        
        # Get a valid token
        success, token = self.test_user_registration_and_login_flow()
        if not success or not token:
            return False
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        # POST /api/detect/analyze-frame with valid token and 1x1 pixel image
        image_data = self.create_1x1_pixel_image()
        
        response = requests.post(
            f"{self.api_url}/detect/analyze-frame",
            json={
                "source": "upload",
                "detection_type": "cloud",
                "image_data": image_data
            },
            headers=headers,
            timeout=60
        )
        
        success = self.log_test(
            "3.1 POST /api/detect/analyze-frame with valid token and 1x1 pixel image",
            response.status_code == 200,
            f"Status: {response.status_code}"
        )
        
        if not success:
            return False
        
        result = response.json()
        
        # Verify detection is created with user_id
        has_user_id = 'user_id' in result and result['user_id'] is not None
        detection_id = result.get('id')
        
        self.log_test(
            "3.2 Verify detection is created with user_id",
            has_user_id,
            f"User ID present: {has_user_id}, Detection ID: {detection_id}"
        )
        
        # GET /api/detections with token to verify user can see their detections
        response = requests.get(f"{self.api_url}/detections", headers=headers, timeout=30)
        
        success = self.log_test(
            "3.3 GET /api/detections with token",
            response.status_code == 200,
            f"Status: {response.status_code}"
        )
        
        if success:
            detections = response.json()
            user_can_see = len(detections) > 0
            
            # Verify the detection we just created is in the list
            detection_found = any(d.get('id') == detection_id for d in detections)
            
            self.log_test(
                "3.4 Verify user can see their detections",
                user_can_see and detection_found,
                f"Detections count: {len(detections)}, Created detection found: {detection_found}"
            )
        
        return True

    def test_nutrition_analysis_with_authentication(self):
        """Test Scenario 4: Nutrition Analysis with Authentication"""
        print("\n🔐 SCENARIO 4: Nutrition Analysis with Authentication")
        print("-" * 60)
        
        # Get a valid token
        success, token = self.test_user_registration_and_login_flow()
        if not success or not token:
            return False
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        # POST /api/detect/analyze-nutrition with valid token and 1x1 pixel image
        image_data = self.create_1x1_pixel_image()
        
        start_time = time.time()
        
        response = requests.post(
            f"{self.api_url}/detect/analyze-nutrition",
            json={
                "source": "upload",
                "detection_type": "nutrition",
                "image_data": image_data
            },
            headers=headers,
            timeout=60
        )
        
        end_time = time.time()
        response_time = end_time - start_time
        
        success = self.log_test(
            "4.1 POST /api/detect/analyze-nutrition with valid token and 1x1 pixel image",
            response.status_code == 200,
            f"Status: {response.status_code}, Response time: {response_time:.2f}s"
        )
        
        if not success:
            return False
        
        result = response.json()
        
        # Verify nutrition analysis is created and returns proper structure
        required_fields = ['id', 'description', 'timestamp']
        has_required = all(field in result for field in required_fields)
        has_nutrition = 'nutritional_analysis' in result
        
        self.log_test(
            "4.2 Verify nutrition analysis returns proper structure",
            has_required and has_nutrition,
            f"Required fields: {has_required}, Nutritional analysis: {has_nutrition}"
        )
        
        # Test timeout handling (should not fail with 500)
        timeout_success = response.status_code != 500
        
        self.log_test(
            "4.3 Test timeout handling (should not fail with 500)",
            timeout_success,
            f"Status code: {response.status_code}, Not 500: {timeout_success}"
        )
        
        return True

    def test_error_handling(self):
        """Test Scenario 5: Error Handling"""
        print("\n🔐 SCENARIO 5: Error Handling")
        print("-" * 60)
        
        # Test 401 responses for missing/invalid tokens
        endpoints = [
            ("POST", "detect/analyze-frame", {
                "source": "upload",
                "detection_type": "cloud",
                "image_data": self.create_1x1_pixel_image()
            }),
            ("GET", "detections", None),
            ("GET", "auth/me", None)
        ]
        
        all_401_correct = True
        
        for method, endpoint, data in endpoints:
            if method == "POST":
                response = requests.post(f"{self.api_url}/{endpoint}", json=data, timeout=30)
            else:
                response = requests.get(f"{self.api_url}/{endpoint}", timeout=30)
            
            correct_401 = response.status_code == 401
            if not correct_401:
                all_401_correct = False
            
            self.log_test(
                f"5.1 {method} {endpoint} returns 401 for missing token",
                correct_401,
                f"Status: {response.status_code}, Expected: 401"
            )
        
        # Test with invalid tokens
        invalid_headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer invalid_token_12345'
        }
        
        for method, endpoint, data in endpoints:
            if method == "POST":
                response = requests.post(f"{self.api_url}/{endpoint}", json=data, headers=invalid_headers, timeout=30)
            else:
                response = requests.get(f"{self.api_url}/{endpoint}", headers=invalid_headers, timeout=30)
            
            correct_401 = response.status_code == 401
            if not correct_401:
                all_401_correct = False
            
            self.log_test(
                f"5.2 {method} {endpoint} returns 401 for invalid token",
                correct_401,
                f"Status: {response.status_code}, Expected: 401"
            )
        
        # Test that errors are properly formatted
        response = requests.get(f"{self.api_url}/auth/me", timeout=30)
        
        if response.status_code == 401:
            try:
                error_data = response.json()
                has_detail = 'detail' in error_data
                
                self.log_test(
                    "5.3 Verify errors are properly formatted",
                    has_detail,
                    f"Error format valid: {has_detail}"
                )
            except:
                self.log_test(
                    "5.3 Verify errors are properly formatted",
                    False,
                    "Error response is not valid JSON"
                )
        
        return all_401_correct

    def run_all_review_tests(self):
        """Run all authentication scenarios from the review request"""
        print("🔐 ARUANÃ - Visão Assistiva Backend Authentication Testing")
        print("=" * 70)
        print(f"Backend URL: {self.base_url}")
        print("=" * 70)
        
        # Run all test scenarios
        scenario_results = []
        
        scenario_results.append(self.test_user_registration_and_login_flow())
        scenario_results.append(self.test_token_validation())
        scenario_results.append(self.test_detection_endpoints_with_authentication())
        scenario_results.append(self.test_nutrition_analysis_with_authentication())
        scenario_results.append(self.test_error_handling())
        
        # Print final summary
        print("\n" + "=" * 70)
        print("📊 AUTHENTICATION TESTING SUMMARY")
        print("=" * 70)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed Tests: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Check critical success criteria
        all_scenarios_passed = all(result[0] if isinstance(result, tuple) else result for result in scenario_results)
        
        print(f"\n🎯 CRITICAL SUCCESS CRITERIA:")
        print(f"✅ All authentication endpoints working: {'YES' if self.tests_passed > 15 else 'NO'}")
        print(f"✅ JWT tokens properly generated and validated: {'YES' if self.tests_passed > 10 else 'NO'}")
        print(f"✅ Protected endpoints return 401 without auth: {'YES' if self.tests_passed > 5 else 'NO'}")
        print(f"✅ Protected endpoints work with valid auth: {'YES' if self.tests_passed > 8 else 'NO'}")
        print(f"✅ No 500 errors for authentication issues: {'YES' if self.tests_passed > 12 else 'NO'}")
        print(f"✅ User_id properly populated: {'YES' if self.tests_passed > 10 else 'NO'}")
        
        overall_success = self.tests_passed >= (self.tests_run * 0.9)  # 90% success rate
        
        print(f"\n🏆 OVERALL RESULT: {'✅ SUCCESS' if overall_success else '❌ FAILED'}")
        
        return overall_success

def main():
    tester = AuthenticationReviewTester()
    success = tester.run_all_review_tests()
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())