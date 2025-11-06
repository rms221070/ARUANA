#!/usr/bin/env python3

import requests
import json
import random

def test_admin_access_fixed():
    """Test admin access with the hardcoded admin email"""
    base_url = "https://aruana-vision-2.preview.emergentagent.com/api"
    
    # Create a regular user first
    random_id = random.randint(10000, 99999)
    
    # Register regular user
    user_data = {
        "name": f"Regular User {random_id}",
        "email": f"user{random_id}@example.com",
        "password": "UserPass123!",
        "user_type": "user"
    }
    
    response = requests.post(f"{base_url}/auth/register", json=user_data)
    print(f"User registration: {response.status_code}")
    
    # Login as regular user
    login_data = {
        "email": f"user{random_id}@example.com",
        "password": "UserPass123!"
    }
    
    response = requests.post(f"{base_url}/auth/login", json=login_data)
    user_token = response.json().get('access_token')
    user_id = response.json().get('user', {}).get('id')
    print(f"User login: {response.status_code}, User ID: {user_id}")
    
    # Create a detection as regular user
    import base64
    from PIL import Image
    from io import BytesIO
    
    # Create simple test image
    img = Image.new('RGB', (100, 100), color='red')
    buffer = BytesIO()
    img.save(buffer, format='JPEG')
    img_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
    image_data = f"data:image/jpeg;base64,{img_data}"
    
    user_headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {user_token}'
    }
    
    detection_data = {
        "source": "upload",
        "detection_type": "cloud",
        "image_data": image_data
    }
    
    response = requests.post(f"{base_url}/detect/analyze-frame", json=detection_data, headers=user_headers)
    print(f"User detection creation: {response.status_code}")
    
    # Get detections as user
    response = requests.get(f"{base_url}/detections", headers=user_headers)
    user_detections = response.json()
    print(f"User detections count: {len(user_detections)}")
    
    # Now test with the HARDCODED admin email
    # Try to login as the hardcoded admin (it should already exist)
    admin_login_data = {
        "email": "aruanasistema@gmail.com",
        "password": "Ricardo@2025"  # This is the hardcoded password from startup
    }
    
    response = requests.post(f"{base_url}/auth/login", json=admin_login_data)
    if response.status_code == 200:
        admin_token = response.json().get('access_token')
        admin_user_info = response.json().get('user', {})
        print(f"Admin login: {response.status_code}, Admin user_type: {admin_user_info.get('user_type')}")
        
        # Get detections as admin
        admin_headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {admin_token}'
        }
        
        response = requests.get(f"{base_url}/detections", headers=admin_headers)
        admin_detections = response.json()
        print(f"Admin detections count: {len(admin_detections)}")
        
        # Check if admin sees more detections
        print(f"User sees {len(user_detections)} detections")
        print(f"Admin sees {len(admin_detections)} detections")
        
        # Check user_ids in admin detections
        user_ids_in_admin_view = set()
        for detection in admin_detections:
            if detection.get('user_id'):
                user_ids_in_admin_view.add(detection.get('user_id'))
        
        print(f"Admin sees detections from {len(user_ids_in_admin_view)} different users")
        
        # Check if the specific user's detection is visible to admin
        user_detection_visible_to_admin = any(d.get('user_id') == user_id for d in admin_detections)
        print(f"User's detection visible to admin: {user_detection_visible_to_admin}")
        
        return len(admin_detections) >= len(user_detections)
    else:
        print(f"Admin login failed: {response.status_code}")
        print(f"Response: {response.text}")
        return False

if __name__ == "__main__":
    success = test_admin_access_fixed()
    print(f"Admin access test: {'PASSED' if success else 'FAILED'}")