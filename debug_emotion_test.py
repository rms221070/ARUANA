import requests
import json
import base64
from io import BytesIO
from PIL import Image

def create_test_image():
    """Create a simple test image as base64"""
    img = Image.new('RGB', (100, 100), color='red')
    buffer = BytesIO()
    img.save(buffer, format='JPEG')
    img_data = buffer.getvalue()
    return base64.b64encode(img_data).decode('utf-8')

def test_emotion_response():
    base_url = "https://ai-sight-4.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    test_image = create_test_image()
    image_data = f"data:image/jpeg;base64,{test_image}"
    
    # Test enhanced AI analysis
    response = requests.post(
        f"{api_url}/detect/analyze-frame",
        json={
            "source": "upload",
            "detection_type": "cloud",
            "image_data": image_data
        },
        headers={'Content-Type': 'application/json'},
        timeout=30
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("\n=== FULL RESPONSE ===")
        print(json.dumps(result, indent=2))
        
        print("\n=== EMOTION ANALYSIS ===")
        if 'emotion_analysis' in result:
            print(f"Emotion Analysis: {result['emotion_analysis']}")
            print(f"Type: {type(result['emotion_analysis'])}")
            if result['emotion_analysis']:
                for key, value in result['emotion_analysis'].items():
                    print(f"  {key}: {value} (type: {type(value)})")
        else:
            print("No emotion_analysis field found")
            
        print("\n=== SENTIMENT ANALYSIS ===")
        if 'sentiment_analysis' in result:
            print(f"Sentiment Analysis: {result['sentiment_analysis']}")
            print(f"Type: {type(result['sentiment_analysis'])}")
            if result['sentiment_analysis']:
                for key, value in result['sentiment_analysis'].items():
                    print(f"  {key}: {value} (type: {type(value)})")
        else:
            print("No sentiment_analysis field found")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    test_emotion_response()