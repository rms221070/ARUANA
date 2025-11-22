#!/usr/bin/env python3

import requests
import base64
from io import BytesIO
from PIL import Image

def create_simple_test_image():
    """Create a simple 1x1 pixel test image as requested"""
    # Create a 1x1 pixel image (minimal as requested)
    img = Image.new('RGB', (1, 1), color='white')
    
    buffer = BytesIO()
    img.save(buffer, format='JPEG')
    img_data = buffer.getvalue()
    return base64.b64encode(img_data).decode('utf-8')

def test_math_physics_endpoint():
    """Test POST /api/detect/math-physics endpoint"""
    print("🧮 Testing Math-Physics Analysis Endpoint")
    print("-" * 50)
    
    # Backend URL from environment
    base_url = "https://sight-ai-1.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    # Create a simple 1x1 pixel base64 image as requested
    test_image = create_simple_test_image()
    image_data = f"data:image/jpeg;base64,{test_image}"
    
    # Test data as specified in the review request
    test_data = {
        "source": "math_physics_reader",
        "detection_type": "math_physics", 
        "image_data": image_data
    }
    
    try:
        print("Making POST request to /api/detect/math-physics...")
        response = requests.post(
            f"{api_url}/detect/math-physics",
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=60
        )
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS: Endpoint returned 200 OK")
            
            try:
                result = response.json()
                print("✅ SUCCESS: Valid JSON response received")
                
                # Check response structure as requested
                has_id = 'id' in result
                has_description = 'description' in result and result['description']
                has_timestamp = 'timestamp' in result
                
                print(f"✅ Response Structure Check:")
                print(f"   - ID field present: {has_id}")
                print(f"   - Description field present and not empty: {has_description}")
                print(f"   - Timestamp field present: {has_timestamp}")
                
                if has_description:
                    description = result['description']
                    print(f"   - Description length: {len(description)} characters")
                    
                    # Check if description contains Portuguese text
                    portuguese_words = [
                        'matemática', 'física', 'equação', 'fórmula', 'problema', 
                        'análise', 'cálculo', 'resultado', 'solução', 'expressão',
                        'imagem', 'não', 'é', 'de', 'uma', 'para', 'com', 'em'
                    ]
                    
                    has_portuguese = any(word in description.lower() for word in portuguese_words)
                    print(f"   - Contains Portuguese text: {has_portuguese}")
                    
                    if has_portuguese:
                        print("✅ SUCCESS: Description contains Portuguese text")
                    else:
                        print("⚠️  WARNING: Description may not contain Portuguese text")
                        print(f"   First 200 chars: {description[:200]}...")
                
                # Show full response structure
                print(f"\n📋 Full Response Structure:")
                for key in result.keys():
                    if key == 'description':
                        print(f"   - {key}: [text with {len(result[key])} characters]")
                    elif key == 'image_data':
                        print(f"   - {key}: [base64 image data]")
                    else:
                        print(f"   - {key}: {result[key]}")
                
                # Overall success check
                if has_id and has_description and has_timestamp:
                    print("\n🎉 OVERALL SUCCESS: Math-Physics endpoint working correctly!")
                    print("   ✅ Returns 200 OK")
                    print("   ✅ Valid JSON structure")
                    print("   ✅ Contains required fields (id, description, timestamp)")
                    print("   ✅ Description field contains text")
                    return True
                else:
                    print("\n❌ FAILURE: Missing required response fields")
                    return False
                    
            except Exception as e:
                print(f"❌ ERROR: Failed to parse JSON response: {e}")
                print(f"Raw response: {response.text[:500]}...")
                return False
                
        else:
            print(f"❌ FAILURE: Expected 200 OK, got {response.status_code}")
            try:
                error_detail = response.json()
                print(f"Error response: {error_detail}")
            except:
                print(f"Raw error response: {response.text[:500]}...")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: Request failed: {e}")
        return False

if __name__ == "__main__":
    success = test_math_physics_endpoint()
    if success:
        print("\n🎯 CONCLUSION: Math-Physics endpoint test PASSED")
    else:
        print("\n💥 CONCLUSION: Math-Physics endpoint test FAILED")