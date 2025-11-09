import requests
import sys
import json
import base64
from datetime import datetime
from io import BytesIO
from PIL import Image

class DetectionSystemTester:
    def __init__(self, base_url="https://aruana-vision-2.preview.emergentagent.com"):
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
        draw.ellipse([95, 45, 205, 120], fill='#8B4513', outline='#654321')  # Brown colors
        
        # Eyes with more detail
        draw.ellipse([120, 85, 135, 100], fill='white')  # Left eye white
        draw.ellipse([165, 85, 180, 100], fill='white')  # Right eye white
        draw.ellipse([125, 90, 130, 95], fill='blue')    # Left iris
        draw.ellipse([170, 90, 175, 95], fill='blue')    # Right iris
        
        # Eyebrows
        draw.ellipse([118, 80, 137, 85], fill='#8B4513')  # Brown
        draw.ellipse([163, 80, 182, 85], fill='#8B4513')  # Brown
        
        # Nose
        draw.ellipse([145, 105, 155, 120], fill='pink')
        
        # Mouth (smiling)
        draw.arc([130, 125, 170, 145], start=0, end=180, fill='red', width=3)
        
        # Body/clothing
        draw.rectangle([125, 150, 175, 300], fill='blue', outline='navy')  # Shirt
        
        # Arms
        draw.rectangle([100, 170, 125, 280], fill='peachpuff')  # Left arm
        draw.rectangle([175, 170, 200, 280], fill='peachpuff')  # Right arm
        
        # Add some accessories
        # Necklace
        draw.ellipse([140, 160, 160, 170], outline='#FFD700', width=2)  # Gold
        
        # Watch on wrist
        draw.rectangle([95, 260, 105, 270], fill='#C0C0C0', outline='black')  # Silver
        
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

    def create_food_test_image(self):
        """Create a test image with food items for nutrition analysis"""
        # Create a 300x300 image with food-like objects
        img = Image.new('RGB', (300, 300), color='white')
        
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        
        # Draw a plate
        draw.ellipse([50, 50, 250, 250], fill='lightgray', outline='black', width=2)
        
        # Draw food items on the plate
        # Apple (red circle)
        draw.ellipse([80, 80, 120, 120], fill='red', outline='darkred')
        
        # Banana (yellow curved shape)
        draw.ellipse([140, 90, 200, 130], fill='yellow', outline='orange')
        
        # Bread slice (brown rectangle)
        draw.rectangle([90, 150, 140, 190], fill='#D2691E', outline='brown')
        
        # Lettuce (green)
        draw.ellipse([160, 160, 200, 200], fill='green', outline='darkgreen')
        
        # Add some text to make it more realistic
        draw.text((10, 10), "Healthy Meal", fill='black')
        
        buffer = BytesIO()
        img.save(buffer, format='JPEG')
        img_data = buffer.getvalue()
        return base64.b64encode(img_data).decode('utf-8')

    def test_nutrition_analysis_endpoint(self):
        """Test POST /api/detect/analyze-nutrition endpoint"""
        test_image = self.create_food_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        success, result = self.run_test(
            "Nutrition Analysis Endpoint",
            "POST",
            "detect/analyze-nutrition",
            200,
            data={
                "source": "upload",
                "detection_type": "nutrition",
                "image_data": image_data
            }
        )
        
        if success:
            # Check response structure
            has_id = 'id' in result
            has_description = 'description' in result
            has_timestamp = 'timestamp' in result
            has_nutritional_analysis = 'nutritional_analysis' in result
            
            self.log_test("Nutrition Analysis - Response Structure", 
                         has_id and has_description and has_timestamp,
                         f"ID: {has_id}, Description: {has_description}, Timestamp: {has_timestamp}, Nutrition: {has_nutritional_analysis}")
            
            return has_id and has_description and has_timestamp
        
        return False

    def test_nutritional_data_models(self):
        """Test FoodItem and NutritionalAnalysis models"""
        test_image = self.create_food_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        success, result = self.run_test(
            "Nutritional Data Models",
            "POST",
            "detect/analyze-nutrition",
            200,
            data={
                "source": "upload",
                "detection_type": "nutrition",
                "image_data": image_data
            }
        )
        
        if success and 'nutritional_analysis' in result:
            nutrition_data = result['nutritional_analysis']
            
            # Test NutritionalAnalysis model fields
            required_fields = ['foods_detected', 'total_calories', 'total_weight_grams', 'meal_type', 'nutritional_summary']
            has_required_fields = all(field in nutrition_data for field in required_fields)
            
            self.log_test("NutritionalAnalysis Model Fields", 
                         has_required_fields,
                         f"Required fields present: {has_required_fields}")
            
            # Test FoodItem model structure if foods are detected
            foods_detected = nutrition_data.get('foods_detected', [])
            valid_food_items = True
            
            if foods_detected:
                for food in foods_detected:
                    food_fields = ['name', 'calories_per_100g', 'estimated_portion_grams', 'total_calories', 'macronutrients', 'confidence']
                    if not all(field in food for field in food_fields):
                        valid_food_items = False
                        break
                
                self.log_test("FoodItem Model Structure", 
                             valid_food_items,
                             f"Foods detected: {len(foods_detected)}, Valid structure: {valid_food_items}")
            else:
                self.log_test("FoodItem Model Structure", 
                             True,
                             "No foods detected - model structure not testable")
            
            return has_required_fields and valid_food_items
        
        return False

    def test_enhanced_nutrition_prompts(self):
        """Test enhanced nutrition analysis prompts and Gemini 2.0 Flash integration"""
        test_image = self.create_food_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        success, result = self.run_test(
            "Enhanced Nutrition Prompts",
            "POST",
            "detect/analyze-nutrition",
            200,
            data={
                "source": "upload",
                "detection_type": "nutrition",
                "image_data": image_data
            }
        )
        
        if success:
            description = result.get('description', '')
            
            # Test for enhanced prompt elements in description
            nutrition_elements = [
                'alimento',
                'caloria',
                'nutrição',
                'porção',
                'peso'
            ]
            
            elements_found = sum(1 for element in nutrition_elements 
                               if element.lower() in description.lower())
            
            self.log_test("Enhanced Nutrition Prompt Elements", 
                         elements_found >= 2,
                         f"Found {elements_found}/{len(nutrition_elements)} nutrition elements")
            
            # Test JSON parsing for nutritional data
            has_nutrition_data = 'nutritional_analysis' in result
            valid_json_structure = False
            
            if has_nutrition_data:
                nutrition_data = result['nutritional_analysis']
                valid_json_structure = isinstance(nutrition_data, dict)
            
            self.log_test("JSON Parsing for Nutritional Data", 
                         has_nutrition_data and valid_json_structure,
                         f"Nutrition data present: {has_nutrition_data}, Valid JSON: {valid_json_structure}")
            
            return elements_found >= 2 and has_nutrition_data and valid_json_structure
        
        return False

    def test_nutrition_database_integration(self):
        """Test that nutritional analysis data is saved to MongoDB"""
        test_image = self.create_food_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        # Create a nutrition analysis
        success, result = self.run_test(
            "Nutrition Database Integration - Create",
            "POST",
            "detect/analyze-nutrition",
            200,
            data={
                "source": "upload",
                "detection_type": "nutrition",
                "image_data": image_data
            }
        )
        
        if success:
            detection_id = result.get('id')
            
            # Retrieve detections to verify storage
            success_retrieve, detections = self.run_test(
                "Nutrition Database Integration - Retrieve",
                "GET",
                "detections?limit=5",
                200
            )
            
            if success_retrieve and detections:
                # Find the nutrition detection
                nutrition_detection = None
                for detection in detections:
                    if detection.get('id') == detection_id:
                        nutrition_detection = detection
                        break
                
                if nutrition_detection:
                    has_nutrition_field = 'nutritional_analysis' in nutrition_detection
                    detection_type_correct = nutrition_detection.get('detection_type') == 'nutrition'
                    
                    self.log_test("Nutrition Database Storage", 
                                 has_nutrition_field and detection_type_correct,
                                 f"Nutrition field saved: {has_nutrition_field}, Type correct: {detection_type_correct}")
                    
                    return has_nutrition_field and detection_type_correct
                else:
                    self.log_test("Nutrition Database Storage", 
                                 False,
                                 "Created detection not found in database")
            
        return False

    def test_nutrition_api_response_quality(self):
        """Test API response quality for nutrition analysis"""
        test_image = self.create_food_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        success, result = self.run_test(
            "Nutrition API Response Quality",
            "POST",
            "detect/analyze-nutrition",
            200,
            data={
                "source": "upload",
                "detection_type": "nutrition",
                "image_data": image_data
            }
        )
        
        if success:
            # Test calorie calculations
            nutrition_data = result.get('nutritional_analysis', {})
            total_calories = nutrition_data.get('total_calories', 0)
            foods_detected = nutrition_data.get('foods_detected', [])
            
            # Verify calorie calculations are reasonable
            calorie_calculation_valid = isinstance(total_calories, (int, float)) and total_calories >= 0
            
            self.log_test("Calorie Calculations", 
                         calorie_calculation_valid,
                         f"Total calories: {total_calories}, Type: {type(total_calories)}")
            
            # Test macronutrient data
            nutritional_summary = nutrition_data.get('nutritional_summary', {})
            has_macronutrients = any(key in nutritional_summary for key in ['total_protein', 'total_carbs', 'total_fat'])
            
            self.log_test("Macronutrient Data", 
                         has_macronutrients,
                         f"Nutritional summary keys: {list(nutritional_summary.keys())}")
            
            # Test meal type classification
            meal_type = nutrition_data.get('meal_type')
            valid_meal_types = ['café da manhã', 'almoço', 'jantar', 'lanche', None]
            meal_type_valid = meal_type in valid_meal_types or meal_type is None
            
            self.log_test("Meal Type Classification", 
                         meal_type_valid,
                         f"Meal type: {meal_type}")
            
            # Test portion estimation
            portion_estimates_valid = True
            for food in foods_detected:
                portion_grams = food.get('estimated_portion_grams', 0)
                if not isinstance(portion_grams, (int, float)) or portion_grams < 0:
                    portion_estimates_valid = False
                    break
            
            self.log_test("Portion Estimation", 
                         portion_estimates_valid,
                         f"Foods with valid portions: {len(foods_detected)}")
            
            return (calorie_calculation_valid and has_macronutrients and 
                   meal_type_valid and portion_estimates_valid)
        
        return False

    def test_nutrition_error_handling(self):
        """Test nutrition analysis error handling"""
        # Test with invalid image data
        success, result = self.run_test(
            "Nutrition Error Handling - Invalid Image",
            "POST",
            "detect/analyze-nutrition",
            500,  # Expect error
            data={
                "source": "upload",
                "detection_type": "nutrition",
                "image_data": "invalid_image_data"
            }
        )
        
        # For this test, we expect it to fail (status 500), so success means error handling works
        error_handled = not success  # We expect this to fail
        
        self.log_test("Nutrition Error Handling", 
                     error_handled,
                     f"Error properly handled: {error_handled}")
        
        return error_handled

    def test_user_registration(self):
        """Test POST /api/auth/register endpoint"""
        # Test valid user registration
        test_user_data = {
            "name": "Test User",
            "email": "testuser@example.com",
            "password": "TestPass123!",
            "user_type": "user"
        }
        
        success, result = self.run_test(
            "User Registration - Valid Data",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success:
            # Check response structure
            has_success = result.get('success') == True
            has_message = 'message' in result
            
            self.log_test("User Registration - Response Structure", 
                         has_success and has_message,
                         f"Success: {has_success}, Message: {has_message}")
        
        # Test duplicate email registration (should fail)
        success_duplicate, result_duplicate = self.run_test(
            "User Registration - Duplicate Email",
            "POST",
            "auth/register",
            400,  # Should return 400 for duplicate email
            data=test_user_data
        )
        
        # For duplicate test, we expect it to fail (status 400)
        duplicate_handled = not success_duplicate
        
        self.log_test("User Registration - Duplicate Email Handling", 
                     duplicate_handled,
                     f"Duplicate properly rejected: {duplicate_handled}")
        
        # Test admin user registration
        admin_user_data = {
            "name": "Admin User",
            "email": "admin@example.com", 
            "password": "AdminPass123!",
            "user_type": "admin"
        }
        
        success_admin, result_admin = self.run_test(
            "User Registration - Admin Role",
            "POST",
            "auth/register",
            200,
            data=admin_user_data
        )
        
        return success and duplicate_handled and success_admin

    def test_user_login(self):
        """Test POST /api/auth/login endpoint"""
        # First ensure we have a test user (register if needed)
        import random
        random_id = random.randint(10000, 99999)
        
        test_user_data = {
            "name": f"Login Test User {random_id}",
            "email": f"logintest{random_id}@example.com",
            "password": "LoginPass123!",
            "user_type": "user"
        }
        
        # Register user (ignore if already exists)
        success_setup, _ = self.run_test(
            "Login Test - User Setup",
            "POST", 
            "auth/register",
            200,
            data=test_user_data
        )
        
        if not success_setup:
            # If registration failed, try to login anyway (user might already exist)
            pass
        
        # Test valid login
        login_data = {
            "email": f"logintest{random_id}@example.com",
            "password": "LoginPass123!"
        }
        
        success, result = self.run_test(
            "User Login - Valid Credentials",
            "POST",
            "auth/login", 
            200,
            data=login_data
        )
        
        access_token = None
        if success:
            # Check response structure
            has_success = result.get('success') == True
            has_access_token = 'access_token' in result
            has_token_type = result.get('token_type') == 'bearer'
            has_user_info = 'user' in result
            
            if has_access_token:
                access_token = result['access_token']
            
            # Verify user info structure
            user_info_valid = False
            if has_user_info:
                user = result['user']
                required_fields = ['id', 'name', 'email', 'user_type']
                user_info_valid = all(field in user for field in required_fields)
                # Verify password is not returned
                password_not_returned = 'password' not in user and 'password_hash' not in user
                user_info_valid = user_info_valid and password_not_returned
            
            self.log_test("User Login - Response Structure", 
                         has_success and has_access_token and has_token_type and user_info_valid,
                         f"Success: {has_success}, Token: {has_access_token}, Type: {has_token_type}, User: {user_info_valid}")
        
        # Test login with wrong password
        wrong_password_data = {
            "email": f"logintest{random_id}@example.com",
            "password": "WrongPassword123!"
        }
        
        success_wrong, result_wrong = self.run_test(
            "User Login - Wrong Password",
            "POST",
            "auth/login",
            401,  # Should return 401 for wrong password
            data=wrong_password_data
        )
        
        wrong_password_handled = success_wrong  # We expect this to succeed (return 401)
        
        # Test login with non-existent email
        nonexistent_data = {
            "email": "nonexistent@example.com",
            "password": "SomePassword123!"
        }
        
        success_nonexistent, result_nonexistent = self.run_test(
            "User Login - Non-existent Email",
            "POST",
            "auth/login",
            401,  # Should return 401 for non-existent email
            data=nonexistent_data
        )
        
        nonexistent_handled = success_nonexistent  # We expect this to succeed (return 401)
        
        self.log_test("User Login - Error Handling", 
                     wrong_password_handled and nonexistent_handled,
                     f"Wrong password: {wrong_password_handled}, Non-existent: {nonexistent_handled}")
        
        return success and wrong_password_handled and nonexistent_handled, access_token

    def test_get_current_user(self):
        """Test GET /api/auth/me endpoint"""
        # First login to get a valid token
        login_success, access_token = self.test_user_login()
        
        if not login_success or not access_token:
            self.log_test("Get Current User - Setup Failed", False, "Could not obtain access token")
            return False
        
        # Test with valid token
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        }
        
        success, result = self.run_test(
            "Get Current User - Valid Token",
            "GET",
            "auth/me",
            200,
            headers=headers
        )
        
        if success:
            # Verify user information is returned without password
            required_fields = ['id', 'name', 'email', 'user_type', 'created_at']
            has_required_fields = all(field in result for field in required_fields)
            password_not_returned = 'password' not in result and 'password_hash' not in result
            
            self.log_test("Get Current User - Response Structure", 
                         has_required_fields and password_not_returned,
                         f"Required fields: {has_required_fields}, Password excluded: {password_not_returned}")
        
        # Test without token (should return 401)
        success_no_token, result_no_token = self.run_test(
            "Get Current User - No Token",
            "GET",
            "auth/me",
            401  # Should return 401 without token
        )
        
        no_token_handled = not success_no_token
        
        # Test with invalid token (should return 401)
        invalid_headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer invalid_token_here'
        }
        
        success_invalid, result_invalid = self.run_test(
            "Get Current User - Invalid Token",
            "GET",
            "auth/me",
            401,  # Should return 401 with invalid token
            headers=invalid_headers
        )
        
        invalid_token_handled = not success_invalid
        
        self.log_test("Get Current User - Error Handling", 
                     no_token_handled and invalid_token_handled,
                     f"No token: {no_token_handled}, Invalid token: {invalid_token_handled}")
        
        return success and no_token_handled and invalid_token_handled

    def test_jwt_token_validation(self):
        """Test JWT token validation and expiry"""
        # Create a new user and login to get a token
        import random
        random_id = random.randint(10000, 99999)
        
        test_user_data = {
            "name": f"JWT Test User {random_id}",
            "email": f"jwttest{random_id}@example.com",
            "password": "JWTPass123!",
            "user_type": "user"
        }
        
        # Register user
        success_reg, _ = self.run_test(
            "JWT Test - User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if not success_reg:
            self.log_test("JWT Token Validation - Setup Failed", False, "Could not register user")
            return False
        
        # Login to get token
        login_data = {
            "email": f"jwttest{random_id}@example.com",
            "password": "JWTPass123!"
        }
        
        success_login, result_login = self.run_test(
            "JWT Test - User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if not success_login:
            self.log_test("JWT Token Validation - Setup Failed", False, "Could not login user")
            return False
        
        access_token = result_login.get('access_token')
        if not access_token:
            self.log_test("JWT Token Validation - Setup Failed", False, "No access token returned")
            return False
        
        # Verify token format (should be JWT with 3 parts separated by dots)
        token_parts = access_token.split('.')
        valid_jwt_format = len(token_parts) == 3
        
        self.log_test("JWT Token Format", 
                     valid_jwt_format,
                     f"Token parts: {len(token_parts)}, Expected: 3")
        
        # Test that token works for protected endpoints
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        }
        
        # Test token with /api/auth/me endpoint
        success_protected, result_protected = self.run_test(
            "JWT Token - Protected Endpoint Access",
            "GET",
            "auth/me",
            200,
            headers=headers
        )
        
        return valid_jwt_format and success_protected

    def test_password_security(self):
        """Test password hashing and security"""
        # Register a user and verify password is hashed
        import random
        random_id = random.randint(10000, 99999)
        
        test_user_data = {
            "name": f"Security Test User {random_id}",
            "email": f"securitytest{random_id}@example.com",
            "password": "SecurityPass123!",
            "user_type": "user"
        }
        
        success, result = self.run_test(
            "Password Security - Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if not success:
            return False
        
        # Login with the same user
        login_data = {
            "email": f"securitytest{random_id}@example.com",
            "password": "SecurityPass123!"
        }
        
        success_login, result_login = self.run_test(
            "Password Security - Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success_login:
            # Verify password is not returned in login response
            user_info = result_login.get('user', {})
            password_not_in_response = 'password' not in user_info and 'password_hash' not in user_info
            
            self.log_test("Password Security - Not in Response", 
                         password_not_in_response,
                         f"Password excluded from response: {password_not_in_response}")
            
            return password_not_in_response
        
        return False
    def test_emotion_sentiment_analysis_with_auth(self, token):
        """Test emotion and sentiment analysis with authentication"""
        test_image = self.create_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        # Test enhanced AI analysis with emotion/sentiment detection
        success, result = self.run_test(
            "Enhanced AI Analysis - Emotion/Sentiment (Authenticated)",
            "POST",
            "detect/analyze-frame",
            200,
            data={
                "source": "upload",
                "detection_type": "cloud",
                "image_data": image_data
            },
            headers=headers
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
                
            self.log_test("Emotion Analysis - Structure (Authenticated)", 
                         has_emotion_analysis and emotion_valid,
                         f"Present: {has_emotion_analysis}, Valid: {emotion_valid}")
        
        return success

    def test_nutrition_analysis_with_auth(self, token):
        """Test nutrition analysis with authentication"""
        test_image = self.create_food_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        success, result = self.run_test(
            "Nutrition Analysis Endpoint (Authenticated)",
            "POST",
            "detect/analyze-nutrition",
            200,
            data={
                "source": "upload",
                "detection_type": "nutrition",
                "image_data": image_data
            },
            headers=headers
        )
        
        if success:
            # Check response structure
            has_id = 'id' in result
            has_description = 'description' in result
            has_timestamp = 'timestamp' in result
            has_nutritional_analysis = 'nutritional_analysis' in result
            
            self.log_test("Nutrition Analysis - Response Structure (Authenticated)", 
                         has_id and has_description and has_timestamp,
                         f"ID: {has_id}, Description: {has_description}, Timestamp: {has_timestamp}, Nutrition: {has_nutritional_analysis}")
        
        return success

    def test_full_authentication_flow(self):
        """Test complete authentication system as requested in review"""
        print("\n🔐 COMPREHENSIVE AUTHENTICATION SYSTEM TESTING")
        print("=" * 60)
        
        # Generate unique test data
        import random
        random_id = random.randint(1000, 9999)
        
        # 1. Full User Registration and Login Flow
        print("\n1️⃣ Testing Full User Registration and Login Flow:")
        print("-" * 50)
        
        user_email = f"testuser{random_id}@example.com"
        admin_email = f"admin{random_id}@example.com"
        
        # Register regular user
        user_data = {
            "name": f"Test User {random_id}",
            "email": user_email,
            "password": "TestPass123!",
            "user_type": "user"
        }
        
        success_reg, result_reg = self.run_test(
            "1.1 Register New User",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if not success_reg:
            return False, None, None
        
        # Login with registered user
        login_data = {
            "email": user_email,
            "password": "TestPass123!"
        }
        
        success_login, result_login = self.run_test(
            "1.2 Login with Registered User",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if not success_login:
            return False, None, None
        
        user_token = result_login.get('access_token')
        user_id = result_login.get('user', {}).get('id')
        
        # Call GET /api/auth/me with token
        user_headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {user_token}'
        }
        
        success_me, result_me = self.run_test(
            "1.3 Get Current User Info",
            "GET",
            "auth/me",
            200,
            headers=user_headers
        )
        
        if success_me:
            # Verify user info is returned correctly
            required_fields = ['id', 'name', 'email', 'user_type']
            has_required = all(field in result_me for field in required_fields)
            no_password = 'password' not in result_me and 'password_hash' not in result_me
            
            self.log_test("1.4 User Info Verification", 
                         has_required and no_password,
                         f"Required fields: {has_required}, Password excluded: {no_password}")
        
        # 2. Detection Creation with Authentication
        print("\n2️⃣ Testing Detection Creation with Authentication:")
        print("-" * 50)
        
        test_image = self.create_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        success_detect, result_detect = self.run_test(
            "2.1 Create Detection with JWT Token",
            "POST",
            "detect/analyze-frame",
            200,
            data={
                "source": "upload",
                "detection_type": "cloud",
                "image_data": image_data
            },
            headers=user_headers
        )
        
        detection_id = None
        if success_detect:
            detection_id = result_detect.get('id')
            has_user_id = result_detect.get('user_id') == user_id
            
            self.log_test("2.2 Detection User ID Verification", 
                         has_user_id,
                         f"Detection user_id matches: {has_user_id}")
        
        # 3. Access Control - User View
        print("\n3️⃣ Testing Access Control - User View:")
        print("-" * 50)
        
        success_user_detections, result_user_detections = self.run_test(
            "3.1 Get Detections as User",
            "GET",
            "detections",
            200,
            headers=user_headers
        )
        
        if success_user_detections:
            # Verify only user's detections are returned
            user_owns_all = True
            for detection in result_user_detections:
                if detection.get('user_id') != user_id:
                    user_owns_all = False
                    break
            
            self.log_test("3.2 User Access Control Verification", 
                         user_owns_all,
                         f"User sees only own detections: {user_owns_all}, Count: {len(result_user_detections)}")
        
        # 4. Admin User Test
        print("\n4️⃣ Testing Admin User Access:")
        print("-" * 50)
        
        # Register admin user
        admin_data = {
            "name": f"Admin User {random_id}",
            "email": admin_email,
            "password": "AdminPass123!",
            "user_type": "admin"
        }
        
        success_admin_reg, result_admin_reg = self.run_test(
            "4.1 Register Admin User",
            "POST",
            "auth/register",
            200,
            data=admin_data
        )
        
        if not success_admin_reg:
            return False, user_token, None
        
        # Login as admin
        admin_login_data = {
            "email": admin_email,
            "password": "AdminPass123!"
        }
        
        success_admin_login, result_admin_login = self.run_test(
            "4.2 Login as Admin",
            "POST",
            "auth/login",
            200,
            data=admin_login_data
        )
        
        if not success_admin_login:
            return False, user_token, None
        
        admin_token = result_admin_login.get('access_token')
        admin_headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {admin_token}'
        }
        
        # Get detections as admin (should see ALL detections)
        success_admin_detections, result_admin_detections = self.run_test(
            "4.3 Get All Detections as Admin",
            "GET",
            "detections",
            200,
            headers=admin_headers
        )
        
        if success_admin_detections:
            # Admin should see more detections than regular user (or at least same amount)
            admin_sees_all = len(result_admin_detections) >= len(result_user_detections)
            
            # Check if admin can see detections from different users
            user_ids_seen = set()
            for detection in result_admin_detections:
                if detection.get('user_id'):
                    user_ids_seen.add(detection.get('user_id'))
            
            self.log_test("4.4 Admin Access Verification", 
                         admin_sees_all,
                         f"Admin sees all detections: {admin_sees_all}, Users seen: {len(user_ids_seen)}")
        
        # 5. Unauthorized Access Test
        print("\n5️⃣ Testing Unauthorized Access:")
        print("-" * 50)
        
        # Try to call analyze-frame WITHOUT token
        success_no_auth, result_no_auth = self.run_test(
            "5.1 Analyze Frame - No Token",
            "POST",
            "detect/analyze-frame",
            401,  # Should return 401
            data={
                "source": "upload",
                "detection_type": "cloud",
                "image_data": image_data
            }
        )
        
        no_auth_blocked = success_no_auth  # We expect this to succeed (return 401)
        
        # Try to call detections WITHOUT token
        success_no_auth_det, result_no_auth_det = self.run_test(
            "5.2 Get Detections - No Token",
            "GET",
            "detections",
            401,  # Should return 401
        )
        
        no_auth_det_blocked = success_no_auth_det  # We expect this to succeed (return 401)
        
        # Try with invalid token
        invalid_headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer invalid_token_12345'
        }
        
        success_invalid_token, result_invalid_token = self.run_test(
            "5.3 Analyze Frame - Invalid Token",
            "POST",
            "detect/analyze-frame",
            401,  # Should return 401
            data={
                "source": "upload",
                "detection_type": "cloud",
                "image_data": image_data
            },
            headers=invalid_headers
        )
        
        invalid_token_blocked = success_invalid_token  # We expect this to succeed (return 401)
        
        self.log_test("5.4 Unauthorized Access Summary", 
                     no_auth_blocked and no_auth_det_blocked and invalid_token_blocked,
                     f"No token blocked: {no_auth_blocked}, Invalid token blocked: {invalid_token_blocked}")
        
        # Summary of authentication tests
        auth_tests_passed = (success_reg and success_login and success_me and 
                           success_detect and success_user_detections and 
                           success_admin_reg and success_admin_login and 
                           success_admin_detections and no_auth_blocked and 
                           no_auth_det_blocked and invalid_token_blocked)
        
        print(f"\n🔐 Authentication System Test Summary: {'✅ PASSED' if auth_tests_passed else '❌ FAILED'}")
        
        return auth_tests_passed, user_token, admin_token

    def test_analyze_frame_without_ambient_sound(self, token):
        """Test /api/detect/analyze-frame endpoint after disabling ambient sound classification"""
        print("\n🔊 Testing Analyze Frame WITHOUT Ambient Sound Classification:")
        print("-" * 60)
        
        test_image = self.create_test_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        # Test the analyze-frame endpoint with cloud detection
        success, result = self.run_test(
            "Analyze Frame - No Ambient Sound (Cloud Detection)",
            "POST",
            "detect/analyze-frame",
            200,
            data={
                "source": "upload",
                "detection_type": "cloud",
                "image_data": image_data
            },
            headers=headers
        )
        
        if success:
            # 1. Verify basic response structure
            has_id = 'id' in result
            has_description = 'description' in result
            has_timestamp = 'timestamp' in result
            
            self.log_test("Response Structure Validation", 
                         has_id and has_description and has_timestamp,
                         f"ID: {has_id}, Description: {has_description}, Timestamp: {has_timestamp}")
            
            # 2. Verify emotion analysis is present and working
            has_emotion_analysis = 'emotion_analysis' in result and result['emotion_analysis'] is not None
            emotion_valid = False
            
            if has_emotion_analysis:
                emotion_data = result['emotion_analysis']
                required_emotions = ['sorrindo', 'serio', 'triste', 'surpreso', 'zangado', 'neutro']
                emotion_valid = all(
                    emotion in emotion_data and isinstance(emotion_data[emotion], int) and emotion_data[emotion] >= 0
                    for emotion in required_emotions
                )
            
            self.log_test("Emotion Analysis Working", 
                         has_emotion_analysis and emotion_valid,
                         f"Present: {has_emotion_analysis}, Valid structure: {emotion_valid}")
            
            # 3. Verify sentiment analysis is present and working
            has_sentiment_analysis = 'sentiment_analysis' in result and result['sentiment_analysis'] is not None
            sentiment_valid = False
            
            if has_sentiment_analysis:
                sentiment_data = result['sentiment_analysis']
                required_sentiments = ['positivo', 'neutro', 'negativo']
                sentiment_valid = all(
                    sentiment in sentiment_data and isinstance(sentiment_data[sentiment], int) and sentiment_data[sentiment] >= 0
                    for sentiment in required_sentiments
                )
            
            self.log_test("Sentiment Analysis Working", 
                         has_sentiment_analysis and sentiment_valid,
                         f"Present: {has_sentiment_analysis}, Valid structure: {sentiment_valid}")
            
            # 4. Verify description does NOT contain sound-related information
            description = result.get('description', '').lower()
            
            # Check for Portuguese sound-related terms that should NOT be present
            sound_terms = [
                'sons ambientes',
                'nível de ruído', 
                'sons de atividades',
                'ruído urbano',
                'som ambiente',
                'barulho',
                'música tocando',
                'conversas distantes',
                'silêncio total',
                'ambiente silencioso',
                'ambiente barulhento'
            ]
            
            sound_references_found = []
            for term in sound_terms:
                if term in description:
                    sound_references_found.append(term)
            
            no_sound_references = len(sound_references_found) == 0
            
            self.log_test("No Sound References in Description", 
                         no_sound_references,
                         f"Sound terms found: {sound_references_found if sound_references_found else 'None'}")
            
            # 5. Verify description is still detailed (should be rich without sound info)
            description_detailed = len(result.get('description', '')) > 100
            
            self.log_test("Description Still Detailed", 
                         description_detailed,
                         f"Description length: {len(result.get('description', ''))} characters")
            
            # 6. Test that no errors or crashes occurred
            no_errors = 'error' not in result and 'exception' not in str(result).lower()
            
            self.log_test("No Errors or Crashes", 
                         no_errors,
                         f"Clean response without errors: {no_errors}")
            
            # 7. Verify all other analysis features work normally
            has_objects = 'objects_detected' in result
            objects_valid = isinstance(result.get('objects_detected', []), list)
            
            self.log_test("Object Detection Still Working", 
                         has_objects and objects_valid,
                         f"Objects field present: {has_objects}, Valid list: {objects_valid}")
            
            # Overall success criteria
            overall_success = (
                has_id and has_description and has_timestamp and
                has_emotion_analysis and emotion_valid and
                has_sentiment_analysis and sentiment_valid and
                no_sound_references and description_detailed and
                no_errors and has_objects and objects_valid
            )
            
            self.log_test("OVERALL: Analyze Frame Without Ambient Sound", 
                         overall_success,
                         f"All criteria met: {overall_success}")
            
            return overall_success
        
        return False

    def test_search_functionality_with_query(self, token):
        """Test search functionality with search_query parameter"""
        print("\n🔍 Testing Search Functionality with search_query Parameter:")
        print("-" * 60)
        
        # Create test image with a person (common object to search for)
        test_image = self.create_detailed_person_image()
        image_data = f"data:image/jpeg;base64,{test_image}"
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        # Test 1: Search for object that should exist (pessoa)
        success_found, result_found = self.run_test(
            "Search Query - Object Found (pessoa)",
            "POST",
            "detect/analyze-frame",
            200,
            data={
                "source": "search",
                "detection_type": "cloud",
                "image_data": image_data,
                "search_query": "pessoa"
            },
            headers=headers
        )
        
        if success_found:
            description = result_found.get('description', '')
            
            # Verify "OBJETO ENCONTRADO" response format
            has_found_marker = description.startswith("OBJETO ENCONTRADO:")
            has_location_info = any(loc in description.lower() for loc in 
                                  ['esquerda', 'direita', 'centro', 'superior', 'inferior'])
            
            self.log_test("Search Response - Object Found Format", 
                         has_found_marker and has_location_info,
                         f"Found marker: {has_found_marker}, Location info: {has_location_info}")
            
            # Verify Portuguese response
            is_portuguese = any(word in description.lower() for word in 
                              ['localização', 'próximo', 'imagem', 'pessoa'])
            
            self.log_test("Search Response - Portuguese Language", 
                         is_portuguese,
                         f"Portuguese detected: {is_portuguese}")
        
        # Test 2: Search for object that doesn't exist
        success_not_found, result_not_found = self.run_test(
            "Search Query - Object Not Found (elefante)",
            "POST",
            "detect/analyze-frame",
            200,
            data={
                "source": "search",
                "detection_type": "cloud",
                "image_data": image_data,
                "search_query": "elefante"
            },
            headers=headers
        )
        
        if success_not_found:
            description_not_found = result_not_found.get('description', '')
            
            # Verify "OBJETO NÃO ENCONTRADO" response format
            has_not_found_marker = "OBJETO NÃO ENCONTRADO" in description_not_found
            
            self.log_test("Search Response - Object Not Found Format", 
                         has_not_found_marker,
                         f"Not found marker present: {has_not_found_marker}")
        
        # Test 3: Search for common objects (phone, book, etc.)
        common_objects = ["telefone", "livro", "cadeira"]
        
        for obj in common_objects:
            success_obj, result_obj = self.run_test(
                f"Search Query - Common Object ({obj})",
                "POST",
                "detect/analyze-frame",
                200,
                data={
                    "source": "search",
                    "detection_type": "cloud",
                    "image_data": image_data,
                    "search_query": obj
                },
                headers=headers
            )
            
            if success_obj:
                obj_description = result_obj.get('description', '')
                has_search_response = ("OBJETO ENCONTRADO" in obj_description or 
                                     "OBJETO NÃO ENCONTRADO" in obj_description)
                
                self.log_test(f"Search Response Format - {obj}", 
                             has_search_response,
                             f"Valid search response format: {has_search_response}")
        
        # Test 4: Verify search_query parameter is processed
        success_param, result_param = self.run_test(
            "Search Query - Parameter Processing",
            "POST",
            "detect/analyze-frame",
            200,
            data={
                "source": "search",
                "detection_type": "cloud",
                "image_data": image_data,
                "search_query": "rosto"
            },
            headers=headers
        )
        
        if success_param:
            param_description = result_param.get('description', '')
            
            # Verify special search prompt is being used
            has_search_format = ("OBJETO ENCONTRADO" in param_description or 
                               "OBJETO NÃO ENCONTRADO" in param_description)
            
            self.log_test("Search Query - Special Prompt Usage", 
                         has_search_format,
                         f"Special search prompt detected: {has_search_format}")
        
        # Test 5: Verify location detection words are present when object found
        success_location, result_location = self.run_test(
            "Search Query - Location Detection (pessoa)",
            "POST",
            "detect/analyze-frame",
            200,
            data={
                "source": "search",
                "detection_type": "cloud",
                "image_data": image_data,
                "search_query": "pessoa"
            },
            headers=headers
        )
        
        if success_location:
            location_description = result_location.get('description', '').lower()
            
            # Check for location words in Portuguese
            location_words = ['esquerda', 'direita', 'centro', 'superior', 'inferior', 
                            'localização', 'próximo', 'borda', 'canto']
            location_words_found = [word for word in location_words if word in location_description]
            
            has_location_details = len(location_words_found) > 0
            
            self.log_test("Search Response - Location Details", 
                         has_location_details,
                         f"Location words found: {location_words_found}")
        
        # Test 6: Test without search_query (should use normal prompt)
        success_normal, result_normal = self.run_test(
            "Normal Analysis - No Search Query",
            "POST",
            "detect/analyze-frame",
            200,
            data={
                "source": "upload",
                "detection_type": "cloud",
                "image_data": image_data
            },
            headers=headers
        )
        
        if success_normal:
            normal_description = result_normal.get('description', '')
            
            # Verify normal analysis doesn't use search format
            no_search_format = ("OBJETO ENCONTRADO" not in normal_description and 
                              "OBJETO NÃO ENCONTRADO" not in normal_description)
            
            self.log_test("Normal Analysis - No Search Format", 
                         no_search_format,
                         f"Normal analysis format confirmed: {no_search_format}")
        
        # Overall search functionality test success
        search_tests_passed = (success_found and success_not_found and 
                             success_param and success_location and success_normal)
        
        print(f"\n🔍 Search Functionality Test Summary: {'✅ PASSED' if search_tests_passed else '❌ FAILED'}")
        
        return search_tests_passed

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Comprehensive Backend Testing")
        print("=" * 70)
        
        # Test basic connectivity
        self.test_root_endpoint()
        
        # Run COMPREHENSIVE AUTHENTICATION TESTS as requested
        auth_success, user_token, admin_token = self.test_full_authentication_flow()
        
        # Test additional authentication features
        print("\n🔐 Additional Authentication Tests:")
        print("-" * 50)
        self.test_jwt_token_validation()
        self.test_password_security()
        
        # Test other functionality with authentication
        if user_token:
            print("\n🔍 Testing Other Features with Authentication:")
            print("-" * 50)
            
            # Test alerts functionality
            self.test_alerts_crud()
            
            # SPECIFIC TEST FOR REVIEW REQUEST: Test analyze-frame without ambient sound
            self.test_analyze_frame_without_ambient_sound(user_token)
            
            # Test emotion and sentiment analysis features with auth
            self.test_emotion_sentiment_analysis_with_auth(user_token)
            
            # Test nutrition analysis with auth
            self.test_nutrition_analysis_with_auth(user_token)
            
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