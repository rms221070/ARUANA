from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
import io
import cv2
import numpy as np
from PIL import Image
import json
import csv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Google API Key
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', '')

# Models
class DetectedObject(BaseModel):
    label: str
    confidence: float
    bbox: Optional[List[float]] = None

class Detection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source: str  # "webcam" or "upload"
    detection_type: str  # "local" or "cloud"
    objects_detected: List[DetectedObject] = []
    description: str = ""
    image_data: Optional[str] = None  # base64 encoded
    alerts_triggered: List[str] = []

class DetectionCreate(BaseModel):
    source: str
    detection_type: str
    image_data: str

class Alert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    object_name: str
    enabled: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AlertCreate(BaseModel):
    object_name: str
    enabled: bool = True

# Routes
@api_router.get("/")
async def root():
    return {"message": "Sistema de Detecção em Tempo Real"}

@api_router.post("/detect/analyze-frame", response_model=Detection)
async def analyze_frame(input: DetectionCreate):
    """Analisa um frame da webcam ou imagem carregada usando Gemini Vision"""
    try:
        # Decode base64 image
        image_data = input.image_data.split(',')[1] if ',' in input.image_data else input.image_data
        
        # Create detection object
        detection = Detection(
            source=input.source,
            detection_type=input.detection_type,
            image_data=input.image_data
        )
        
        if input.detection_type == "cloud":
            # Use Gemini Vision for detailed analysis
            chat = LlmChat(
                api_key=GOOGLE_API_KEY,
                session_id=f"detection_{detection.id}",
                system_message="You are an expert computer vision system. Analyze images and provide detailed descriptions of people, objects, and environments."
            ).with_model("gemini", "gemini-2.0-flash")
            
            image_content = ImageContent(image_base64=image_data)
            
            prompt = """Analyze this image in detail and provide:
1. List all people detected (description, clothing, actions)
2. List all objects detected (type, location, characteristics)
3. Describe the environment/scene (location type, lighting, atmosphere)
4. Any notable actions or events happening

Provide a comprehensive JSON response with this structure:
{
  "objects": [{"label": "person", "confidence": 0.95, "description": "detailed description"}],
  "description": "overall scene description"
}"""
            
            user_message = UserMessage(
                text=prompt,
                file_contents=[image_content]
            )
            
            response = await chat.send_message(user_message)
            
            # Parse response
            try:
                # Try to extract JSON from response
                response_text = response.strip()
                if '```json' in response_text:
                    response_text = response_text.split('```json')[1].split('```')[0].strip()
                elif '```' in response_text:
                    response_text = response_text.split('```')[1].split('```')[0].strip()
                
                result = json.loads(response_text)
                detection.objects_detected = [
                    DetectedObject(**obj) for obj in result.get('objects', [])
                ]
                detection.description = result.get('description', response)
            except:
                # If JSON parsing fails, use raw response
                detection.description = response
                detection.objects_detected = []
        
        # Check for alerts
        alerts = await db.alerts.find({"enabled": True}, {"_id": 0}).to_list(1000)
        for alert_data in alerts:
            alert = Alert(**alert_data)
            for obj in detection.objects_detected:
                if alert.object_name.lower() in obj.label.lower():
                    detection.alerts_triggered.append(alert.object_name)
        
        # Save to database
        doc = detection.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.detections.insert_one(doc)
        
        return detection
        
    except Exception as e:
        logging.error(f"Error analyzing frame: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/detections", response_model=List[Detection])
async def get_detections(
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0)
):
    """Get detection history"""
    detections = await db.detections.find(
        {}, {"_id": 0}
    ).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    
    for det in detections:
        if isinstance(det['timestamp'], str):
            det['timestamp'] = datetime.fromisoformat(det['timestamp'])
    
    return detections

@api_router.delete("/detections/{detection_id}")
async def delete_detection(detection_id: str):
    """Delete a detection"""
    result = await db.detections.delete_one({"id": detection_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Detection not found")
    return {"message": "Detection deleted"}

@api_router.post("/alerts", response_model=Alert)
async def create_alert(input: AlertCreate):
    """Create a new alert"""
    alert = Alert(**input.model_dump())
    doc = alert.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.alerts.insert_one(doc)
    return alert

@api_router.get("/alerts", response_model=List[Alert])
async def get_alerts():
    """Get all alerts"""
    alerts = await db.alerts.find({}, {"_id": 0}).to_list(1000)
    for alert in alerts:
        if isinstance(alert['created_at'], str):
            alert['created_at'] = datetime.fromisoformat(alert['created_at'])
    return alerts

@api_router.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str):
    """Delete an alert"""
    result = await db.alerts.delete_one({"id": alert_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert deleted"}

@api_router.patch("/alerts/{alert_id}")
async def toggle_alert(alert_id: str, enabled: bool):
    """Toggle alert enabled status"""
    result = await db.alerts.update_one(
        {"id": alert_id},
        {"$set": {"enabled": enabled}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert updated"}

@api_router.get("/reports/export")
async def export_report(format: str = Query("json", regex="^(json|csv)$")):
    """Export detections report"""
    detections = await db.detections.find({}, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    
    if format == "json":
        return detections
    else:  # csv
        output = io.StringIO()
        if detections:
            fieldnames = ['id', 'timestamp', 'source', 'detection_type', 'description']
            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            for det in detections:
                writer.writerow({
                    'id': det.get('id', ''),
                    'timestamp': det.get('timestamp', ''),
                    'source': det.get('source', ''),
                    'detection_type': det.get('detection_type', ''),
                    'description': det.get('description', '')
                })
        
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=detections_report.csv"}
        )

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()