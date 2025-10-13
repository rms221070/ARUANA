import requests
import json
import base64
from io import BytesIO
from PIL import Image, ImageDraw

def create_sad_face_image():
    """Create a sad face image for testing"""
    img = Image.new('RGB', (200, 200), color='lightgray')
    draw = ImageDraw.Draw(img)
    
    # Face outline (circle)
    draw.ellipse([50, 50, 150, 150], fill='peachpuff', outline='black')
    
    # Eyes
    draw.ellipse([70, 80, 85, 95], fill='black')  # Left eye
    draw.ellipse([115, 80, 130, 95], fill='black')  # Right eye
    
    # Nose
    draw.ellipse([95, 100, 105, 110], fill='pink')
    
    # Mouth (frown)
    draw.arc([80, 125, 120, 145], start=180, end=360, fill='red', width=3)
    
    buffer = BytesIO()
    img.save(buffer, format='JPEG')
    img_data = buffer.getvalue()
    return base64.b64encode(img_data).decode('utf-8')

def test_different_emotions():
    base_url = "https://ai-sight-4.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    # Test with sad face
    sad_image = create_sad_face_image()
    image_data = f"data:image/jpeg;base64,{sad_image}"
    
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
    
    print(f"Sad Face Test - Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("\n=== SAD FACE EMOTION ANALYSIS ===")
        if 'emotion_analysis' in result and result['emotion_analysis']:
            emotion_data = result['emotion_analysis']
            print(f"Emotions detected: {emotion_data}")
            
            # Check if any negative emotions are detected
            negative_emotions = emotion_data.get('triste', 0) + emotion_data.get('zangado', 0)
            print(f"Negative emotions count: {negative_emotions}")
        
        print("\n=== SAD FACE SENTIMENT ANALYSIS ===")
        if 'sentiment_analysis' in result and result['sentiment_analysis']:
            sentiment_data = result['sentiment_analysis']
            print(f"Sentiments detected: {sentiment_data}")
            
            # Check sentiment distribution
            total_sentiment = sum(sentiment_data.values())
            print(f"Total sentiment count: {total_sentiment}")

def test_intelligent_reports():
    """Test the intelligent reports endpoint"""
    base_url = "https://ai-sight-4.preview.emergentagent.com"
    api_url = f"{base_url}/api"
    
    response = requests.post(
        f"{api_url}/reports/intelligent",
        json={
            "report_type": "emotions",
            "start_date": None,
            "end_date": None
        },
        headers={'Content-Type': 'application/json'},
        timeout=30
    )
    
    print(f"\nIntelligent Reports Test - Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("\n=== INTELLIGENT REPORT STRUCTURE ===")
        print(f"Report type: {result.get('report_type')}")
        print(f"Detections summary: {result.get('detections_summary')}")
        print(f"Emotions analysis: {result.get('emotions_analysis')}")
        print(f"Sentiment analysis: {result.get('sentiment_analysis')}")
        print(f"Insights: {result.get('insights')}")

if __name__ == "__main__":
    print("🧪 Running Additional Emotion & Sentiment Tests")
    print("=" * 60)
    
    test_different_emotions()
    test_intelligent_reports()
    
    print("\n✅ Additional tests completed!")