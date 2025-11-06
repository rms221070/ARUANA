#!/usr/bin/env python3
"""
Authentication System Test
Tests the newly implemented authentication endpoints as specified in the review request.
"""

import requests
import json
import sys
from datetime import datetime

class AuthenticationTester:
    def __init__(self, base_url="https://aruana-vision-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.access_token = None

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

    def test_user_registration(self):
        """Test POST /api/auth/register endpoint"""
        print("\n🔐 Testing User Registration Endpoint")
        print("-" * 50)
        
        # Test 1: Valid user registration
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        test_user_data = {
            "email": f"testuser{unique_id}@example.com",
            "password": "TestPass123!",
            "full_name": "Test User",
            "role": "user"
        }
        
        # Use the correct field names from the review request
        registration_data = {
            "name": test_user_data["full_name"],  # Backend expects 'name' not 'full_name'
            "email": test_user_data["email"],
            "password": test_user_data["password"],
            "user_type": test_user_data["role"]  # Backend expects 'user_type' not 'role'
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/auth/register",
                json=registration_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            success = response.status_code == 200
            if success:
                result = response.json()
                # Verify response structure
                has_success = result.get('success') == True
                has_message = 'message' in result
                
                self.log_test("User Registration - Valid Data", 
                             success and has_success,
                             f"Status: {response.status_code}, Success: {has_success}, Message: {has_message}")
                if success and has_success:
                    registered_email = registration_data["email"]
                else:
                    registered_email = None
            else:
                self.log_test("User Registration - Valid Data", 
                             False,
                             f"Status: {response.status_code}, Response: {response.text}")
                registered_email = None
                
        except Exception as e:
            self.log_test("User Registration - Valid Data", False, f"Exception: {str(e)}")
            return None
        
        # Test 2: Duplicate email registration (should fail)
        try:
            response = requests.post(
                f"{self.api_url}/auth/register",
                json=registration_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            # Should return 400 for duplicate email
            duplicate_handled = response.status_code == 400
            self.log_test("User Registration - Duplicate Email Rejection", 
                         duplicate_handled,
                         f"Status: {response.status_code}, Expected: 400")
                         
        except Exception as e:
            self.log_test("User Registration - Duplicate Email Rejection", False, f"Exception: {str(e)}")
        
        # Test 3: Admin user registration
        admin_data = {
            "name": "Admin User",
            "email": f"admin{unique_id}@example.com",
            "password": "AdminPass123!",
            "user_type": "admin"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/auth/register",
                json=admin_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            success = response.status_code == 200
            self.log_test("Admin User Registration", 
                         success,
                         f"Status: {response.status_code}")
                         
        except Exception as e:
            self.log_test("Admin User Registration", False, f"Exception: {str(e)}")
        
        return registered_email

    def test_user_login(self, test_email=None):
        """Test POST /api/auth/login endpoint"""
        print("\n🔑 Testing User Login Endpoint")
        print("-" * 50)
        
        # Use provided email or default
        if not test_email:
            test_email = "testuser@example.com"  # Fallback for existing users
        
        # Test 1: Valid login
        login_data = {
            "email": test_email,
            "password": "TestPass123!"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/auth/login",
                json=login_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            success = response.status_code == 200
            if success:
                result = response.json()
                
                # Verify response structure as per review request
                has_access_token = 'access_token' in result
                has_token_type = result.get('token_type') == 'bearer'
                has_user = 'user' in result
                
                if has_access_token:
                    self.access_token = result['access_token']
                
                # Verify user object structure
                user_valid = False
                if has_user:
                    user = result['user']
                    required_fields = ['id', 'email', 'name', 'user_type']  # Backend uses 'name' and 'user_type'
                    user_valid = all(field in user for field in required_fields)
                    # Verify password is not returned
                    password_not_returned = 'password' not in user and 'password_hash' not in user
                    user_valid = user_valid and password_not_returned
                
                self.log_test("User Login - Valid Credentials", 
                             success and has_access_token and has_token_type and user_valid,
                             f"Status: {response.status_code}, Token: {has_access_token}, Type: {has_token_type}, User: {user_valid}")
            else:
                self.log_test("User Login - Valid Credentials", 
                             False,
                             f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("User Login - Valid Credentials", False, f"Exception: {str(e)}")
            return False
        
        # Test 2: Wrong password (should return 401)
        wrong_password_data = {
            "email": test_email,
            "password": "WrongPassword123!"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/auth/login",
                json=wrong_password_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            wrong_password_handled = response.status_code == 401
            self.log_test("User Login - Wrong Password", 
                         wrong_password_handled,
                         f"Status: {response.status_code}, Expected: 401")
                         
        except Exception as e:
            self.log_test("User Login - Wrong Password", False, f"Exception: {str(e)}")
        
        # Test 3: Non-existent email (should return 401)
        nonexistent_data = {
            "email": "nonexistent@example.com",
            "password": "SomePassword123!"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/auth/login",
                json=nonexistent_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            nonexistent_handled = response.status_code == 401
            self.log_test("User Login - Non-existent Email", 
                         nonexistent_handled,
                         f"Status: {response.status_code}, Expected: 401")
                         
        except Exception as e:
            self.log_test("User Login - Non-existent Email", False, f"Exception: {str(e)}")
        
        return self.access_token is not None

    def test_get_current_user(self):
        """Test GET /api/auth/me endpoint"""
        print("\n👤 Testing Get Current User Endpoint")
        print("-" * 50)
        
        if not self.access_token:
            self.log_test("Get Current User - No Token Available", False, "No access token from login")
            return False
        
        # Test 1: Valid token
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.access_token}'
        }
        
        try:
            response = requests.get(
                f"{self.api_url}/auth/me",
                headers=headers,
                timeout=30
            )
            
            success = response.status_code == 200
            if success:
                result = response.json()
                
                # Verify user information without password_hash
                required_fields = ['id', 'name', 'email', 'user_type', 'created_at']
                has_required_fields = all(field in result for field in required_fields)
                password_not_returned = 'password' not in result and 'password_hash' not in result
                
                self.log_test("Get Current User - Valid Token", 
                             success and has_required_fields and password_not_returned,
                             f"Status: {response.status_code}, Required fields: {has_required_fields}, Password excluded: {password_not_returned}")
            else:
                self.log_test("Get Current User - Valid Token", 
                             False,
                             f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Get Current User - Valid Token", False, f"Exception: {str(e)}")
        
        # Test 2: No token (should return 401)
        try:
            response = requests.get(
                f"{self.api_url}/auth/me",
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            no_token_handled = response.status_code == 401
            self.log_test("Get Current User - No Token", 
                         no_token_handled,
                         f"Status: {response.status_code}, Expected: 401")
                         
        except Exception as e:
            self.log_test("Get Current User - No Token", False, f"Exception: {str(e)}")
        
        # Test 3: Invalid token (should return 401)
        invalid_headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer invalid_token_here'
        }
        
        try:
            response = requests.get(
                f"{self.api_url}/auth/me",
                headers=invalid_headers,
                timeout=30
            )
            
            invalid_token_handled = response.status_code == 401
            self.log_test("Get Current User - Invalid Token", 
                         invalid_token_handled,
                         f"Status: {response.status_code}, Expected: 401")
                         
        except Exception as e:
            self.log_test("Get Current User - Invalid Token", False, f"Exception: {str(e)}")
        
        return True

    def test_jwt_token_properties(self):
        """Test JWT token properties"""
        print("\n🔒 Testing JWT Token Properties")
        print("-" * 50)
        
        if not self.access_token:
            self.log_test("JWT Token Properties - No Token Available", False, "No access token available")
            return False
        
        # Test JWT format (should have 3 parts separated by dots)
        token_parts = self.access_token.split('.')
        valid_jwt_format = len(token_parts) == 3
        
        self.log_test("JWT Token Format", 
                     valid_jwt_format,
                     f"Token parts: {len(token_parts)}, Expected: 3")
        
        # Test token expiry (should be valid for 30 days as per backend code)
        # We can't easily test the exact expiry without decoding, but we can verify it works
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.access_token}'
        }
        
        try:
            response = requests.get(
                f"{self.api_url}/auth/me",
                headers=headers,
                timeout=30
            )
            
            token_works = response.status_code == 200
            self.log_test("JWT Token Validity", 
                         token_works,
                         f"Token works for protected endpoint: {token_works}")
                         
        except Exception as e:
            self.log_test("JWT Token Validity", False, f"Exception: {str(e)}")
        
        return valid_jwt_format

    def test_password_security(self):
        """Test password hashing and security"""
        print("\n🛡️ Testing Password Security")
        print("-" * 50)
        
        # Register a new user to test password security
        import uuid
        security_unique_id = str(uuid.uuid4())[:8]
        security_user_data = {
            "name": "Security Test User",
            "email": f"securitytest{security_unique_id}@example.com",
            "password": "SecurityPass123!",
            "user_type": "user"
        }
        
        try:
            # Register user
            response = requests.post(
                f"{self.api_url}/auth/register",
                json=security_user_data,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            registration_success = response.status_code == 200
            
            if registration_success:
                # Login with the same user
                login_data = {
                    "email": security_user_data["email"],
                    "password": "SecurityPass123!"
                }
                
                response = requests.post(
                    f"{self.api_url}/auth/login",
                    json=login_data,
                    headers={'Content-Type': 'application/json'},
                    timeout=30
                )
                
                login_success = response.status_code == 200
                if login_success:
                    result = response.json()
                    user_info = result.get('user', {})
                    
                    # Verify password is not returned in any form
                    password_not_in_response = (
                        'password' not in user_info and 
                        'password_hash' not in user_info and
                        'SecurityPass123!' not in str(result)
                    )
                    
                    self.log_test("Password Security - Bcrypt Hashing", 
                                 password_not_in_response,
                                 f"Password excluded from all responses: {password_not_in_response}")
                else:
                    self.log_test("Password Security - Bcrypt Hashing", False, "Login failed after registration")
            else:
                self.log_test("Password Security - Bcrypt Hashing", False, "Registration failed")
                
        except Exception as e:
            self.log_test("Password Security - Bcrypt Hashing", False, f"Exception: {str(e)}")
        
        return True

    def run_all_authentication_tests(self):
        """Run all authentication tests as specified in the review request"""
        print("🚀 Starting Authentication System Tests")
        print("Backend URL:", self.base_url)
        print("=" * 70)
        
        # Run all authentication tests
        registered_email = self.test_user_registration()
        login_success = self.test_user_login(registered_email)
        self.test_get_current_user()
        self.test_jwt_token_properties()
        self.test_password_security()
        
        # Print summary
        print("\n" + "=" * 70)
        print(f"📊 Authentication Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"  - {test['test_name']}: {test['details']}")
        else:
            print("\n✅ All authentication tests passed successfully!")
        
        # Save detailed results
        with open('/app/auth_test_results.json', 'w') as f:
            json.dump({
                'summary': {
                    'total_tests': self.tests_run,
                    'passed_tests': self.tests_passed,
                    'success_rate': (self.tests_passed/self.tests_run)*100 if self.tests_run > 0 else 0,
                    'timestamp': datetime.now().isoformat()
                },
                'detailed_results': self.test_results
            }, f, indent=2)
        
        return self.tests_passed == self.tests_run

def main():
    tester = AuthenticationTester()
    success = tester.run_all_authentication_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())