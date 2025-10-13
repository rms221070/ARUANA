import requests
import sys
import json
import base64
from datetime import datetime
from io import BytesIO
from PIL import Image

class DetectionSystemTester:
    def __init__(self, base_url="https://ai-sight-4.preview.emergentagent.com"):
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

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}, Expected: {expected_status}"
            
            if not success:
                try:
                    error_detail = response.json() if response.content else "No response content"
                    details += f", Response: {error_detail}"
                except:
                    details += f", Response: {response.text[:200]}"

            self.log_test(name, success, details)
            
            # Handle different response types
            if success and response.content:
                if 'application/json' in response.headers.get('content-type', ''):
                    return success, response.json()
                elif 'text/csv' in response.headers.get('content-type', ''):
                    return success, {"csv_content": response.text}
                else:
                    return success, {"content": response.text}
            else:
                return success, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def create_test_image(self):
        """Create a more realistic test image with a simple face-like pattern"""
        # Create a 200x200 image with a simple face pattern
        img = Image.new('RGB', (200, 200), color='lightblue')
        
        # Draw a simple face using PIL
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        
        # Face outline (circle)
        draw.ellipse([50, 50, 150, 150], fill='peachpuff', outline='black')
        
        # Eyes
        draw.ellipse([70, 80, 85, 95], fill='black')  # Left eye
        draw.ellipse([115, 80, 130, 95], fill='black')  # Right eye
        
        # Nose
        draw.ellipse([95, 100, 105, 110], fill='pink')
        
        # Mouth (smile)
        draw.arc([80, 115, 120, 135], start=0, end=180, fill='red', width=3)
        
        buffer = BytesIO()
        img.save(buffer, format='JPEG')
        img_data = buffer.getvalue()
        return base64.b64encode(img_data).decode('utf-8')

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_alerts_crud(self):
        """Test alerts CRUD operations"""
        # Create alert
        success, alert_data = self.run_test(
            "Create Alert",
            "POST",
            "alerts",
            200,
            data={"object_name": "test_person", "enabled": True}
        )
        
        if not success:
            return False
        
        alert_id = alert_data.get('id')
        if not alert_id:
            self.log_test("Create Alert - Get ID", False, "No alert ID returned")
            return False

        # Get alerts
        success, alerts = self.run_test("Get Alerts", "GET", "alerts", 200)
        if success:
            found_alert = any(alert['id'] == alert_id for alert in alerts)
            self.log_test("Find Created Alert", found_alert, f"Alert ID: {alert_id}")

        # Toggle alert
        success, _ = self.run_test(
            "Toggle Alert",
            "PATCH",
            f"alerts/{alert_id}?enabled=false",
            200
        )

        # Delete alert
        success, _ = self.run_test("Delete Alert", "DELETE", f"alerts/{alert_id}", 200)
        
        return True

    def test_detections_api(self):
        """Test detections API"""
        # Get detections (should work even if empty)
        success, detections = self.run_test("Get Detections", "GET", "detections?limit=10", 200)
        return success

    def test_analyze_frame(self):
        """Test frame analysis with mock image"""
        test_image = self.create_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        # Test cloud detection
        success, result = self.run_test(
            "Analyze Frame - Cloud",
            "POST",
            "detect/analyze-frame",
            200,
            data={
                "source": "upload",
                "detection_type": "cloud",
                "image_data": image_data
            }
        )
        
        if success:
            # Check if result has expected fields
            has_id = 'id' in result
            has_description = 'description' in result
            has_timestamp = 'timestamp' in result
            
            self.log_test("Frame Analysis - Response Structure", 
                         has_id and has_description and has_timestamp,
                         f"ID: {has_id}, Description: {has_description}, Timestamp: {has_timestamp}")

        # Test local detection (might not work without TensorFlow setup)
        success_local, _ = self.run_test(
            "Analyze Frame - Local",
            "POST",
            "detect/analyze-frame",
            200,
            data={
                "source": "webcam",
                "detection_type": "local",
                "image_data": image_data
            }
        )

        return success or success_local

    def test_emotion_sentiment_analysis(self):
        """Test new emotion and sentiment analysis features"""
        test_image = self.create_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        # Test enhanced AI analysis with emotion/sentiment detection
        success, result = self.run_test(
            "Enhanced AI Analysis - Emotion/Sentiment",
            "POST",
            "detect/analyze-frame",
            200,
            data={
                "source": "upload",
                "detection_type": "cloud",
                "image_data": image_data
            }
        )
        
        if success:
            # Test emotion_analysis field presence and structure
            has_emotion_analysis = 'emotion_analysis' in result
            emotion_valid = False
            
            if has_emotion_analysis and result['emotion_analysis']:
                emotion_data = result['emotion_analysis']
                required_emotions = ['sorrindo', 'serio', 'triste', 'surpreso', 'zangado', 'neutro']
                emotion_valid = all(
                    emotion in emotion_data and isinstance(emotion_data[emotion], int) and emotion_data[emotion] >= 0
                    for emotion in required_emotions
                )
                
            self.log_test("Emotion Analysis - Structure", 
                         has_emotion_analysis and emotion_valid,
                         f"Present: {has_emotion_analysis}, Valid: {emotion_valid}")
            
            # Test sentiment_analysis field presence and structure
            has_sentiment_analysis = 'sentiment_analysis' in result
            sentiment_valid = False
            
            if has_sentiment_analysis and result['sentiment_analysis']:
                sentiment_data = result['sentiment_analysis']
                required_sentiments = ['positivo', 'neutro', 'negativo']
                sentiment_valid = all(
                    sentiment in sentiment_data and isinstance(sentiment_data[sentiment], int) and sentiment_data[sentiment] >= 0
                    for sentiment in required_sentiments
                )
                
            self.log_test("Sentiment Analysis - Structure", 
                         has_sentiment_analysis and sentiment_valid,
                         f"Present: {has_sentiment_analysis}, Valid: {sentiment_valid}")
            
            # Test that detection is saved with emotion/sentiment data
            detection_id = result.get('id')
            if detection_id:
                # Retrieve the saved detection to verify database integration
                success_retrieve, detections = self.run_test(
                    "Retrieve Detection with Emotion/Sentiment",
                    "GET",
                    "detections?limit=1",
                    200
                )
                
                if success_retrieve and detections:
                    latest_detection = detections[0] if detections else {}
                    saved_emotion = 'emotion_analysis' in latest_detection
                    saved_sentiment = 'sentiment_analysis' in latest_detection
                    
                    self.log_test("Database Integration - Emotion/Sentiment Storage",
                                 saved_emotion and saved_sentiment,
                                 f"Emotion saved: {saved_emotion}, Sentiment saved: {saved_sentiment}")
            
            return has_emotion_analysis and emotion_valid and has_sentiment_analysis and sentiment_valid
        
        return False

    def test_enhanced_person_analysis(self):
        """Test NEW ultra-detailed person analysis features"""
        # Create a more detailed test image with a person
        test_image = self.create_detailed_person_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        # Test enhanced person analysis with ultra-detailed prompts
        success, result = self.run_test(
            "Ultra-Detailed Person Analysis",
            "POST",
            "detect/analyze-frame",
            200,
            data={
                "source": "upload",
                "detection_type": "cloud",
                "image_data": image_data
            }
        )
        
        if success:
            # Test that description contains ultra-detailed analysis
            description = result.get('description', '')
            has_detailed_description = len(description) > 100  # Should be very detailed
            
            self.log_test("Enhanced Description Length", 
                         has_detailed_description,
                         f"Description length: {len(description)} characters")
            
            # Test for enhanced prompt elements in description
            detailed_elements = [
                'características físicas',
                'olhos',
                'cabelo',
                'vestimenta',
                'acessórios',
                'postura',
                'expressão'
            ]
            
            elements_found = sum(1 for element in detailed_elements 
                               if element.lower() in description.lower())
            
            self.log_test("Enhanced Prompt Elements", 
                         elements_found >= 3,
                         f"Found {elements_found}/{len(detailed_elements)} detailed elements")
            
            # Test objects detected with enhanced details
            objects_detected = result.get('objects_detected', [])
            has_person_object = any(obj.get('label', '').lower() == 'pessoa' 
                                  for obj in objects_detected)
            
            self.log_test("Person Object Detection", 
                         has_person_object,
                         f"Objects detected: {len(objects_detected)}")
            
            # Test enhanced emotion analysis still works
            has_emotion_analysis = 'emotion_analysis' in result and result['emotion_analysis']
            has_sentiment_analysis = 'sentiment_analysis' in result and result['sentiment_analysis']
            
            self.log_test("Enhanced Analysis - Emotion/Sentiment Integration", 
                         has_emotion_analysis and has_sentiment_analysis,
                         f"Emotion: {bool(has_emotion_analysis)}, Sentiment: {bool(has_sentiment_analysis)}")
            
            return (has_detailed_description and elements_found >= 3 and 
                   has_emotion_analysis and has_sentiment_analysis)
        
        return False

    def test_prompt_enhancement_validation(self):
        """Test that enhanced prompts are correctly implemented"""
        test_image = self.create_detailed_person_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        # Test multiple requests to validate consistency
        results = []
        for i in range(2):
            success, result = self.run_test(
                f"Prompt Enhancement Validation - Request {i+1}",
                "POST",
                "detect/analyze-frame",
                200,
                data={
                    "source": "upload",
                    "detection_type": "cloud",
                    "image_data": image_data
                }
            )
            
            if success:
                results.append(result)
        
        if len(results) >= 1:
            # Test that Gemini 2.0 Flash is being used (check response quality)
            first_result = results[0]
            description = first_result.get('description', '')
            
            # Enhanced prompts should produce very detailed Portuguese descriptions
            quality_indicators = [
                len(description) > 200,  # Should be very detailed
                'português' in description.lower() or 'pessoa' in description.lower(),
                'análise' in description.lower() or 'detalhes' in description.lower()
            ]
            
            quality_score = sum(quality_indicators)
            
            self.log_test("Gemini 2.0 Flash Response Quality", 
                         quality_score >= 2,
                         f"Quality indicators: {quality_score}/3")
            
            # Test JSON parsing still works with enhanced outputs
            has_proper_structure = all(key in first_result for key in 
                                     ['id', 'description', 'timestamp', 'objects_detected'])
            
            self.log_test("Enhanced Output - JSON Structure", 
                         has_proper_structure,
                         f"Required fields present: {has_proper_structure}")
            
            return quality_score >= 2 and has_proper_structure
        
        return False

    def test_api_response_times(self):
        """Test API response times with enhanced processing"""
        import time
        
        test_image = self.create_detailed_person_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        start_time = time.time()
        
        success, result = self.run_test(
            "Enhanced Processing - Response Time",
            "POST",
            "detect/analyze-frame",
            200,
            data={
                "source": "upload",
                "detection_type": "cloud",
                "image_data": image_data
            }
        )
        
        end_time = time.time()
        response_time = end_time - start_time
        
        # Enhanced processing should still be reasonable (under 30 seconds)
        acceptable_time = response_time < 30.0
        
        self.log_test("Enhanced Processing - Response Time", 
                     acceptable_time,
                     f"Response time: {response_time:.2f} seconds")
        
        return success and acceptable_time

    def create_detailed_person_image(self):
        """Create a more detailed test image with person-like features for enhanced analysis"""
        # Create a 300x400 image with more detailed person representation
        img = Image.new('RGB', (300, 400), color='lightgray')
        
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        
        # Draw a more detailed person figure
        # Head
        draw.ellipse([100, 50, 200, 150], fill='peachpuff', outline='black', width=2)
        
        # Hair
        draw.ellipse([95, 45, 205, 120], fill='brown', outline='darkbrown')
        
        # Eyes with more detail
        draw.ellipse([120, 85, 135, 100], fill='white')  # Left eye white
        draw.ellipse([165, 85, 180, 100], fill='white')  # Right eye white
        draw.ellipse([125, 90, 130, 95], fill='blue')    # Left iris
        draw.ellipse([170, 90, 175, 95], fill='blue')    # Right iris
        
        # Eyebrows
        draw.ellipse([118, 80, 137, 85], fill='brown')
        draw.ellipse([163, 80, 182, 85], fill='brown')
        
        # Nose
        draw.ellipse([145, 105, 155, 120], fill='pink')
        
        # Mouth (smiling)
        draw.arc([130, 125, 170, 145], start=0, end=180, fill='red', width=3)
        
        # Body/clothing
        draw.rectangle([125, 150, 175, 300], fill='blue', outline='darkblue')  # Shirt
        
        # Arms
        draw.rectangle([100, 170, 125, 280], fill='peachpuff')  # Left arm
        draw.rectangle([175, 170, 200, 280], fill='peachpuff')  # Right arm
        
        # Add some accessories
        # Necklace
        draw.ellipse([140, 160, 160, 170], outline='gold', width=2)
        
        # Watch on wrist
        draw.rectangle([95, 260, 105, 270], fill='silver', outline='black')
        
        buffer = BytesIO()
        img.save(buffer, format='JPEG')
        img_data = buffer.getvalue()
        return base64.b64encode(img_data).decode('utf-8')

    def test_deep_sentiment_analysis(self):
        """Test the deep sentiment analysis endpoint"""
        test_image = self.create_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        success, result = self.run_test(
            "Deep Sentiment Analysis",
            "POST",
            "analyze/sentiment-deep",
            200,
            data={
                "source": "upload",
                "detection_type": "cloud",
                "image_data": image_data
            }
        )
        
        if success:
            # Check for sentiment_analysis structure in response
            has_sentiment_analysis = 'sentiment_analysis' in result
            has_methodology = False
            has_people = False
            
            if has_sentiment_analysis:
                sentiment_data = result['sentiment_analysis']
                has_methodology = 'methodology' in sentiment_data
                has_people = 'people' in sentiment_data or 'raw_analysis' in sentiment_data
            
            self.log_test("Deep Sentiment Analysis - Response Structure",
                         has_sentiment_analysis and (has_methodology or has_people),
                         f"Sentiment: {has_sentiment_analysis}, Methodology: {has_methodology}, People: {has_people}")
        
        return success

    def test_export_reports(self):
        """Test report export functionality"""
        # Test JSON export
        success_json, _ = self.run_test("Export Report - JSON", "GET", "reports/export?format=json", 200)
        
        # Test CSV export
        success_csv, _ = self.run_test("Export Report - CSV", "GET", "reports/export?format=csv", 200)
        
        return success_json and success_csv

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Backend API Tests for Enhanced Person Analysis System")
        print("=" * 70)
        
        # Test basic connectivity
        self.test_root_endpoint()
        
        # Test alerts functionality
        self.test_alerts_crud()
        
        # Test detections API
        self.test_detections_api()
        
        # Test frame analysis (core functionality)
        self.test_analyze_frame()
        
        # Test emotion and sentiment analysis features
        self.test_emotion_sentiment_analysis()
        
        # Test NEW ENHANCED FEATURES - Ultra-detailed person analysis
        print("\n🔍 Testing Enhanced Person Analysis Features:")
        print("-" * 50)
        self.test_enhanced_person_analysis()
        self.test_prompt_enhancement_validation()
        self.test_api_response_times()
        
        # Test deep sentiment analysis endpoint
        self.test_deep_sentiment_analysis()
        
        # Test export functionality
        self.test_export_reports()
        
        # Print summary
        print("\n" + "=" * 70)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [test for test in self.test_results if not test['success']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"  - {test['test_name']}: {test['details']}")
        else:
            print("\n✅ All tests passed successfully!")
        
        return self.tests_passed == self.tests_run

def main():
    tester = DetectionSystemTester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'success_rate': (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0,
                'timestamp': datetime.now().isoformat()
            },
            'detailed_results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())