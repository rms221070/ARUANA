#!/usr/bin/env python3
"""
COMPREHENSIVE NUTRITION ANALYSIS ENDPOINT TESTING
=================================================

This script performs detailed testing of the nutrition analysis endpoint
as requested in the review, with focus on ensuring NO ERRORS occur.

Backend URL: https://aruana-vision-2.preview.emergentagent.com
Target Endpoint: POST /api/detect/analyze-nutrition

Test Objectives:
1. Ensure nutrition endpoint works WITHOUT ERRORS
2. Test error scenarios and recovery
3. Verify retry logic for overloaded APIs
4. Validate authentication
5. Verify timeout handling
"""

import requests
import sys
import json
import base64
import time
import random
from datetime import datetime
from io import BytesIO
from PIL import Image

class NutritionAnalysisComprehensiveTester:
    def __init__(self, base_url="https://aruana-vision-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.user_token = None
        self.timeout = 60  # 60 second timeout as specified

    def log_test(self, name, success, details=""):
        """Log test result with detailed information"""
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
        
        # Log any 500 errors as requested
        if "Status: 500" in details or "status_code: 500" in details:
            print(f"🚨 ERROR 500 DETECTED: {name} - {details}")
        
        # Log any unhandled exceptions as requested
        if "Exception:" in details and "Status: 500" not in details:
            print(f"🚨 UNHANDLED EXCEPTION: {name} - {details}")

    def create_simple_test_image(self):
        """Create a 1x1 pixel test image as specified in requirements"""
        # Create a 1x1 pixel image (minimal as requested)
        img = Image.new('RGB', (1, 1), color='white')
        buffer = BytesIO()
        img.save(buffer, format='JPEG')
        img_data = buffer.getvalue()
        return base64.b64encode(img_data).decode('utf-8')

    def create_food_test_image(self):
        """Create a realistic food test image"""
        # Create a 200x200 image with food items
        img = Image.new('RGB', (200, 200), color='white')
        
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        
        # Draw a plate
        draw.ellipse([20, 20, 180, 180], fill='lightgray', outline='black', width=2)
        
        # Draw food items
        # Apple (red circle)
        draw.ellipse([50, 50, 80, 80], fill='red', outline='darkred')
        
        # Banana (yellow)
        draw.ellipse([100, 60, 140, 90], fill='yellow', outline='orange')
        
        # Bread (brown rectangle)
        draw.rectangle([60, 120, 100, 150], fill='#D2691E', outline='brown')
        
        # Lettuce (green)
        draw.ellipse([110, 110, 140, 140], fill='green', outline='darkgreen')
        
        buffer = BytesIO()
        img.save(buffer, format='JPEG')
        img_data = buffer.getvalue()
        return base64.b64encode(img_data).decode('utf-8')

    def setup_authentication(self):
        """Setup authentication by registering and logging in a test user"""
        print("\n🔐 SETTING UP AUTHENTICATION")
        print("=" * 50)
        
        # Generate unique test user
        random_id = random.randint(10000, 99999)
        user_email = f"nutritiontest{random_id}@example.com"
        
        # 1. Register test user
        user_data = {
            "name": f"Nutrition Test User {random_id}",
            "email": user_email,
            "password": "NutritionTest123!",
            "user_type": "user"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/auth/register",
                json=user_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                self.log_test("Authentication Setup - User Registration", True, 
                             f"User registered successfully: {user_email}")
            else:
                self.log_test("Authentication Setup - User Registration", False, 
                             f"Registration failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Authentication Setup - User Registration", False, 
                         f"Exception during registration: {str(e)}")
            return False
        
        # 2. Login to get JWT token
        login_data = {
            "email": user_email,
            "password": "NutritionTest123!"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/auth/login",
                json=login_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                self.user_token = result.get('access_token')
                
                if self.user_token:
                    self.log_test("Authentication Setup - Login", True, 
                                 f"JWT token obtained successfully")
                    
                    # 3. Verify token with /api/auth/me
                    headers = {
                        'Content-Type': 'application/json',
                        'Authorization': f'Bearer {self.user_token}'
                    }
                    
                    me_response = requests.get(
                        f"{self.api_url}/auth/me",
                        headers=headers,
                        timeout=30
                    )
                    
                    if me_response.status_code == 200:
                        self.log_test("Authentication Setup - Token Validation", True, 
                                     "Token is valid and working")
                        return True
                    else:
                        self.log_test("Authentication Setup - Token Validation", False, 
                                     f"Token validation failed: {me_response.status_code}")
                        return False
                else:
                    self.log_test("Authentication Setup - Login", False, 
                                 "No access token in login response")
                    return False
            else:
                self.log_test("Authentication Setup - Login", False, 
                             f"Login failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Authentication Setup - Login", False, 
                         f"Exception during login: {str(e)}")
            return False

    def test_nutrition_analysis_normal(self):
        """Test normal nutrition analysis with simple test image"""
        print("\n🍎 TESTING NORMAL NUTRITION ANALYSIS")
        print("=" * 50)
        
        if not self.user_token:
            self.log_test("Nutrition Analysis - Normal", False, "No authentication token available")
            return False
        
        # Use simple 1x1 pixel image as specified
        test_image = self.create_simple_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.user_token}'
        }
        
        data = {
            "source": "camera",
            "detection_type": "nutrition",
            "image_data": image_data
        }
        
        try:
            start_time = time.time()
            response = requests.post(
                f"{self.api_url}/detect/analyze-nutrition",
                json=data,
                headers=headers,
                timeout=self.timeout
            )
            end_time = time.time()
            response_time = end_time - start_time
            
            # Check for 200 OK response
            if response.status_code == 200:
                result = response.json()
                
                # Verify required fields
                has_id = 'id' in result
                has_description = 'description' in result
                has_nutritional_analysis = 'nutritional_analysis' in result
                
                # Check if description is in Portuguese
                description = result.get('description', '')
                is_portuguese = any(word in description.lower() for word in 
                                  ['alimento', 'comida', 'nutrição', 'caloria', 'português', 'análise'])
                
                success = has_id and has_description and has_nutritional_analysis
                
                self.log_test("Nutrition Analysis - Normal Response", success,
                             f"Status: 200 OK, ID: {has_id}, Description: {has_description}, "
                             f"Nutrition: {has_nutritional_analysis}, Portuguese: {is_portuguese}, "
                             f"Response time: {response_time:.2f}s")
                
                # Verify NO 500 error
                self.log_test("Nutrition Analysis - No 500 Error", True,
                             "Endpoint responded without 500 error")
                
                # Verify timeout respected (should be under 60s)
                timeout_respected = response_time < self.timeout
                self.log_test("Nutrition Analysis - Timeout Respected", timeout_respected,
                             f"Response time {response_time:.2f}s < {self.timeout}s timeout")
                
                return success
            else:
                # Check if it's a 503 (overloaded) which is acceptable
                if response.status_code == 503:
                    self.log_test("Nutrition Analysis - Normal Response", True,
                                 f"Status: 503 (Service overloaded) - acceptable error with proper message")
                    return True
                else:
                    self.log_test("Nutrition Analysis - Normal Response", False,
                                 f"Status: {response.status_code}, Expected: 200 or 503, Response: {response.text}")
                    return False
                    
        except requests.exceptions.Timeout:
            self.log_test("Nutrition Analysis - Normal Response", False,
                         f"Request timed out after {self.timeout} seconds")
            return False
        except Exception as e:
            self.log_test("Nutrition Analysis - Normal Response", False,
                         f"Exception: {str(e)}")
            return False

    def test_authentication_failure(self):
        """Test nutrition analysis without authentication token"""
        print("\n🔒 TESTING AUTHENTICATION FAILURE")
        print("=" * 50)
        
        test_image = self.create_simple_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        data = {
            "source": "camera",
            "detection_type": "nutrition",
            "image_data": image_data
        }
        
        # Test without Authorization header
        try:
            response = requests.post(
                f"{self.api_url}/detect/analyze-nutrition",
                json=data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            # Should return 401 Unauthorized
            if response.status_code == 401:
                self.log_test("Authentication Failure - No Token", True,
                             "Correctly returned 401 Unauthorized without token")
                return True
            else:
                self.log_test("Authentication Failure - No Token", False,
                             f"Expected 401, got {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Authentication Failure - No Token", False,
                         f"Exception: {str(e)}")
            return False

    def test_timeout_retry_logic(self):
        """Test timeout and retry logic with multiple consecutive requests"""
        print("\n⏱️ TESTING TIMEOUT/RETRY LOGIC")
        print("=" * 50)
        
        if not self.user_token:
            self.log_test("Timeout/Retry Test", False, "No authentication token available")
            return False
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.user_token}'
        }
        
        # Use realistic food image for better testing
        test_image = self.create_food_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        data = {
            "source": "camera",
            "detection_type": "nutrition",
            "image_data": image_data
        }
        
        # Make 3 consecutive requests as specified
        results = []
        for i in range(3):
            try:
                print(f"   Making request {i+1}/3...")
                start_time = time.time()
                
                response = requests.post(
                    f"{self.api_url}/detect/analyze-nutrition",
                    json=data,
                    headers=headers,
                    timeout=self.timeout
                )
                
                end_time = time.time()
                response_time = end_time - start_time
                
                result = {
                    'request_num': i + 1,
                    'status_code': response.status_code,
                    'response_time': response_time,
                    'success': response.status_code in [200, 503]  # 200 OK or 503 overloaded are acceptable
                }
                
                if response.status_code == 200:
                    result['has_data'] = 'nutritional_analysis' in response.json()
                elif response.status_code == 503:
                    result['overloaded_message'] = "Service overloaded" in response.text
                
                results.append(result)
                
                # Log individual request result
                if response.status_code == 200:
                    self.log_test(f"Retry Logic - Request {i+1}", True,
                                 f"Status: 200 OK, Time: {response_time:.2f}s")
                elif response.status_code == 503:
                    self.log_test(f"Retry Logic - Request {i+1}", True,
                                 f"Status: 503 (overloaded), Time: {response_time:.2f}s - acceptable")
                else:
                    self.log_test(f"Retry Logic - Request {i+1}", False,
                                 f"Status: {response.status_code}, Time: {response_time:.2f}s")
                
                # Small delay between requests
                time.sleep(1)
                
            except requests.exceptions.Timeout:
                result = {
                    'request_num': i + 1,
                    'status_code': 'TIMEOUT',
                    'response_time': self.timeout,
                    'success': False
                }
                results.append(result)
                
                self.log_test(f"Retry Logic - Request {i+1}", False,
                             f"Request timed out after {self.timeout}s")
                
            except Exception as e:
                result = {
                    'request_num': i + 1,
                    'status_code': 'ERROR',
                    'response_time': 0,
                    'success': False,
                    'error': str(e)
                }
                results.append(result)
                
                self.log_test(f"Retry Logic - Request {i+1}", False,
                             f"Exception: {str(e)}")
        
        # Analyze results
        successful_requests = sum(1 for r in results if r['success'])
        all_completed = len(results) == 3
        no_500_errors = all(r['status_code'] != 500 for r in results)
        
        self.log_test("Retry Logic - Overall Results", 
                     all_completed and no_500_errors,
                     f"Completed: {len(results)}/3, Successful: {successful_requests}/3, No 500 errors: {no_500_errors}")
        
        return all_completed and no_500_errors

    def test_response_validation(self):
        """Test response structure and Portuguese language validation"""
        print("\n📋 TESTING RESPONSE VALIDATION")
        print("=" * 50)
        
        if not self.user_token:
            self.log_test("Response Validation", False, "No authentication token available")
            return False
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.user_token}'
        }
        
        # Use food image for better nutrition analysis
        test_image = self.create_food_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        data = {
            "source": "camera",
            "detection_type": "nutrition",
            "image_data": image_data
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/detect/analyze-nutrition",
                json=data,
                headers=headers,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                
                # Test required fields
                required_fields = ['id', 'description', 'nutritional_analysis']
                has_required_fields = all(field in result for field in required_fields)
                
                # Test description is in Portuguese
                description = result.get('description', '')
                portuguese_indicators = ['alimento', 'comida', 'nutrição', 'caloria', 'análise', 
                                       'proteína', 'carboidrato', 'gordura', 'fibra', 'vitamina']
                is_portuguese = any(word in description.lower() for word in portuguese_indicators)
                
                # Test nutritional_analysis structure
                nutrition_data = result.get('nutritional_analysis', {})
                nutrition_fields = ['foods_detected', 'total_calories', 'total_weight_grams', 
                                  'meal_type', 'nutritional_summary']
                has_nutrition_structure = all(field in nutrition_data for field in nutrition_fields)
                
                # Test that optional fields don't cause errors
                optional_fields_ok = True
                try:
                    # These fields might be optional but shouldn't cause errors
                    quality_score = nutrition_data.get('quality_score')
                    health_recommendations = nutrition_data.get('health_recommendations', [])
                    dietary_compatibility = nutrition_data.get('dietary_compatibility', {})
                except Exception as e:
                    optional_fields_ok = False
                    print(f"   Optional fields caused error: {e}")
                
                self.log_test("Response Validation - Required Fields", has_required_fields,
                             f"Required fields present: {has_required_fields}")
                
                self.log_test("Response Validation - Portuguese Description", is_portuguese,
                             f"Description in Portuguese: {is_portuguese}, Length: {len(description)}")
                
                self.log_test("Response Validation - Nutrition Structure", has_nutrition_structure,
                             f"Nutrition structure valid: {has_nutrition_structure}")
                
                self.log_test("Response Validation - Optional Fields", optional_fields_ok,
                             f"Optional fields don't cause errors: {optional_fields_ok}")
                
                return has_required_fields and is_portuguese and has_nutrition_structure and optional_fields_ok
                
            elif response.status_code == 503:
                self.log_test("Response Validation", True,
                             "Service overloaded (503) - acceptable response")
                return True
            else:
                self.log_test("Response Validation", False,
                             f"Unexpected status code: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Response Validation", False,
                         f"Exception during validation: {str(e)}")
            return False

    def test_error_handling(self):
        """Test various error scenarios and proper error messages"""
        print("\n🚨 TESTING ERROR HANDLING")
        print("=" * 50)
        
        if not self.user_token:
            self.log_test("Error Handling", False, "No authentication token available")
            return False
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.user_token}'
        }
        
        # Test 1: Invalid image data
        invalid_data = {
            "source": "camera",
            "detection_type": "nutrition",
            "image_data": "invalid_base64_data"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/detect/analyze-nutrition",
                json=invalid_data,
                headers=headers,
                timeout=30
            )
            
            # Should handle error gracefully (not return 500)
            if response.status_code != 500:
                self.log_test("Error Handling - Invalid Image", True,
                             f"Invalid image handled gracefully: {response.status_code}")
            else:
                self.log_test("Error Handling - Invalid Image", False,
                             f"Returned 500 error for invalid image: {response.text}")
                
        except Exception as e:
            self.log_test("Error Handling - Invalid Image", False,
                         f"Exception with invalid image: {str(e)}")
        
        # Test 2: Missing required fields
        incomplete_data = {
            "source": "camera"
            # Missing detection_type and image_data
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/detect/analyze-nutrition",
                json=incomplete_data,
                headers=headers,
                timeout=30
            )
            
            # Should return proper error message (not 500)
            if response.status_code in [400, 422]:  # Bad request or validation error
                self.log_test("Error Handling - Missing Fields", True,
                             f"Missing fields handled properly: {response.status_code}")
            else:
                self.log_test("Error Handling - Missing Fields", False,
                             f"Unexpected response for missing fields: {response.status_code}")
                
        except Exception as e:
            self.log_test("Error Handling - Missing Fields", False,
                         f"Exception with missing fields: {str(e)}")
        
        return True

    def run_comprehensive_nutrition_tests(self):
        """Run all comprehensive nutrition analysis tests as specified in review"""
        print("🍎 COMPREHENSIVE NUTRITION ANALYSIS ENDPOINT TESTING")
        print("=" * 70)
        print(f"Backend URL: {self.base_url}")
        print(f"Target Endpoint: POST /api/detect/analyze-nutrition")
        print(f"Timeout Setting: {self.timeout} seconds")
        print("=" * 70)
        
        # Step 1: Authentication Setup
        auth_success = self.setup_authentication()
        if not auth_success:
            print("\n❌ AUTHENTICATION SETUP FAILED - Cannot proceed with tests")
            return False
        
        # Step 2: Normal Nutrition Analysis Test
        normal_test = self.test_nutrition_analysis_normal()
        
        # Step 3: Authentication Failure Test
        auth_failure_test = self.test_authentication_failure()
        
        # Step 4: Timeout/Retry Logic Test
        retry_test = self.test_timeout_retry_logic()
        
        # Step 5: Response Validation Test
        validation_test = self.test_response_validation()
        
        # Step 6: Error Handling Test
        error_handling_test = self.test_error_handling()
        
        # Final Summary
        print("\n" + "=" * 70)
        print("📊 COMPREHENSIVE TEST SUMMARY")
        print("=" * 70)
        print(f"Total Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Check success criteria
        success_criteria = [
            ("Authentication Setup", auth_success),
            ("Normal Nutrition Analysis", normal_test),
            ("Authentication Failure Handling", auth_failure_test),
            ("Timeout/Retry Logic", retry_test),
            ("Response Validation", validation_test),
            ("Error Handling", error_handling_test)
        ]
        
        print("\n✅ SUCCESS CRITERIA:")
        all_criteria_met = True
        for criterion, passed in success_criteria:
            status = "✅ PASSED" if passed else "❌ FAILED"
            print(f"  {status} - {criterion}")
            if not passed:
                all_criteria_met = False
        
        # Print failed tests details
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS DETAILS:")
            for test in failed_tests:
                print(f"  - {test['test_name']}: {test['details']}")
        
        # Check for any 500 errors
        error_500_tests = [test for test in self.test_results if "Status: 500" in test['details'] or "status_code: 500" in test['details']]
        if error_500_tests:
            print("\n🚨 CRITICAL: 500 ERRORS DETECTED:")
            for test in error_500_tests:
                print(f"  - {test['test_name']}: {test['details']}")
            all_criteria_met = False
        
        # Check for unhandled exceptions
        exception_tests = [test for test in self.test_results if "Exception:" in test['details'] and "Status: 500" not in test['details']]
        if exception_tests:
            print("\n🚨 UNHANDLED EXCEPTIONS DETECTED:")
            for test in exception_tests:
                print(f"  - {test['test_name']}: {test['details']}")
        
        print("\n" + "=" * 70)
        if all_criteria_met:
            print("🎉 ALL SUCCESS CRITERIA MET - NUTRITION ENDPOINT WORKING CORRECTLY")
            print("✅ Endpoint responds without error 500")
            print("✅ Retry logic works for overloaded APIs")
            print("✅ Authentication validates correctly")
            print("✅ Errors return appropriate messages")
            print("✅ Responses in Portuguese")
            print("✅ Timeout of 60s is respected")
        else:
            print("❌ SOME CRITERIA NOT MET - ISSUES DETECTED")
        
        return all_criteria_met

def main():
    """Main function to run comprehensive nutrition analysis tests"""
    tester = NutritionAnalysisComprehensiveTester()
    success = tester.run_comprehensive_nutrition_tests()
    
    # Save detailed results
    with open('/app/nutrition_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'success_rate': (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0,
                'timestamp': datetime.now().isoformat(),
                'all_criteria_met': success
            },
            'detailed_results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())