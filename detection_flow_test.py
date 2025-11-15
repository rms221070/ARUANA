#!/usr/bin/env python3
"""
Detection Flow Testing Script
Tests the complete camera and detection flow after fixing camera permission persistence issues.
"""

import requests
import json
import base64
import time
from datetime import datetime
from io import BytesIO
from PIL import Image, ImageDraw

class DetectionFlowTester:
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
            "name": f"Detection Test User {random_id}",
            "email": f"detectiontest{random_id}@example.com",
            "password": "DetectionTest123!",
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

    def test_analyze_frame_endpoint(self):
        """Test POST /api/detect/analyze-frame endpoint for different modes"""
        print("\n📸 Testing Analyze Frame Endpoint...")
        
        test_image = self.create_simple_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        # Test different detection modes
        modes = [
            ("scene", "Scene Analysis"),
            ("general", "General Analysis"), 
            ("people", "People Analysis"),
            ("cloud", "Cloud Analysis")
        ]
        
        for mode, description in modes:
            try:
                start_time = time.time()
                
                response = requests.post(
                    f"{self.api_url}/detect/analyze-frame",
                    json={
                        "source": "upload",
                        "detection_type": mode,
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
                        f"Analyze Frame - {description}",
                        structure_valid and has_portuguese,
                        f"Status: 200, Structure: {structure_valid}, Portuguese: {has_portuguese}, Time: {response_time:.2f}s"
                    )
                    
                    # Test emotion and sentiment analysis if present
                    if 'emotion_analysis' in result and result['emotion_analysis']:
                        emotion_data = result['emotion_analysis']
                        required_emotions = ['sorrindo', 'serio', 'triste', 'surpreso', 'zangado', 'neutro']
                        emotion_valid = all(emotion in emotion_data for emotion in required_emotions)
                        
                        self.log_test(
                            f"Emotion Analysis - {description}",
                            emotion_valid,
                            f"All emotion fields present: {emotion_valid}"
                        )
                    
                    if 'sentiment_analysis' in result and result['sentiment_analysis']:
                        sentiment_data = result['sentiment_analysis']
                        required_sentiments = ['positivo', 'neutro', 'negativo']
                        sentiment_valid = all(sentiment in sentiment_data for sentiment in required_sentiments)
                        
                        self.log_test(
                            f"Sentiment Analysis - {description}",
                            sentiment_valid,
                            f"All sentiment fields present: {sentiment_valid}"
                        )
                
                else:
                    error_detail = response.text[:200] if response.text else "No error details"
                    self.log_test(
                        f"Analyze Frame - {description}",
                        False,
                        f"Status: {response.status_code}, Error: {error_detail}"
                    )
                    
            except Exception as e:
                self.log_test(
                    f"Analyze Frame - {description}",
                    False,
                    f"Exception: {str(e)}"
                )

    def test_read_text_endpoint(self):
        """Test POST /api/detect/read-text endpoint"""
        print("\n📝 Testing Read Text Endpoint...")
        
        # Create a simple image with text
        img = Image.new('RGB', (200, 100), color='white')
        draw = ImageDraw.Draw(img)
        draw.text((10, 40), "Hello World", fill='black')
        
        buffer = BytesIO()
        img.save(buffer, format='JPEG')
        img_data = buffer.getvalue()
        test_image = base64.b64encode(img_data).decode('utf-8')
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        # Test different text reading modes
        modes = [
            ("text-short", "Short Text Reading"),
            ("document", "Document Reading")
        ]
        
        for mode, description in modes:
            try:
                start_time = time.time()
                
                response = requests.post(
                    f"{self.api_url}/detect/read-text",
                    json={
                        "source": "upload",
                        "detection_type": mode,
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
                        f"Read Text - {description}",
                        structure_valid,
                        f"Status: 200, Structure: {structure_valid}, Time: {response_time:.2f}s"
                    )
                
                else:
                    error_detail = response.text[:200] if response.text else "No error details"
                    self.log_test(
                        f"Read Text - {description}",
                        False,
                        f"Status: {response.status_code}, Error: {error_detail}"
                    )
                    
            except Exception as e:
                self.log_test(
                    f"Read Text - {description}",
                    False,
                    f"Exception: {str(e)}"
                )

    def test_analyze_nutrition_endpoint(self):
        """Test POST /api/detect/analyze-nutrition endpoint"""
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
                portuguese_indicators = ['alimento', 'nutrição', 'caloria', 'análise']
                has_portuguese = any(indicator in description_text.lower() for indicator in portuguese_indicators)
                
                structure_valid = has_id and has_description and has_timestamp
                
                self.log_test(
                    "Analyze Nutrition - Food Mode",
                    structure_valid and has_nutritional_analysis,
                    f"Status: 200, Structure: {structure_valid}, Nutrition: {has_nutritional_analysis}, Portuguese: {has_portuguese}, Time: {response_time:.2f}s"
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
                        "detection_type": "cloud",
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

    def test_error_handling(self):
        """Test error handling with invalid data"""
        print("\n⚠️ Testing Error Handling...")
        
        # Test with invalid image data
        try:
            response = requests.post(
                f"{self.api_url}/detect/analyze-frame",
                json={
                    "source": "upload",
                    "detection_type": "cloud",
                    "image_data": "invalid_image_data"
                },
                headers=self.get_auth_headers(),
                timeout=30
            )
            
            # Should handle error gracefully (not crash)
            error_handled = response.status_code in [400, 422, 500, 503]
            
            self.log_test(
                "Error Handling - Invalid Image",
                error_handled,
                f"Status: {response.status_code}, Error handled gracefully: {error_handled}"
            )
            
        except Exception as e:
            self.log_test(
                "Error Handling - Invalid Image",
                False,
                f"Exception: {str(e)}"
            )

    def run_all_tests(self):
        """Run all detection flow tests"""
        print("🚀 Starting Detection Flow Testing")
        print("=" * 60)
        
        # Setup authentication
        if not self.setup_authentication():
            print("❌ Authentication setup failed. Cannot proceed with tests.")
            return
        
        # Run all tests
        self.test_analyze_frame_endpoint()
        self.test_read_text_endpoint()
        self.test_analyze_nutrition_endpoint()
        self.test_authentication_validation()
        self.test_error_handling()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Detection Flow Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
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
    tester = DetectionFlowTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)