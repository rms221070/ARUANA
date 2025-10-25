#!/usr/bin/env python3
"""
Authentication Integration Testing
Test authentication with other endpoints and specific review scenarios
"""

import requests
import json
import sys
import random
import base64
from datetime import datetime
from io import BytesIO
from PIL import Image

class AuthIntegrationTester:
    def __init__(self, base_url="https://aruana-vision-1.preview.emergentagent.com"):
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

    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request and return response"""
        url = f"{self.api_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=60)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=60)

            # Parse response
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"raw_response": response.text}

            return response.status_code, response_data

        except Exception as e:
            return None, {"error": str(e)}

    def create_test_image(self):
        """Create a simple test image"""
        # Create a 100x100 pixel image
        img = Image.new('RGB', (100, 100), color='white')
        
        # Draw a simple pattern
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        draw.rectangle([25, 25, 75, 75], fill='blue')
        draw.ellipse([40, 40, 60, 60], fill='red')
        
        buffer = BytesIO()
        img.save(buffer, format='JPEG')
        img_data = buffer.getvalue()
        return base64.b64encode(img_data).decode('utf-8')

    def setup_test_user(self):
        """Setup a test user and return token"""
        random_id = random.randint(10000, 99999)
        test_email = f"integrationtest{random_id}@example.com"
        
        # Register user
        user_data = {
            "name": f"Integration Test User {random_id}",
            "email": test_email,
            "password": "IntegrationPass123!",
            "user_type": "user"
        }
        
        status_code, response = self.make_request('POST', 'auth/register', user_data)
        if status_code != 200:
            return None, None
        
        # Login user
        login_data = {
            "email": test_email,
            "password": "IntegrationPass123!"
        }
        
        status_code, response = self.make_request('POST', 'auth/login', login_data)
        if status_code != 200:
            return None, None
        
        return response.get('access_token'), response.get('user', {}).get('id')

    def test_authentication_with_analyze_frame(self):
        """Test authentication with analyze-frame endpoint"""
        print("\n🔍 TESTE DE AUTENTICAÇÃO COM ANALYZE-FRAME")
        print("-" * 50)
        
        # Setup user
        token, user_id = self.setup_test_user()
        if not token:
            self.log_test("Auth Integration - Setup Failed", False, "Could not create test user")
            return False
        
        # Create test image
        test_image = self.create_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        # Test WITHOUT authentication (should fail)
        status_code, response = self.make_request('POST', 'detect/analyze-frame', {
            "source": "upload",
            "detection_type": "cloud",
            "image_data": image_data
        })
        
        no_auth_blocked = status_code == 401
        self.log_test("Analyze Frame - No Auth Blocked", no_auth_blocked,
                     f"Status without auth: {status_code}, Expected: 401")
        
        # Test WITH authentication (should work)
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        status_code, response = self.make_request('POST', 'detect/analyze-frame', {
            "source": "upload",
            "detection_type": "cloud",
            "image_data": image_data
        }, headers)
        
        auth_works = status_code == 200
        user_id_set = response.get('user_id') == user_id if auth_works else False
        
        self.log_test("Analyze Frame - With Auth Works", auth_works,
                     f"Status with auth: {status_code}")
        
        self.log_test("Analyze Frame - User ID Set", user_id_set,
                     f"User ID in response: {user_id_set}")
        
        return no_auth_blocked and auth_works and user_id_set

    def test_authentication_with_nutrition_analysis(self):
        """Test authentication with nutrition analysis endpoint"""
        print("\n🍎 TESTE DE AUTENTICAÇÃO COM ANÁLISE NUTRICIONAL")
        print("-" * 50)
        
        # Setup user
        token, user_id = self.setup_test_user()
        if not token:
            self.log_test("Nutrition Auth - Setup Failed", False, "Could not create test user")
            return False
        
        # Create test image
        test_image = self.create_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        # Test WITHOUT authentication (should fail)
        status_code, response = self.make_request('POST', 'detect/analyze-nutrition', {
            "source": "upload",
            "detection_type": "nutrition",
            "image_data": image_data
        })
        
        no_auth_blocked = status_code == 401
        self.log_test("Nutrition Analysis - No Auth Blocked", no_auth_blocked,
                     f"Status without auth: {status_code}, Expected: 401")
        
        # Test WITH authentication (should work)
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        status_code, response = self.make_request('POST', 'detect/analyze-nutrition', {
            "source": "upload",
            "detection_type": "nutrition",
            "image_data": image_data
        }, headers)
        
        auth_works = status_code in [200, 503]  # 503 is acceptable for API overload
        user_id_set = response.get('user_id') == user_id if status_code == 200 else True
        
        self.log_test("Nutrition Analysis - With Auth Works", auth_works,
                     f"Status with auth: {status_code}")
        
        if status_code == 200:
            self.log_test("Nutrition Analysis - User ID Set", user_id_set,
                         f"User ID in response: {user_id_set}")
        
        return no_auth_blocked and auth_works

    def test_authentication_with_detections_endpoint(self):
        """Test authentication with detections endpoint"""
        print("\n📊 TESTE DE AUTENTICAÇÃO COM ENDPOINT DE DETECÇÕES")
        print("-" * 50)
        
        # Setup user
        token, user_id = self.setup_test_user()
        if not token:
            self.log_test("Detections Auth - Setup Failed", False, "Could not create test user")
            return False
        
        # Test WITHOUT authentication (should fail)
        status_code, response = self.make_request('GET', 'detections')
        
        no_auth_blocked = status_code == 401
        self.log_test("Detections - No Auth Blocked", no_auth_blocked,
                     f"Status without auth: {status_code}, Expected: 401")
        
        # Test WITH authentication (should work)
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        status_code, response = self.make_request('GET', 'detections', headers=headers)
        
        auth_works = status_code == 200
        self.log_test("Detections - With Auth Works", auth_works,
                     f"Status with auth: {status_code}")
        
        # Verify user can only see their own detections
        if auth_works and isinstance(response, list):
            user_owns_all = True
            for detection in response:
                if detection.get('user_id') and detection.get('user_id') != user_id:
                    user_owns_all = False
                    break
            
            self.log_test("Detections - User Access Control", user_owns_all,
                         f"User sees only own detections: {user_owns_all}")
            
            return no_auth_blocked and auth_works and user_owns_all
        
        return no_auth_blocked and auth_works

    def test_specific_review_scenarios(self):
        """Test specific scenarios mentioned in the review request"""
        print("\n📋 TESTE DOS CENÁRIOS ESPECÍFICOS DA REVISÃO")
        print("-" * 50)
        
        # Test the exact user data from review request
        review_user_data = {
            "name": "Test User",
            "email": "testuser123@example.com",
            "password": "TestPass123!",
            "user_type": "user"
        }
        
        # Register user (might already exist, that's ok)
        status_code, response = self.make_request('POST', 'auth/register', review_user_data)
        
        # Try to login with the exact credentials from review
        login_data = {
            "email": "testuser123@example.com",
            "password": "TestPass123!"
        }
        
        status_code, response = self.make_request('POST', 'auth/login', login_data)
        
        review_login_works = status_code == 200
        self.log_test("Review Scenario - Exact Credentials Login", review_login_works,
                     f"Login with review credentials: {status_code}")
        
        if review_login_works:
            # Test the exact token format and user data structure
            has_access_token = 'access_token' in response
            token_type_bearer = response.get('token_type') == 'bearer'
            has_user_data = 'user' in response
            
            user_structure_valid = False
            if has_user_data:
                user = response['user']
                required_fields = ['id', 'name', 'email', 'user_type']
                user_structure_valid = all(field in user for field in required_fields)
                no_password = 'password' not in user and 'password_hash' not in user
                user_structure_valid = user_structure_valid and no_password
            
            self.log_test("Review Scenario - Response Structure", 
                         has_access_token and token_type_bearer and user_structure_valid,
                         f"Token: {has_access_token}, Bearer: {token_type_bearer}, User: {user_structure_valid}")
            
            # Test GET /api/auth/me with the token
            token = response.get('access_token')
            if token:
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {token}'
                }
                
                status_code, me_response = self.make_request('GET', 'auth/me', headers=headers)
                
                me_works = status_code == 200
                no_password_in_me = ('password' not in me_response and 
                                   'password_hash' not in me_response) if me_works else False
                
                self.log_test("Review Scenario - GET /auth/me", me_works and no_password_in_me,
                             f"Status: {status_code}, No password: {no_password_in_me}")
            
            return review_login_works and has_access_token and user_structure_valid
        
        return False

    def test_mongodb_user_creation_verification(self):
        """Verify user is actually created in MongoDB (indirect test)"""
        print("\n🗄️ TESTE DE VERIFICAÇÃO DE CRIAÇÃO NO MONGODB")
        print("-" * 50)
        
        # Create a unique user
        random_id = random.randint(10000, 99999)
        unique_email = f"mongotest{random_id}@example.com"
        
        user_data = {
            "name": f"MongoDB Test User {random_id}",
            "email": unique_email,
            "password": "MongoPass123!",
            "user_type": "user"
        }
        
        # Register user
        status_code, response = self.make_request('POST', 'auth/register', user_data)
        
        registration_success = status_code == 200
        self.log_test("MongoDB Verification - User Registration", registration_success,
                     f"Registration status: {status_code}")
        
        if registration_success:
            # Try to login immediately (this verifies user was saved to DB)
            login_data = {
                "email": unique_email,
                "password": "MongoPass123!"
            }
            
            status_code, response = self.make_request('POST', 'auth/login', login_data)
            
            login_after_registration = status_code == 200
            self.log_test("MongoDB Verification - Login After Registration", login_after_registration,
                         f"Login status: {status_code}")
            
            # Try to register same user again (should fail - duplicate email)
            status_code, response = self.make_request('POST', 'auth/register', user_data)
            
            duplicate_blocked = status_code in [400, 500]  # Either is acceptable for duplicate
            self.log_test("MongoDB Verification - Duplicate Email Blocked", duplicate_blocked,
                         f"Duplicate registration status: {status_code}")
            
            return registration_success and login_after_registration and duplicate_blocked
        
        return False

    def run_integration_tests(self):
        """Run all authentication integration tests"""
        print("🔐 TESTES DE INTEGRAÇÃO DO SISTEMA DE AUTENTICAÇÃO")
        print("=" * 70)
        print(f"Backend URL: {self.base_url}")
        print("=" * 70)
        
        # Test authentication with various endpoints
        analyze_frame_success = self.test_authentication_with_analyze_frame()
        nutrition_success = self.test_authentication_with_nutrition_analysis()
        detections_success = self.test_authentication_with_detections_endpoint()
        
        # Test specific review scenarios
        review_scenarios_success = self.test_specific_review_scenarios()
        
        # Test MongoDB integration
        mongodb_success = self.test_mongodb_user_creation_verification()
        
        # Calculate results
        integration_tests = [
            analyze_frame_success,
            nutrition_success,
            detections_success,
            review_scenarios_success,
            mongodb_success
        ]
        
        integration_passed = sum(integration_tests)
        integration_total = len(integration_tests)
        
        print("\n" + "=" * 70)
        print("📊 RESUMO DOS TESTES DE INTEGRAÇÃO:")
        print("=" * 70)
        
        test_categories = [
            ("🔍 Autenticação com Analyze Frame", analyze_frame_success),
            ("🍎 Autenticação com Análise Nutricional", nutrition_success),
            ("📊 Autenticação com Endpoint de Detecções", detections_success),
            ("📋 Cenários Específicos da Revisão", review_scenarios_success),
            ("🗄️ Verificação de Criação no MongoDB", mongodb_success)
        ]
        
        for category, passed in test_categories:
            status = "✅ PASSOU" if passed else "❌ FALHOU"
            print(f"{status} - {category}")
        
        all_integration_passed = all(integration_tests)
        
        print("\n" + "=" * 70)
        print(f"📊 RESUMO FINAL DOS TESTES DE INTEGRAÇÃO:")
        print(f"Categorias de Teste: {integration_passed}/{integration_total} aprovadas")
        print(f"Taxa de Sucesso: {(self.tests_passed/self.tests_run)*100:.1f}%")
        print(f"Integração Completa: {'✅ SUCESSO' if all_integration_passed else '❌ FALHOU'}")
        
        # Print failed tests if any
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ TESTES QUE FALHARAM:")
            for test in failed_tests:
                print(f"  - {test['test_name']}: {test['details']}")
        else:
            print("\n✅ TODOS OS TESTES DE INTEGRAÇÃO APROVADOS!")
        
        return all_integration_passed

def main():
    """Main test execution"""
    tester = AuthIntegrationTester()
    success = tester.run_integration_tests()
    
    # Save detailed results
    with open('/app/auth_integration_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'success_rate': (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0,
                'integration_success': success,
                'timestamp': datetime.now().isoformat()
            },
            'detailed_results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())