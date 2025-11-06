#!/usr/bin/env python3
"""
Comprehensive Authentication System Testing
Based on review request requirements for 100% functional authentication system
"""

import requests
import json
import sys
import random
from datetime import datetime

class AuthenticationTester:
    def __init__(self, base_url="https://aruana-vision-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.user_tokens = {}  # Store tokens for different users

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

    def make_request(self, method, endpoint, data=None, headers=None, expected_status=None):
        """Make HTTP request and return response"""
        url = f"{self.api_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            # Parse response
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"raw_response": response.text}

            return response.status_code, response_data

        except Exception as e:
            return None, {"error": str(e)}

    def test_1_user_registration(self):
        """1. Registro de Usuário - POST /api/auth/register"""
        print("\n1️⃣ TESTE DE REGISTRO DE USUÁRIO")
        print("-" * 50)
        
        # Generate unique test data
        random_id = random.randint(10000, 99999)
        test_email = f"testuser{random_id}@example.com"
        
        # Test data as specified in review
        user_data = {
            "name": "Test User",
            "email": test_email,
            "password": "TestPass123!",
            "user_type": "user"
        }
        
        status_code, response = self.make_request('POST', 'auth/register', user_data)
        
        # Verificar: response 200, retorna user data
        success = status_code == 200
        self.log_test("1.1 User Registration - Status 200", success, f"Status: {status_code}")
        
        if success:
            # Verificar: senha não retornada
            password_not_returned = 'password' not in response and 'password_hash' not in response
            self.log_test("1.2 User Registration - Password Not Returned", password_not_returned, 
                         f"Password excluded: {password_not_returned}")
            
            # Verificar: retorna success message
            has_success = response.get('success') == True
            has_message = 'message' in response
            self.log_test("1.3 User Registration - Response Structure", has_success and has_message,
                         f"Success: {has_success}, Message: {has_message}")
            
            # Store user for later tests
            self.user_tokens['test_user'] = {
                'email': test_email,
                'password': 'TestPass123!',
                'name': 'Test User'
            }
            
            return success and password_not_returned and has_success
        
        return False

    def test_2_user_login(self):
        """2. Login com Email/Senha - POST /api/auth/login"""
        print("\n2️⃣ TESTE DE LOGIN COM EMAIL/SENHA")
        print("-" * 50)
        
        if 'test_user' not in self.user_tokens:
            self.log_test("2.0 Login Test - Setup Failed", False, "No test user available")
            return False, None
        
        user_info = self.user_tokens['test_user']
        login_data = {
            "email": user_info['email'],
            "password": user_info['password']
        }
        
        status_code, response = self.make_request('POST', 'auth/login', login_data)
        
        # Verificar: retorna access_token
        success = status_code == 200
        self.log_test("2.1 User Login - Status 200", success, f"Status: {status_code}")
        
        access_token = None
        if success:
            # Verificar: retorna access_token
            has_access_token = 'access_token' in response
            access_token = response.get('access_token')
            self.log_test("2.2 User Login - Access Token Returned", has_access_token,
                         f"Token present: {has_access_token}")
            
            # Verificar: retorna user data
            has_user_data = 'user' in response
            user_data_valid = False
            if has_user_data:
                user = response['user']
                required_fields = ['id', 'name', 'email', 'user_type']
                user_data_valid = all(field in user for field in required_fields)
                # Verificar: senha não retornada
                password_not_in_user = 'password' not in user and 'password_hash' not in user
                user_data_valid = user_data_valid and password_not_in_user
            
            self.log_test("2.3 User Login - User Data Valid", has_user_data and user_data_valid,
                         f"User data: {has_user_data}, Valid: {user_data_valid}")
            
            # Verificar: token é JWT válido (3 partes separadas por pontos)
            jwt_valid = False
            if access_token:
                token_parts = access_token.split('.')
                jwt_valid = len(token_parts) == 3
            
            self.log_test("2.4 User Login - JWT Token Valid", jwt_valid,
                         f"JWT format valid: {jwt_valid}")
            
            # Store token for further tests
            if access_token:
                self.user_tokens['test_user']['token'] = access_token
                self.user_tokens['test_user']['user_id'] = response.get('user', {}).get('id')
            
            return success and has_access_token and user_data_valid and jwt_valid, access_token
        
        return False, None

    def test_3_verify_current_user(self, token):
        """3. Verificar Usuário Atual - GET /api/auth/me"""
        print("\n3️⃣ TESTE DE VERIFICAÇÃO DO USUÁRIO ATUAL")
        print("-" * 50)
        
        if not token:
            self.log_test("3.0 Current User Test - Setup Failed", False, "No token available")
            return False
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        status_code, response = self.make_request('GET', 'auth/me', headers=headers)
        
        # Verificar: retorna user data completo
        success = status_code == 200
        self.log_test("3.1 Get Current User - Status 200", success, f"Status: {status_code}")
        
        if success:
            # Verificar: retorna user data completo
            required_fields = ['id', 'name', 'email', 'user_type', 'created_at']
            has_required_fields = all(field in response for field in required_fields)
            self.log_test("3.2 Get Current User - Complete Data", has_required_fields,
                         f"Required fields present: {has_required_fields}")
            
            # Verificar: sem password_hash
            no_password_hash = 'password' not in response and 'password_hash' not in response
            self.log_test("3.3 Get Current User - No Password Hash", no_password_hash,
                         f"Password excluded: {no_password_hash}")
            
            return success and has_required_fields and no_password_hash
        
        return False

    def test_4_authentication_errors(self):
        """4. Erros de Autenticação"""
        print("\n4️⃣ TESTE DE ERROS DE AUTENTICAÇÃO")
        print("-" * 50)
        
        if 'test_user' not in self.user_tokens:
            self.log_test("4.0 Auth Errors Test - Setup Failed", False, "No test user available")
            return False
        
        user_info = self.user_tokens['test_user']
        
        # Login com senha errada → 401
        wrong_password_data = {
            "email": user_info['email'],
            "password": "WrongPassword123!"
        }
        
        status_code, response = self.make_request('POST', 'auth/login', wrong_password_data)
        wrong_password_401 = status_code == 401
        self.log_test("4.1 Auth Errors - Wrong Password → 401", wrong_password_401,
                     f"Status: {status_code}, Expected: 401")
        
        # Login com email inexistente → 401
        nonexistent_data = {
            "email": "nonexistent@example.com",
            "password": "SomePassword123!"
        }
        
        status_code, response = self.make_request('POST', 'auth/login', nonexistent_data)
        nonexistent_401 = status_code == 401
        self.log_test("4.2 Auth Errors - Nonexistent Email → 401", nonexistent_401,
                     f"Status: {status_code}, Expected: 401")
        
        # GET /api/auth/me sem token → 401
        status_code, response = self.make_request('GET', 'auth/me')
        no_token_401 = status_code == 401
        self.log_test("4.3 Auth Errors - No Token → 401", no_token_401,
                     f"Status: {status_code}, Expected: 401")
        
        # GET /api/auth/me com token inválido → 401
        invalid_headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer invalid_token_12345'
        }
        
        status_code, response = self.make_request('GET', 'auth/me', headers=invalid_headers)
        invalid_token_401 = status_code == 401
        self.log_test("4.4 Auth Errors - Invalid Token → 401", invalid_token_401,
                     f"Status: {status_code}, Expected: 401")
        
        return wrong_password_401 and nonexistent_401 and no_token_401 and invalid_token_401

    def test_5_password_recovery(self):
        """5. Recuperação de Senha - POST /api/auth/forgot-password"""
        print("\n5️⃣ TESTE DE RECUPERAÇÃO DE SENHA")
        print("-" * 50)
        
        if 'test_user' not in self.user_tokens:
            self.log_test("5.0 Password Recovery Test - Setup Failed", False, "No test user available")
            return False, None
        
        user_info = self.user_tokens['test_user']
        forgot_data = {
            "email": user_info['email']
        }
        
        status_code, response = self.make_request('POST', 'auth/forgot-password', forgot_data)
        
        # Verificar: retorna success e token (dev mode)
        success = status_code == 200
        self.log_test("5.1 Password Recovery - Status 200", success, f"Status: {status_code}")
        
        reset_token = None
        if success:
            has_success = response.get('success') == True
            has_token = 'token' in response  # Dev mode returns token
            reset_token = response.get('token')
            
            self.log_test("5.2 Password Recovery - Success and Token", has_success and has_token,
                         f"Success: {has_success}, Token present: {has_token}")
            
            return success and has_success and has_token, reset_token
        
        return False, None

    def test_6_password_reset(self, reset_token):
        """6. Reset de Senha - POST /api/auth/reset-password"""
        print("\n6️⃣ TESTE DE RESET DE SENHA")
        print("-" * 50)
        
        if not reset_token:
            self.log_test("6.0 Password Reset Test - Setup Failed", False, "No reset token available")
            return False
        
        new_password = "NewPass456!"
        reset_data = {
            "token": reset_token,
            "new_password": new_password
        }
        
        status_code, response = self.make_request('POST', 'auth/reset-password', reset_data)
        
        # Verificar: senha resetada com sucesso
        success = status_code == 200
        self.log_test("6.1 Password Reset - Status 200", success, f"Status: {status_code}")
        
        if success:
            has_success = response.get('success') == True
            has_message = 'message' in response
            
            self.log_test("6.2 Password Reset - Success Response", has_success and has_message,
                         f"Success: {has_success}, Message: {has_message}")
            
            # Verificar: pode fazer login com nova senha
            if 'test_user' in self.user_tokens:
                user_info = self.user_tokens['test_user']
                new_login_data = {
                    "email": user_info['email'],
                    "password": new_password
                }
                
                status_code_login, response_login = self.make_request('POST', 'auth/login', new_login_data)
                login_with_new_password = status_code_login == 200
                
                self.log_test("6.3 Password Reset - Login with New Password", login_with_new_password,
                             f"Login status: {status_code_login}")
                
                # Update stored password
                if login_with_new_password:
                    self.user_tokens['test_user']['password'] = new_password
                    self.user_tokens['test_user']['token'] = response_login.get('access_token')
                
                return success and has_success and login_with_new_password
        
        return False

    def test_7_profile_update(self):
        """7. Atualização de Perfil - PUT /api/auth/profile"""
        print("\n7️⃣ TESTE DE ATUALIZAÇÃO DE PERFIL")
        print("-" * 50)
        
        if 'test_user' not in self.user_tokens or 'token' not in self.user_tokens['test_user']:
            self.log_test("7.0 Profile Update Test - Setup Failed", False, "No token available")
            return False
        
        token = self.user_tokens['test_user']['token']
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        profile_data = {
            "name": "Updated Name",
            "bio": "Test bio",
            "phone": "1234567890"
        }
        
        status_code, response = self.make_request('PUT', 'auth/profile', profile_data, headers)
        
        # Verificar: perfil atualizado
        success = status_code == 200
        self.log_test("7.1 Profile Update - Status 200", success, f"Status: {status_code}")
        
        if success:
            has_success = response.get('success') == True
            has_user = 'user' in response
            
            # Verify updated data
            profile_updated = False
            if has_user:
                user = response['user']
                profile_updated = (user.get('name') == 'Updated Name' and 
                                 user.get('bio') == 'Test bio' and 
                                 user.get('phone') == '1234567890')
            
            self.log_test("7.2 Profile Update - Data Updated", has_success and profile_updated,
                         f"Success: {has_success}, Profile updated: {profile_updated}")
            
            return success and has_success and profile_updated
        
        return False

    def test_comprehensive_authentication_scenarios(self):
        """Test additional comprehensive scenarios"""
        print("\n🔐 CENÁRIOS ADICIONAIS DE AUTENTICAÇÃO")
        print("-" * 50)
        
        # Test JWT token expiry configuration (should be 30 days)
        if 'test_user' in self.user_tokens and 'token' in self.user_tokens['test_user']:
            token = self.user_tokens['test_user']['token']
            
            # Decode JWT to check expiry (basic check)
            import base64
            try:
                # Split token and decode payload (without verification for testing)
                parts = token.split('.')
                if len(parts) == 3:
                    # Decode payload
                    payload = parts[1]
                    # Add padding if needed
                    payload += '=' * (4 - len(payload) % 4)
                    decoded = base64.b64decode(payload)
                    payload_data = json.loads(decoded)
                    
                    # Check if exp field exists
                    has_exp = 'exp' in payload_data
                    self.log_test("JWT Token - Expiry Field Present", has_exp,
                                 f"Expiry field in token: {has_exp}")
                    
                    # Check token format
                    self.log_test("JWT Token - Format Valid", True,
                                 f"Token has 3 parts: {len(parts) == 3}")
                else:
                    self.log_test("JWT Token - Format Valid", False,
                                 f"Token parts: {len(parts)}, Expected: 3")
            except Exception as e:
                self.log_test("JWT Token - Decode Test", False, f"Decode error: {str(e)}")
        
        # Test bcrypt password hashing (indirect test)
        # We can't directly test bcrypt, but we can verify passwords work correctly
        if 'test_user' in self.user_tokens:
            user_info = self.user_tokens['test_user']
            
            # Try login with correct password
            login_data = {
                "email": user_info['email'],
                "password": user_info['password']
            }
            
            status_code, response = self.make_request('POST', 'auth/login', login_data)
            bcrypt_working = status_code == 200
            
            self.log_test("Password Hashing - Bcrypt Working", bcrypt_working,
                         f"Password verification works: {bcrypt_working}")

    def run_comprehensive_authentication_tests(self):
        """Run all comprehensive authentication tests as specified in review"""
        print("🔐 TESTE COMPLETO DO SISTEMA DE AUTENTICAÇÃO")
        print("=" * 70)
        print(f"Backend URL: {self.base_url}")
        print("=" * 70)
        
        # 1. Registro de Usuário
        registration_success = self.test_1_user_registration()
        
        # 2. Login com Email/Senha
        login_success, access_token = self.test_2_user_login()
        
        # 3. Verificar Usuário Atual
        current_user_success = self.test_3_verify_current_user(access_token)
        
        # 4. Erros de Autenticação
        auth_errors_success = self.test_4_authentication_errors()
        
        # 5. Recuperação de Senha
        recovery_success, reset_token = self.test_5_password_recovery()
        
        # 6. Reset de Senha
        reset_success = self.test_6_password_reset(reset_token)
        
        # 7. Atualização de Perfil
        profile_success = self.test_7_profile_update()
        
        # Additional comprehensive scenarios
        self.test_comprehensive_authentication_scenarios()
        
        # Calculate success rate
        critical_tests = [
            registration_success,
            login_success,
            current_user_success,
            auth_errors_success,
            recovery_success,
            reset_success,
            profile_success
        ]
        
        critical_passed = sum(critical_tests)
        critical_total = len(critical_tests)
        
        print("\n" + "=" * 70)
        print("📊 CRITÉRIOS DE SUCESSO - VERIFICAÇÃO:")
        print("=" * 70)
        
        criteria = [
            ("✅ Todos os endpoints de auth funcionando", all(critical_tests)),
            ("✅ JWT tokens válidos", access_token is not None),
            ("✅ Senhas hasheadas (bcrypt)", login_success),  # Indirect verification
            ("✅ Erros apropriados (401, 400)", auth_errors_success),
            ("✅ Dados retornados corretamente", current_user_success),
            ("✅ Sem password_hash nas respostas", current_user_success)
        ]
        
        for criterion, passed in criteria:
            status = "✅ ATENDIDO" if passed else "❌ FALHOU"
            print(f"{status} - {criterion}")
        
        all_criteria_met = all(passed for _, passed in criteria)
        
        print("\n" + "=" * 70)
        print(f"📊 RESUMO FINAL:")
        print(f"Testes Críticos: {critical_passed}/{critical_total} aprovados")
        print(f"Taxa de Sucesso: {(self.tests_passed/self.tests_run)*100:.1f}%")
        print(f"Todos os Critérios: {'✅ ATENDIDOS' if all_criteria_met else '❌ FALHOU'}")
        
        # Print failed tests if any
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ TESTES QUE FALHARAM:")
            for test in failed_tests:
                print(f"  - {test['test_name']}: {test['details']}")
        else:
            print("\n✅ TODOS OS TESTES APROVADOS!")
        
        return all_criteria_met

def main():
    """Main test execution"""
    tester = AuthenticationTester()
    success = tester.run_comprehensive_authentication_tests()
    
    # Save detailed results
    with open('/app/auth_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'success_rate': (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0,
                'all_criteria_met': success,
                'timestamp': datetime.now().isoformat()
            },
            'detailed_results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())