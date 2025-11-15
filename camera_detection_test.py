#!/usr/bin/env python3
"""
Camera and Detection Flow Testing Script
Tests the complete camera and detection flow after fixing camera permission persistence issues.
Focuses on the actual supported detection endpoints and modes.
"""

import requests
import json
import base64
import time
from datetime import datetime
from io import BytesIO
from PIL import Image, ImageDraw

class CameraDetectionTester:
    def __init__(self):
        self.base_url = "https://sight-helper-8.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.auth_token = None

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

    def create_simple_test_image(self):
        """Create a simple test image (base64 encoded)"""
        # Create a 100x100 simple test image
        img = Image.new('RGB', (100, 100), color='lightblue')
        draw = ImageDraw.Draw(img)
        
        # Draw a simple face
        draw.ellipse([25, 25, 75, 75], fill='peachpuff', outline='black')
        draw.ellipse([35, 40, 45, 50], fill='black')  # Left eye
        draw.ellipse([55, 40, 65, 50], fill='black')  # Right eye
        draw.arc([40, 55, 60, 65], start=0, end=180, fill='red', width=2)  # Smile
        
        buffer = BytesIO()
        img.save(buffer, format='JPEG')
        img_data = buffer.getvalue()
        return base64.b64encode(img_data).decode('utf-8')

    def setup_authentication(self):
        """Setup authentication by registering and logging in a test user"""
        print("🔐 Setting up authentication...")
        
        import random
        random_id = random.randint(10000, 99999)
        
        # Register test user
        user_data = {
            "name": f"Camera Test User {random_id}",
            "email": f"cameratest{random_id}@example.com",
            "password": "CameraTest123!",
            "user_type": "user"
        }
        
        try:
            response = requests.post(f"{self.api_url}/auth/register", json=user_data, timeout=30)
            if response.status_code != 200:
                print(f"❌ Registration failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Registration error: {str(e)}")
            return False
        
        # Login to get token
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        
        try:
            response = requests.post(f"{self.api_url}/auth/login", json=login_data, timeout=30)
            if response.status_code == 200:
                result = response.json()
                self.auth_token = result.get('access_token')
                if self.auth_token:
                    print(f"✅ Authentication successful")
                    return True
            
            print(f"❌ Login failed: {response.status_code}")
            return False
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False

    def get_auth_headers(self):
        """Get authentication headers"""
        return {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.auth_token}'
        }

    def test_analyze_frame_cloud_detection(self):
        """Test POST /api/detect/analyze-frame with cloud detection (main supported mode)"""
        print("\n📸 Testing Analyze Frame - Cloud Detection...")
        
        test_image = self.create_simple_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        try:
            start_time = time.time()
            
            response = requests.post(
                f"{self.api_url}/detect/analyze-frame",
                json={
                    "source": "webcam",  # Simulating webcam source
                    "detection_type": "cloud",
                    "image_data": image_data
                },
                headers=self.get_auth_headers(),
                timeout=60
            )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            success = response.status_code == 200
            
            if success:
                result = response.json()
                
                # Verify response structure
                has_id = 'id' in result
                has_description = 'description' in result and len(result['description']) > 0
                has_timestamp = 'timestamp' in result
                has_objects_detected = 'objects_detected' in result
                
                # Check if description is in Portuguese
                description_text = result.get('description', '')
                portuguese_indicators = ['pessoa', 'imagem', 'análise', 'detalhes', 'características', 'rosto', 'face']
                has_portuguese = any(indicator in description_text.lower() for indicator in portuguese_indicators)
                
                # Check for no false error messages
                no_error_messages = 'error' not in description_text.lower() and 'erro' not in description_text.lower()
                
                structure_valid = has_id and has_description and has_timestamp and has_objects_detected
                
                self.log_test(
                    "Analyze Frame - Cloud Detection (Webcam)",
                    structure_valid and has_portuguese and no_error_messages,
                    f"Status: 200, Structure: {structure_valid}, Portuguese: {has_portuguese}, No Errors: {no_error_messages}, Time: {response_time:.2f}s"
                )
                
                # Test emotion analysis
                if 'emotion_analysis' in result and result['emotion_analysis']:
                    emotion_data = result['emotion_analysis']
                    required_emotions = ['sorrindo', 'serio', 'triste', 'surpreso', 'zangado', 'neutro']
                    emotion_valid = all(emotion in emotion_data and isinstance(emotion_data[emotion], int) for emotion in required_emotions)
                    
                    self.log_test(
                        "Emotion Analysis - Cloud Detection",
                        emotion_valid,
                        f"All emotion fields present and valid: {emotion_valid}"
                    )
                
                # Test sentiment analysis
                if 'sentiment_analysis' in result and result['sentiment_analysis']:
                    sentiment_data = result['sentiment_analysis']
                    required_sentiments = ['positivo', 'neutro', 'negativo']
                    sentiment_valid = all(sentiment in sentiment_data and isinstance(sentiment_data[sentiment], int) for sentiment in required_sentiments)
                    
                    self.log_test(
                        "Sentiment Analysis - Cloud Detection",
                        sentiment_valid,
                        f"All sentiment fields present and valid: {sentiment_valid}"
                    )
                
                return result
            
            else:
                error_detail = response.text[:200] if response.text else "No error details"
                self.log_test(
                    "Analyze Frame - Cloud Detection (Webcam)",
                    False,
                    f"Status: {response.status_code}, Error: {error_detail}"
                )
                return None
                
        except Exception as e:
            self.log_test(
                "Analyze Frame - Cloud Detection (Webcam)",
                False,
                f"Exception: {str(e)}"
            )
            return None

    def test_analyze_frame_upload_source(self):
        """Test POST /api/detect/analyze-frame with upload source"""
        print("\n📤 Testing Analyze Frame - Upload Source...")
        
        test_image = self.create_simple_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        try:
            start_time = time.time()
            
            response = requests.post(
                f"{self.api_url}/detect/analyze-frame",
                json={
                    "source": "upload",  # Upload source
                    "detection_type": "cloud",
                    "image_data": image_data
                },
                headers=self.get_auth_headers(),
                timeout=60
            )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            success = response.status_code == 200
            
            if success:
                result = response.json()
                
                # Verify response structure
                has_id = 'id' in result
                has_description = 'description' in result and len(result['description']) > 0
                has_timestamp = 'timestamp' in result
                
                # Check if description is in Portuguese
                description_text = result.get('description', '')
                portuguese_indicators = ['pessoa', 'imagem', 'análise', 'detalhes', 'características']
                has_portuguese = any(indicator in description_text.lower() for indicator in portuguese_indicators)
                
                structure_valid = has_id and has_description and has_timestamp
                
                self.log_test(
                    "Analyze Frame - Cloud Detection (Upload)",
                    structure_valid and has_portuguese,
                    f"Status: 200, Structure: {structure_valid}, Portuguese: {has_portuguese}, Time: {response_time:.2f}s"
                )
                
                return result
            
            else:
                error_detail = response.text[:200] if response.text else "No error details"
                self.log_test(
                    "Analyze Frame - Cloud Detection (Upload)",
                    False,
                    f"Status: {response.status_code}, Error: {error_detail}"
                )
                return None
                
        except Exception as e:
            self.log_test(
                "Analyze Frame - Cloud Detection (Upload)",
                False,
                f"Exception: {str(e)}"
            )
            return None

    def test_read_text_endpoints(self):
        """Test POST /api/detect/read-text endpoint for text reading modes"""
        print("\n📝 Testing Read Text Endpoints...")
        
        # Create a simple image with text
        img = Image.new('RGB', (200, 100), color='white')
        draw = ImageDraw.Draw(img)
        draw.text((10, 40), "Hello World", fill='black')
        
        buffer = BytesIO()
        img.save(buffer, format='JPEG')
        img_data = buffer.getvalue()
        test_image = base64.b64encode(img_data).decode('utf-8')
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        # Test text-short mode
        try:
            start_time = time.time()
            
            response = requests.post(
                f"{self.api_url}/detect/read-text",
                json={
                    "source": "upload",
                    "detection_type": "text_reading",
                    "image_data": image_data
                },
                headers=self.get_auth_headers(),
                timeout=60
            )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            success = response.status_code == 200
            
            if success:
                result = response.json()
                
                # Verify response structure
                has_id = 'id' in result
                has_description = 'description' in result and len(result['description']) > 0
                has_timestamp = 'timestamp' in result
                
                structure_valid = has_id and has_description and has_timestamp
                
                self.log_test(
                    "Read Text - Text Reading Mode",
                    structure_valid,
                    f"Status: 200, Structure: {structure_valid}, Time: {response_time:.2f}s"
                )
            
            else:
                error_detail = response.text[:200] if response.text else "No error details"
                self.log_test(
                    "Read Text - Text Reading Mode",
                    False,
                    f"Status: {response.status_code}, Error: {error_detail}"
                )
                
        except Exception as e:
            self.log_test(
                "Read Text - Text Reading Mode",
                False,
                f"Exception: {str(e)}"
            )

    def test_analyze_nutrition_endpoint(self):
        """Test POST /api/detect/analyze-nutrition endpoint for food mode"""
        print("\n🍎 Testing Analyze Nutrition Endpoint...")
        
        # Create a simple food image
        img = Image.new('RGB', (200, 200), color='white')
        draw = ImageDraw.Draw(img)
        
        # Draw a simple apple
        draw.ellipse([50, 50, 150, 150], fill='red', outline='darkred')
        draw.text((10, 10), "Apple", fill='black')
        
        buffer = BytesIO()
        img.save(buffer, format='JPEG')
        img_data = buffer.getvalue()
        test_image = base64.b64encode(img_data).decode('utf-8')
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        try:
            start_time = time.time()
            
            response = requests.post(
                f"{self.api_url}/detect/analyze-nutrition",
                json={
                    "source": "upload",
                    "detection_type": "nutrition",
                    "image_data": image_data
                },
                headers=self.get_auth_headers(),
                timeout=60
            )
            
            end_time = time.time()
            response_time = end_time - start_time
            
            success = response.status_code == 200
            
            if success:
                result = response.json()
                
                # Verify response structure
                has_id = 'id' in result
                has_description = 'description' in result and len(result['description']) > 0
                has_timestamp = 'timestamp' in result
                has_nutritional_analysis = 'nutritional_analysis' in result
                
                # Check if description is in Portuguese
                description_text = result.get('description', '')
                portuguese_indicators = ['alimento', 'nutrição', 'caloria', 'análise', 'comida']
                has_portuguese = any(indicator in description_text.lower() for indicator in portuguese_indicators)
                
                # Check for no false error messages
                no_error_messages = 'error' not in description_text.lower() and 'erro' not in description_text.lower()
                
                structure_valid = has_id and has_description and has_timestamp
                
                self.log_test(
                    "Analyze Nutrition - Food Mode",
                    structure_valid and has_nutritional_analysis and no_error_messages,
                    f"Status: 200, Structure: {structure_valid}, Nutrition: {has_nutritional_analysis}, Portuguese: {has_portuguese}, No Errors: {no_error_messages}, Time: {response_time:.2f}s"
                )
                
                # Test nutritional analysis structure if present
                if has_nutritional_analysis and result['nutritional_analysis']:
                    nutrition_data = result['nutritional_analysis']
                    required_fields = ['foods_detected', 'total_calories', 'total_weight_grams']
                    nutrition_structure_valid = all(field in nutrition_data for field in required_fields)
                    
                    self.log_test(
                        "Nutritional Analysis Structure",
                        nutrition_structure_valid,
                        f"Required fields present: {nutrition_structure_valid}"
                    )
            
            else:
                error_detail = response.text[:200] if response.text else "No error details"
                self.log_test(
                    "Analyze Nutrition - Food Mode",
                    False,
                    f"Status: {response.status_code}, Error: {error_detail}"
                )
                
        except Exception as e:
            self.log_test(
                "Analyze Nutrition - Food Mode",
                False,
                f"Exception: {str(e)}"
            )

    def test_authentication_validation(self):
        """Test that all endpoints require authentication"""
        print("\n🔒 Testing Authentication Validation...")
        
        test_image = self.create_simple_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        endpoints = [
            ("detect/analyze-frame", "Analyze Frame"),
            ("detect/read-text", "Read Text"),
            ("detect/analyze-nutrition", "Analyze Nutrition")
        ]
        
        for endpoint, name in endpoints:
            try:
                # Test without authentication
                response = requests.post(
                    f"{self.api_url}/{endpoint}",
                    json={
                        "source": "upload",
                        "detection_type": "cloud" if endpoint == "detect/analyze-frame" else "nutrition",
                        "image_data": image_data
                    },
                    headers={'Content-Type': 'application/json'},
                    timeout=30
                )
                
                # Should return 401 Unauthorized
                auth_required = response.status_code == 401
                
                self.log_test(
                    f"Authentication Required - {name}",
                    auth_required,
                    f"Status: {response.status_code}, Expected: 401"
                )
                
            except Exception as e:
                self.log_test(
                    f"Authentication Required - {name}",
                    False,
                    f"Exception: {str(e)}"
                )

    def test_response_consistency(self):
        """Test that responses are consistent and don't have false errors"""
        print("\n🔄 Testing Response Consistency...")
        
        test_image = self.create_simple_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        # Test multiple requests to the same endpoint
        consistent_responses = True
        response_times = []
        
        for i in range(3):
            try:
                start_time = time.time()
                
                response = requests.post(
                    f"{self.api_url}/detect/analyze-frame",
                    json={
                        "source": "webcam",
                        "detection_type": "cloud",
                        "image_data": image_data
                    },
                    headers=self.get_auth_headers(),
                    timeout=60
                )
                
                end_time = time.time()
                response_time = end_time - start_time
                response_times.append(response_time)
                
                if response.status_code != 200:
                    consistent_responses = False
                    break
                
                result = response.json()
                
                # Check for required fields
                required_fields = ['id', 'description', 'timestamp']
                if not all(field in result for field in required_fields):
                    consistent_responses = False
                    break
                
                # Check for false error messages
                description = result.get('description', '')
                if 'error' in description.lower() or 'erro' in description.lower():
                    consistent_responses = False
                    break
                
            except Exception as e:
                consistent_responses = False
                break
        
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        self.log_test(
            "Response Consistency",
            consistent_responses,
            f"3 consecutive requests successful: {consistent_responses}, Avg time: {avg_response_time:.2f}s"
        )

    def run_all_tests(self):
        """Run all camera and detection flow tests"""
        print("🚀 Starting Camera and Detection Flow Testing")
        print("=" * 60)
        
        # Setup authentication
        if not self.setup_authentication():
            print("❌ Authentication setup failed. Cannot proceed with tests.")
            return False
        
        # Run all tests
        self.test_analyze_frame_cloud_detection()
        self.test_analyze_frame_upload_source()
        self.test_read_text_endpoints()
        self.test_analyze_nutrition_endpoint()
        self.test_authentication_validation()
        self.test_response_consistency()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Camera and Detection Flow Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed < self.tests_run:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test_name']}: {result['details']}")
        else:
            print("\n✅ All tests passed!")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = CameraDetectionTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)