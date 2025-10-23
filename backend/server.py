from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
import base64
import hashlib
import secrets
import jwt
from passlib.context import CryptContext
from datetime import timedelta
from functools import wraps
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

# Authentication settings
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Authentication utilities
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return user_id
    except jwt.PyJWTError:
        return None

# Authentication middleware
def get_current_user(authorization: str = None):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.split("Bearer ")[1]
    user_id = verify_token(token)
    return user_id

def require_auth(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # Get request from args/kwargs (FastAPI dependency injection handles this)
        request = kwargs.get('request') or (args[0] if args else None)
        
        if not request:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        auth_header = request.headers.get("Authorization")
        user_id = get_current_user(auth_header)
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        # Add user_id to kwargs
        kwargs['current_user_id'] = user_id
        return await func(*args, **kwargs)
    
    return wrapper

def require_admin(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        request = kwargs.get('request') or (args[0] if args else None)
        
        if not request:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        auth_header = request.headers.get("Authorization")
        user_id = get_current_user(auth_header)
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        # Check if user is admin
        user = await db.users.find_one({"id": user_id})
        if not user or user.get("user_type") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        kwargs['current_user_id'] = user_id
        return await func(*args, **kwargs)
    
    return wrapper

# Models
class EmotionAnalysis(BaseModel):
    sorrindo: int = 0
    serio: int = 0
    triste: int = 0
    surpreso: int = 0
    zangado: int = 0
    neutro: int = 0

class SentimentAnalysis(BaseModel):
    positivo: int = 0
    neutro: int = 0
    negativo: int = 0

class FoodItem(BaseModel):
    name: str
    scientific_name: Optional[str] = None
    preparation_method: Optional[str] = None
    calories_per_100g: float
    estimated_portion_grams: float
    total_calories: float
    macronutrients: Dict[str, float] = Field(default_factory=dict)  # protein, carbs, fat, fiber
    detailed_fats: Dict[str, float] = Field(default_factory=dict)  # saturated, monounsaturated, polyunsaturated, trans
    carb_types: Dict[str, float] = Field(default_factory=dict)  # simple, complex
    glycemic_index: Optional[int] = None
    micronutrients: Dict[str, float] = Field(default_factory=dict)  # vitamins and minerals
    confidence: float = 0.0

class NutritionalAnalysis(BaseModel):
    foods_detected: List[FoodItem] = []
    total_calories: float = 0.0
    total_weight_grams: float = 0.0
    meal_type: Optional[str] = None
    nutritional_summary: Dict[str, float] = Field(default_factory=dict)
    # PhD-level additions
    quality_score: Optional[int] = None  # 0-100
    nutritional_balance: Dict[str, float] = Field(default_factory=dict)  # % protein, % carbs, % fat
    glycemic_load: Optional[float] = None
    nutritional_quality_index: Optional[float] = None
    health_recommendations: List[str] = []
    positive_aspects: List[str] = []
    improvement_areas: List[str] = []
    health_alerts: List[str] = []
    dietary_compatibility: Dict[str, bool] = Field(default_factory=dict)  # vegetarian, low-carb, etc
    ideal_consumption_time: Optional[str] = None
    dri_adequacy: Dict[str, float] = Field(default_factory=dict)  # % of daily recommended intake

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    password_hash: str
    user_type: str = "user"  # "user" or "admin"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None
    is_active: bool = True
    # Profile fields
    profile_photo: Optional[str] = None  # base64 encoded image
    bio: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[str] = None
    reset_token: Optional[str] = None
    reset_token_expiry: Optional[datetime] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    user_type: str = "user"

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[str] = None
    profile_photo: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: str

class PasswordReset(BaseModel):
    token: str
    new_password: str

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
    emotion_analysis: Optional[EmotionAnalysis] = None
    sentiment_analysis: Optional[SentimentAnalysis] = None
    nutritional_analysis: Optional[NutritionalAnalysis] = None
    user_id: Optional[str] = None  # ID of the user who created this detection

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

class ScientificRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    record_type: str  # "atividade", "trabalho", "artigo", "tcc"
    title: str
    authors: List[str] = []
    description: str
    keywords: List[str] = []
    research_line: str  # 1, 2, 3, ou 4
    status: str = "em_andamento"  # em_andamento, concluído, publicado
    date: str
    attachments: List[str] = []
    metadata: dict = {}

class ScientificRecordCreate(BaseModel):
    record_type: str
    title: str
    authors: List[str]
    description: str
    keywords: List[str]
    research_line: str
    status: str = "em_andamento"
    date: str
    attachments: List[str] = []
    metadata: dict = {}

class ReportQuery(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    report_type: str = "general"  # general, emotions, objects, scientific

class ResearcherProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    name: str
    institution: str
    area: str
    bio: str
    research_interests: List[str] = []
    contact_email: str
    avatar_url: Optional[str] = None

class ResearcherProfileCreate(BaseModel):
    name: str
    institution: str
    area: str
    bio: str
    research_interests: List[str]
    contact_email: str
    avatar_url: Optional[str] = None

class Post(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    author_id: str
    author_name: str
    content: str
    tags: List[str] = []
    likes: int = 0
    comments_count: int = 0

class PostCreate(BaseModel):
    author_id: str
    author_name: str
    content: str
    tags: List[str] = []

class Comment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    post_id: str
    author_id: str
    author_name: str
    content: str

class CommentCreate(BaseModel):
    post_id: str
    author_id: str
    author_name: str
    content: str

# Routes
@api_router.get("/")
async def root():
    return {"message": "Sistema de Detecção em Tempo Real"}

@api_router.post("/detect/analyze-frame", response_model=Detection)
async def analyze_frame(input: DetectionCreate, request: Request):
    """Analisa um frame da webcam ou imagem carregada usando Gemini Vision"""
    try:
        # Get authenticated user
        auth_header = request.headers.get("Authorization")
        user_id = get_current_user(auth_header)
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # Decode base64 image
        image_data = input.image_data.split(',')[1] if ',' in input.image_data else input.image_data
        
        # Create detection object with user_id
        detection = Detection(
            source=input.source,
            detection_type=input.detection_type,
            image_data=input.image_data,
            user_id=user_id
        )
        
        if input.detection_type == "cloud":
            # Use Gemini Vision for detailed analysis with sentiment
            chat = LlmChat(
                api_key=GOOGLE_API_KEY,
                session_id=f"detection_{detection.id}",
                system_message="🇧🇷 Você é um sistema especialista em visão computacional e análise de emoções BRASILEIRO. RESPONDA SEMPRE E EXCLUSIVAMENTE EM PORTUGUÊS BRASILEIRO. Analise imagens e forneça descrições detalhadas em português do Brasil sobre pessoas, objetos, ambientes e estados emocionais. NUNCA responda em inglês ou outro idioma!"
            ).with_model("gemini", "gemini-2.0-flash")
            
            image_content = ImageContent(image_base64=image_data)
            
            prompt = """🇧🇷 RESPONDA EXCLUSIVAMENTE EM PORTUGUÊS BRASILEIRO 🇧🇷

Você é um assistente especialista em visão computacional para acessibilidade. Analise esta imagem em DETALHES EXTREMOS e forneça EM PORTUGUÊS BRASILEIRO uma descrição MUITO RICA para pessoas cegas ou com deficiência visual:

IMPORTANTE: TODA A DESCRIÇÃO DEVE SER EM PORTUGUÊS DO BRASIL!

1. **PESSOAS DETECTADAS** - Para cada pessoa, descreva MINUCIOSAMENTE COM MÁXIMO DETALHAMENTO:
   
   **CARACTERÍSTICAS FÍSICAS DETALHADAS:**
   - Idade aproximada e gênero aparente
   - Tipo físico, altura e estrutura corporal
   - Tom de pele (claro, médio, escuro, bronzeado, etc.)
   - Formato do rosto (redondo, oval, quadrado, triangular)
   
   **OLHOS E EXPRESSÃO FACIAL:**
   - Cor dos olhos (castanhos, azuis, verdes, mel, pretos, etc.)
   - Formato e tamanho dos olhos
   - Sobrancelhas (cor, formato, espessura)
   - Expressão do olhar (direto, desviado, concentrado, etc.)
   
   **CABELOS DETALHADOS:**
   - Cor exata (loiro platinado, castanho escuro, ruivo, grisalho, etc.)
   - Comprimento (curtíssimo, curto, médio, longo, muito longo)
   - Textura (liso, ondulado, cacheado, crespo)
   - Penteado ou corte específico
   - Produtos ou acessórios no cabelo
   
   **VESTIMENTA ULTRA DETALHADA:**
   - Peças de roupa específicas (camiseta, camisa social, blusa, etc.)
   - Cores exatas e combinações de cores
   - Padrões e estampas (listras, xadrez, floral, geométrico, etc.)
   - Tecidos aparentes (algodão, jeans, seda, lã, etc.)
   - MARCAS VISÍVEIS: identifique logos, marcas ou escritos em roupas
   - Estado da roupa (nova, usada, amarrotada, bem cuidada)
   - Estilo (casual, formal, esportivo, alternativo, etc.)
   
   **BIJUTERIAS E ACESSÓRIOS COMPLETOS:**
   - Brincos: tipo, tamanho, material aparente (ouro, prata, etc.)
   - Colares: correntes, pingentes, materiais
   - Pulseiras: quantidade, estilo, material
   - Anéis: dedo, tipo, pedras ou detalhes
   - Relógios: tipo, cor da pulseira, tamanho
   - Óculos: formato, cor da armação, tipo de lente
   - Piercings visíveis
   - Tatuagens aparentes: localização e descrição
   
   **CALÇADOS E DETALHES:**
   - Tipo de calçado (tênis, sapato social, sandália, etc.)
   - Marca quando visível
   - Cor e material
   - Estado (novo, usado, limpo, sujo)
   - Meias ou meia-calça visível
   
   **OUTROS ACESSÓRIOS:**
   - Bolsas: tipo, tamanho, cor, marca se visível
   - Chapéus ou bonés: estilo, cor, logos
   - Lenços ou echarpes
   - Cintos: cor, fivela, estilo
   - Qualquer objeto que a pessoa está segurando
   
   **POSTURA E LINGUAGEM CORPORAL:**
   - Posição do corpo (em pé, sentado, deitado, caminhando)
   - Direção do olhar e para onde está olhando
   - Posição dos braços e mãos
   - Expressão facial completa
   - Gestos que está fazendo
   
   **ANÁLISE EMOCIONAL AVANÇADA:**
   - Expressão facial detalhada (sorriso, franzir de testa, etc.)
   - Estado emocional aparente (feliz, triste, ansioso, relaxado, etc.)
   - Microexpressões observáveis
   - Linguagem corporal emocional
   - Sinais de cansaço, energia, estresse, etc.
   
   **ATIVIDADES E CONTEXTO:**
   - O que a pessoa está fazendo no momento
   - Interações com outras pessoas
   - Interação com objetos do ambiente
   - Localização na cena

2. **OBJETOS E ELEMENTOS** - Identifique TODOS os elementos visíveis:
   - Móveis: tipo, material aparente, cor, condição
   - Eletrônicos: dispositivos, estado (ligado/desligado), marcas visíveis
   - Decoração: quadros, plantas, ornamentos
   - Utensílios: ferramentas, livros, documentos, comida, bebida
   - Arquitetura: portas, janelas, paredes, piso, teto
   - Localização espacial: onde estão posicionados na cena

3. **AMBIENTE COMPLETO**:
   - Tipo específico de local (cozinha, sala, escritório, rua, parque, etc)
   - Dimensões aparentes e layout espacial
   - Iluminação: natural/artificial, intensa/suave, fonte de luz
   - Clima e atmosfera: formal/informal, limpo/bagunçado, moderno/tradicional
   - Sons que podem estar presentes (implícitos pela cena)
   - Texturas visíveis: materiais, superfícies

4. **CONTEXTO E NARRATIVA**:
   - O que está acontecendo na cena
   - Possível história ou situação
   - Relações entre pessoas e objetos
   - Tempo provável (manhã, tarde, noite)

5. **DETALHES DE ACESSIBILIDADE**:
   - Obstáculos ou facilidades de mobilidade
   - Elementos de segurança visíveis
   - Pontos de referência importantes

Forneça uma resposta JSON COMPLETA em português com esta estrutura:
{
  "objects": [
    {
      "label": "pessoa/objeto", 
      "confidence": 0.95, 
      "description": "descrição extremamente detalhada em português",
      "emotions": {
        "expression": "descrição completa da expressão",
        "emotional_state": "estado emocional detalhado",
        "is_smiling": true/false,
        "sentiment": "análise completa do sentimento",
        "energy_level": "nível de energia com explicação"
      }
    }
  ],
  "description": "DESCRIÇÃO NARRATIVA EXTREMAMENTE RICA E DETALHADA da cena completa em português brasileiro, como se estivesse contando para uma pessoa cega com todos os detalhes visuais possíveis",
  "overall_sentiment": "análise profunda do sentimento e atmosfera geral da cena",
  "accessibility_notes": "informações específicas para acessibilidade e navegação",
  "emotion_analysis": {
    "sorrindo": 0,
    "serio": 0,
    "triste": 0,
    "surpreso": 0,
    "zangado": 0,
    "neutro": 0
  },
  "sentiment_analysis": {
    "positivo": 0,
    "neutro": 0,
    "negativo": 0
  }
}

IMPORTANTE: Para emotion_analysis e sentiment_analysis, conte QUANTAS PESSOAS na imagem apresentam cada emoção/sentimento. Por exemplo, se há 3 pessoas sorrindo, coloque "sorrindo": 3. Se há 2 pessoas com sentimento positivo, coloque "positivo": 2.

🇧🇷 LEMBRE-SE: TODA A DESCRIÇÃO DEVE ESTAR EM PORTUGUÊS BRASILEIRO! NÃO USE INGLÊS! 🇧🇷"""
            
            user_message = UserMessage(
                text=prompt,
                file_contents=[image_content]
            )
            
            # Retry logic for Gemini API
            max_retries = 3
            retry_delay = 2
            response = None
            last_error = None
            
            for attempt in range(max_retries):
                try:
                    response = await chat.send_message(user_message)
                    break  # Success, exit retry loop
                except Exception as e:
                    last_error = e
                    error_msg = str(e).lower()
                    
                    if '503' in error_msg or 'overloaded' in error_msg or 'rate' in error_msg:
                        if attempt < max_retries - 1:
                            logging.warning(f"Gemini API overloaded, retrying in {retry_delay}s... (attempt {attempt + 1}/{max_retries})")
                            import asyncio
                            await asyncio.sleep(retry_delay)
                            retry_delay *= 2
                            continue
                        else:
                            raise HTTPException(
                                status_code=503,
                                detail="O serviço de IA está temporariamente sobrecarregado. Por favor, tente novamente em alguns instantes."
                            )
                    else:
                        raise
            
            if response is None:
                raise last_error or Exception("Failed to get response from Gemini")
            
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
                
                # Process emotion and sentiment analysis
                if 'emotion_analysis' in result:
                    detection.emotion_analysis = EmotionAnalysis(**result['emotion_analysis'])
                if 'sentiment_analysis' in result:
                    detection.sentiment_analysis = SentimentAnalysis(**result['sentiment_analysis'])
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
        
    except HTTPException:
        raise  # Re-raise HTTPException as-is (preserves status code)
    except Exception as e:
        logging.error(f"Error analyzing frame: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/detect/analyze-nutrition", response_model=Detection)
async def analyze_nutrition(input: DetectionCreate, request: Request):
    """Analyze food items and calculate nutritional information"""
    try:
        # Get authenticated user
        auth_header = request.headers.get("Authorization")
        user_id = get_current_user(auth_header)
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        detection = Detection(
            source=input.source,
            detection_type="nutrition",
            image_data=input.image_data,
            user_id=user_id
        )
        
        # Extract base64 image data
        image_data = input.image_data.split(',')[1] if ',' in input.image_data else input.image_data
        
        # PhD-Level Nutrition Analysis Prompt
        nutrition_prompt = f"""
🇧🇷 RESPONDA EXCLUSIVAMENTE EM PORTUGUÊS BRASILEIRO 🇧🇷

Você é um PhD em Nutrição com especialização em Nutrição Clínica, Bioquímica Nutricional e Dietética Aplicada. 
Possui 20 anos de experiência em análise nutricional, avaliação de adequação alimentar e prescrição dietética.

IMPORTANTE: TODA A RESPOSTA DEVE SER EM PORTUGUÊS DO BRASIL!

ANÁLISE ULTRA-DETALHADA DE COMPOSIÇÃO NUTRICIONAL:

Como especialista PhD, realize uma análise COMPLETA e CIENTÍFICA desta refeição, incluindo:

1. **IDENTIFICAÇÃO PRECISA DOS ALIMENTOS**:
   - Nome científico quando aplicável
   - Método de preparo (cru, cozido, frito, grelhado, assado)
   - Presença de temperos e condimentos visíveis
   - Estado de cocção e processamento

2. **ANÁLISE QUANTITATIVA PRECISA**:
   - Peso estimado em gramas com margem de erro
   - Densidade calórica por 100g
   - Volume aparente e conversão peso-volume

3. **PERFIL NUTRICIONAL COMPLETO** (por alimento):
   - Macronutrientes: Proteínas (g), Carboidratos (g), Gorduras totais (g), Fibras (g)
   - Gorduras: Saturadas, Monoinsaturadas, Poliinsaturadas, Trans
   - Carboidratos: Simples, Complexos, Índice Glicêmico estimado
   - Micronutrientes principais: Vitaminas (A, C, D, E, K, B-complex) e Minerais (Ca, Fe, Mg, Zn, K, Na)
   
4. **AVALIAÇÃO NUTRICIONAL PROFISSIONAL**:
   - Adequação em relação às DRIs brasileiras
   - Qualidade nutricional da refeição (score 0-100)
   - Densidade nutricional vs densidade calórica
   - Equilíbrio de macronutrientes (% proteína, % carboidrato, % gordura)

5. **ÍNDICES NUTRICIONAIS**:
   - Índice Glicêmico estimado da refeição
   - Carga Glicêmica total
   - Relação Ômega-6/Ômega-3 (quando aplicável)
   - Índice de Qualidade Nutricional (IQN)

6. **RECOMENDAÇÕES CIENTÍFICAS**:
   - Pontos positivos nutricionais
   - Áreas de melhoria
   - Sugestões de complementação
   - Alertas para grupos específicos (diabéticos, hipertensos, etc)
   - Possíveis deficiências nutricionais

7. **CONTEXTO DIETÉTICO**:
   - Adequação para diferentes perfis (atletas, sedentários, idosos)
   - Compatibilidade com dietas especiais (vegetariana, low-carb, mediterrânea)
   - Momento ideal de consumo (café da manhã, pré-treino, pós-treino, etc)

RETORNE JSON ESTRUTURADO PhD-LEVEL COMPLETO:
{{
  "description": "descrição científica completa e detalhada da refeição",
  "nutritional_analysis": {{
    "foods_detected": [
      {{
        "name": "nome do alimento",
        "scientific_name": "nome científico quando aplicável",
        "preparation_method": "método de preparo",
        "calories_per_100g": 0.0,
        "estimated_portion_grams": 0.0,
        "total_calories": 0.0,
        "macronutrients": {{
          "protein": 0.0,
          "carbohydrates": 0.0,
          "fat": 0.0,
          "fiber": 0.0
        }},
        "detailed_fats": {{
          "saturated": 0.0,
          "monounsaturated": 0.0,
          "polyunsaturated": 0.0,
          "trans": 0.0
        }},
        "carb_types": {{
          "simple": 0.0,
          "complex": 0.0
        }},
        "glycemic_index": 55,
        "micronutrients": {{
          "vitamin_a": 0.0,
          "vitamin_c": 0.0,
          "vitamin_d": 0.0,
          "calcium": 0.0,
          "iron": 0.0,
          "magnesium": 0.0,
          "potassium": 0.0,
          "sodium": 0.0
        }},
        "confidence": 0.9
      }}
    ],
    "total_calories": 0.0,
    "total_weight_grams": 0.0,
    "meal_type": "café da manhã/almoço/jantar/lanche/pré-treino/pós-treino",
    "nutritional_summary": {{
      "total_protein": 0.0,
      "total_carbs": 0.0,
      "total_fat": 0.0,
      "total_fiber": 0.0,
      "total_saturated_fat": 0.0,
      "total_sodium": 0.0
    }},
    "quality_score": 75,
    "nutritional_balance": {{
      "protein_percent": 20.0,
      "carbs_percent": 50.0,
      "fat_percent": 30.0
    }},
    "glycemic_load": 15.5,
    "nutritional_quality_index": 7.8,
    "health_recommendations": [
      "Recomendação 1",
      "Recomendação 2",
      "Recomendação 3"
    ],
    "positive_aspects": [
      "Aspecto positivo 1",
      "Aspecto positivo 2"
    ],
    "improvement_areas": [
      "Área de melhoria 1",
      "Área de melhoria 2"
    ],
    "health_alerts": [
      "Alerta de saúde se aplicável"
    ],
    "dietary_compatibility": {{
      "vegetarian": true/false,
      "vegan": true/false,
      "low_carb": true/false,
      "keto": true/false,
      "mediterranean": true/false,
      "gluten_free": true/false,
      "lactose_free": true/false,
      "diabetic_friendly": true/false
    }},
    "ideal_consumption_time": "descrição do melhor momento",
    "dri_adequacy": {{
      "protein": 35.5,
      "fiber": 20.0,
      "vitamin_c": 45.0,
      "calcium": 15.0,
      "iron": 25.0
    }}
  }}
}}

IMPORTANTE - DIRETRIZES PhD:
- 🇧🇷 RESPONDA TUDO EM PORTUGUÊS BRASILEIRO - OBRIGATÓRIO!
- Use SEMPRE valores baseados em TACO (Tabela Brasileira de Composição de Alimentos)
- Considere método de preparo e impacto nutricional
- Seja PRECISO e CIENTÍFICO nas recomendações
- Identifique riscos nutricionais para grupos vulneráveis
- Compare com DRIs brasileiras (RDC 269/2005)
- Calcule índices glicêmicos baseados em literatura científica
- Se não houver alimentos, retorne arrays/listas vazios
- TODAS as descrições, recomendações e textos devem estar em PORTUGUÊS!

🇧🇷 LEMBRE-SE: RESPOSTA 100% EM PORTUGUÊS DO BRASIL! 🇧🇷
"""
        
        # Process via Gemini 2.0 Flash with retry logic
        max_retries = 3
        retry_delay = 2
        response = None
        last_error = None
        
        for attempt in range(max_retries):
            try:
                chat = LlmChat(
                    api_key=GOOGLE_API_KEY,
                    session_id=f"nutrition_analysis_{uuid.uuid4()}",
                    system_message="Você é um especialista PhD em nutrição e análise de alimentos brasileiro. RESPONDA SEMPRE EM PORTUGUÊS BRASILEIRO. Use a Tabela Brasileira de Composição de Alimentos (TACO) e as DRIs brasileiras (RDC 269/2005)."
                ).with_model("gemini", "gemini-2.0-flash")
                
                response = await chat.send_message(
                    UserMessage(
                        text=nutrition_prompt,
                        file_contents=[ImageContent(image_base64=image_data)]
                    )
                )
                
                # If we got here, request succeeded
                break
                
            except Exception as e:
                last_error = e
                error_msg = str(e).lower()
                
                # Check if it's a retryable error (503, overloaded, rate limit)
                if '503' in error_msg or 'overloaded' in error_msg or 'rate' in error_msg:
                    if attempt < max_retries - 1:
                        logging.warning(f"Gemini API overloaded, retrying in {retry_delay}s... (attempt {attempt + 1}/{max_retries})")
                        import asyncio
                        await asyncio.sleep(retry_delay)
                        retry_delay *= 2  # Exponential backoff
                        continue
                    else:
                        logging.error(f"Max retries reached for nutrition analysis")
                        raise HTTPException(
                            status_code=503, 
                            detail="O serviço de IA está temporariamente sobrecarregado. Por favor, tente novamente em alguns instantes."
                        )
                else:
                    # Non-retryable error, raise immediately
                    raise
        
        if response is None:
            raise last_error or Exception("Failed to get response from Gemini")
        
        # Parse response
        try:
            # Try to find JSON in response
            response_text = response.strip()
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()
            
            result = json.loads(response_text)
            detection.description = result.get('description', response_text)
            
            # Process nutritional analysis
            if 'nutritional_analysis' in result:
                nutrition_data = result['nutritional_analysis']
                detection.nutritional_analysis = NutritionalAnalysis(**nutrition_data)
                
        except json.JSONDecodeError as e:
            # If JSON parsing fails, use raw response
            logging.error(f"JSON parsing failed for nutrition analysis: {str(e)}")
            logging.error(f"Raw response: {response_text if 'response_text' in locals() else response}")
            detection.description = response_text if 'response_text' in locals() else str(response)
            detection.nutritional_analysis = NutritionalAnalysis()
        except Exception as e:
            logging.error(f"Error processing nutrition data: {str(e)}")
            detection.description = response_text if 'response_text' in locals() else str(response)
            detection.nutritional_analysis = NutritionalAnalysis()
        
        # Save to database
        doc = detection.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        await db.detections.insert_one(doc)
        
        return detection
        
    except HTTPException:
        raise  # Re-raise HTTPException as-is (preserves status code)
    except Exception as e:
        logging.error(f"Error analyzing nutrition: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Authentication endpoints
@api_router.post("/auth/register")
async def register_user(user_data: UserRegister):
    """Register a new user"""
    try:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        password_hash = get_password_hash(user_data.password)
        
        # Create user
        user = User(
            name=user_data.name,
            email=user_data.email,
            password_hash=password_hash,
            user_type=user_data.user_type
        )
        
        # Save to database
        user_dict = user.model_dump()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        if user_dict.get('last_login'):
            user_dict['last_login'] = user_dict['last_login'].isoformat()
            
        await db.users.insert_one(user_dict)
        
        return {"success": True, "message": "User created successfully"}
        
    except HTTPException:
        raise  # Re-raise HTTPException as-is (preserves status code)
    except Exception as e:
        logging.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Registration failed")

@api_router.post("/auth/login")
async def login_user(credentials: UserLogin):
    """Login user and return JWT token"""
    try:
        # Find user
        user = await db.users.find_one({"email": credentials.email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not verify_password(credentials.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check if user is active
        if not user.get("is_active", True):
            raise HTTPException(status_code=401, detail="Account is disabled")
        
        # Update last login
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user["id"], "email": user["email"], "user_type": user["user_type"]}
        )
        
        return {
            "success": True,
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "user_type": user["user_type"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed")

@api_router.get("/auth/me")
async def get_current_user_info(request: Request):
    """Get current user information"""
    auth_header = request.headers.get("Authorization")
    user_id = get_current_user(auth_header)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0, "reset_token": 0, "reset_token_expiry": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@api_router.put("/auth/profile")
async def update_profile(request: Request, profile_data: UserProfileUpdate):
    """Update user profile"""
    auth_header = request.headers.get("Authorization")
    user_id = get_current_user(auth_header)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Build update document
    update_doc = {}
    if profile_data.name:
        update_doc["name"] = profile_data.name
    if profile_data.bio is not None:
        update_doc["bio"] = profile_data.bio
    if profile_data.phone is not None:
        update_doc["phone"] = profile_data.phone
    if profile_data.birth_date is not None:
        update_doc["birth_date"] = profile_data.birth_date
    if profile_data.profile_photo is not None:
        update_doc["profile_photo"] = profile_data.profile_photo
    
    if not update_doc:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Update user
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": update_doc}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return updated user
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0, "reset_token": 0, "reset_token_expiry": 0})
    return {"success": True, "user": updated_user}

@api_router.post("/auth/forgot-password")
async def forgot_password(request_data: PasswordResetRequest):
    """Request password reset - generates token"""
    try:
        user = await db.users.find_one({"email": request_data.email})
        
        if not user:
            # Don't reveal if email exists for security
            return {"success": True, "message": "If email exists, reset instructions have been sent"}
        
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        reset_expiry = datetime.now(timezone.utc) + timedelta(hours=1)  # 1 hour expiry
        
        # Save token to user
        await db.users.update_one(
            {"email": request_data.email},
            {"$set": {
                "reset_token": reset_token,
                "reset_token_expiry": reset_expiry.isoformat()
            }}
        )
        
        # In production, send email with token
        # For now, return token in response (ONLY FOR DEVELOPMENT)
        logging.info(f"Password reset token for {request_data.email}: {reset_token}")
        
        return {
            "success": True, 
            "message": "If email exists, reset instructions have been sent",
            "token": reset_token  # REMOVE IN PRODUCTION - should be sent via email
        }
        
    except Exception as e:
        logging.error(f"Forgot password error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process request")

@api_router.post("/auth/reset-password")
async def reset_password(reset_data: PasswordReset):
    """Reset password with token"""
    try:
        # Find user with valid token
        user = await db.users.find_one({
            "reset_token": reset_data.token
        })
        
        if not user:
            raise HTTPException(status_code=400, detail="Invalid or expired token")
        
        # Check if token expired
        if user.get("reset_token_expiry"):
            expiry = datetime.fromisoformat(user["reset_token_expiry"])
            if expiry < datetime.now(timezone.utc):
                raise HTTPException(status_code=400, detail="Token has expired")
        
        # Hash new password
        new_password_hash = pwd_context.hash(reset_data.new_password)
        
        # Update password and clear token
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {
                "password_hash": new_password_hash,
                "reset_token": None,
                "reset_token_expiry": None
            }}
        )
        
        return {"success": True, "message": "Password reset successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Reset password error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reset password")

@api_router.get("/detections", response_model=List[Detection])
async def get_detections(
    request: Request,
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0)
):
    """Get detection history - filtered by user unless admin"""
    auth_header = request.headers.get("Authorization")
    user_id = get_current_user(auth_header)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Get user to check if admin
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Filter detections by user unless admin
    filter_query = {}
    if user.get("user_type") != "admin":
        filter_query["user_id"] = user_id
    
    detections = await db.detections.find(
        filter_query, {"_id": 0}
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

# Scientific Records Routes
@api_router.post("/scientific-records", response_model=ScientificRecord)
async def create_scientific_record(input: ScientificRecordCreate):
    """Criar novo registro científico"""
    record = ScientificRecord(**input.model_dump())
    doc = record.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.scientific_records.insert_one(doc)
    return record

@api_router.get("/scientific-records", response_model=List[ScientificRecord])
async def get_scientific_records(
    record_type: Optional[str] = None,
    research_line: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500)
):
    """Listar registros científicos"""
    query = {}
    if record_type:
        query["record_type"] = record_type
    if research_line:
        query["research_line"] = research_line
    
    records = await db.scientific_records.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    for rec in records:
        if isinstance(rec['created_at'], str):
            rec['created_at'] = datetime.fromisoformat(rec['created_at'])
    
    return records

@api_router.delete("/scientific-records/{record_id}")
async def delete_scientific_record(record_id: str):
    """Deletar registro científico"""
    result = await db.scientific_records.delete_one({"id": record_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"message": "Record deleted"}

# Intelligent Reports
@api_router.post("/analyze/sentiment-deep")
async def analyze_sentiment_deep(input: DetectionCreate):
    """Análise profunda de sentimentos usando técnica avançada de IA"""
    try:
        # Decode base64 image
        image_data = input.image_data.split(',')[1] if ',' in input.image_data else input.image_data
        
        # Use Gemini Vision with advanced sentiment analysis technique
        chat = LlmChat(
            api_key=GOOGLE_API_KEY,
            session_id=f"sentiment_analysis_{uuid.uuid4()}",
            system_message="""Você é um especialista em análise de sentimentos e psicologia comportamental. 
            Use a técnica de 'Análise Multimodal de Sentimentos' que combina:
            1. Detecção de microexpressões faciais (FACS - Facial Action Coding System)
            2. Análise de linguagem corporal e postura
            3. Contexto ambiental e situacional
            4. Teoria das emoções de Ekman (6 emoções básicas + variações)
            5. Análise de valência emocional (positivo/negativo) e arousal (ativação)"""
        ).with_model("gemini", "gemini-2.0-flash")
        
        image_content = ImageContent(image_base64=image_data)
        
        prompt = """Realize uma ANÁLISE PROFUNDA DE SENTIMENTOS desta imagem usando a técnica de Análise Multimodal:

**MÉTODO CIENTÍFICO:**
1. **FACS (Facial Action Coding System)**: Identifique Action Units (AUs) nas expressões faciais
2. **Teoria de Ekman**: Classifique emoções básicas (alegria, tristeza, raiva, medo, surpresa, nojo)
3. **Valência e Arousal**: Avalie dimensões emocionais (positivo/negativo, alta/baixa ativação)
4. **Linguagem Corporal**: Analise postura, gestos e posicionamento
5. **Contexto**: Considere ambiente, objetos e situação

**PARA CADA PESSOA DETECTADA:**
- **Microexpressões**: Detalhe movimentos faciais específicos
- **Estado emocional primário**: Emoção dominante
- **Estados secundários**: Emoções sutis presentes
- **Intensidade emocional**: Escala 1-10
- **Congruência**: Alinhamento entre face, corpo e contexto
- **Indicadores fisiológicos**: Tensão muscular, dilatação pupilar (se visível)
- **Interpretação psicológica**: O que a pessoa pode estar sentindo/pensando

**ANÁLISE DE GRUPO** (se múltiplas pessoas):
- **Dinâmica emocional**: Como as emoções interagem entre pessoas
- **Contágio emocional**: Influência mútua de sentimentos
- **Clima emocional geral**: Atmosfera do grupo

Forneça resposta em JSON em PORTUGUÊS com estrutura detalhada:
{
  "sentiment_analysis": {
    "methodology": "FACS + Ekman + Análise Multimodal",
    "people": [{
      "person_id": 1,
      "primary_emotion": "alegria",
      "emotion_intensity": 8.5,
      "secondary_emotions": ["satisfação", "tranquilidade"],
      "facial_action_units": ["AU6 (elevação da bochecha)", "AU12 (sorriso)"],
      "valence": "positivo",
      "arousal": "moderado",
      "body_language": "postura relaxada, braços abertos",
      "psychological_interpretation": "pessoa demonstra contentamento genuíno...",
      "confidence_score": 0.92
    }],
    "group_dynamics": {
      "overall_mood": "positivo e colaborativo",
      "emotional_contagion": "alta",
      "tension_level": "baixo"
    },
    "contextual_factors": ["ambiente bem iluminado", "presença de objetos positivos"],
    "detailed_description": "descrição narrativa completa em português"
  }
}"""
        
        user_message = UserMessage(
            text=prompt,
            file_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        
        # Parse response
        try:
            response_text = response.strip()
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()
            
            result = json.loads(response_text)
            return result
        except:
            return {
                "sentiment_analysis": {
                    "methodology": "FACS + Ekman + Análise Multimodal",
                    "raw_analysis": response,
                    "status": "partial_parse"
                }
            }
        
    except Exception as e:
        logging.error(f"Error in deep sentiment analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/reports/intelligent")
async def generate_intelligent_report(query: ReportQuery):
    """Gerar relatório inteligente com análises"""
    # Build query
    db_query = {}
    if query.start_date:
        db_query["timestamp"] = {"$gte": query.start_date}
    if query.end_date:
        if "timestamp" in db_query:
            db_query["timestamp"]["$lte"] = query.end_date
        else:
            db_query["timestamp"] = {"$lte": query.end_date}
    
    detections = await db.detections.find(db_query, {"_id": 0}).to_list(1000)
    
    # Analyze data
    total_detections = len(detections)
    webcam_count = sum(1 for d in detections if d.get('source') == 'webcam')
    upload_count = sum(1 for d in detections if d.get('source') == 'upload')
    
    # Emotion analysis
    emotions_data = {
        "sorrindo": 0,
        "serio": 0,
        "triste": 0,
        "surpreso": 0,
        "zangado": 0,
        "neutro": 0
    }
    
    sentiment_data = {
        "positivo": 0,
        "neutro": 0,
        "negativo": 0
    }
    
    objects_count = {}
    
    for detection in detections:
        # Count objects
        for obj in detection.get('objects_detected', []):
            label = obj.get('label', 'unknown')
            objects_count[label] = objects_count.get(label, 0) + 1
            
        # Extract emotions from detection-level analysis
        if 'emotion_analysis' in detection and detection['emotion_analysis']:
            emotion_data = detection['emotion_analysis']
            for emotion, count in emotion_data.items():
                if emotion in emotions_data and isinstance(count, int):
                    emotions_data[emotion] += count
                    
        # Extract sentiment from detection-level analysis  
        if 'sentiment_analysis' in detection and detection['sentiment_analysis']:
            sentiment_analysis = detection['sentiment_analysis']
            for sentiment, count in sentiment_analysis.items():
                if sentiment in sentiment_data and isinstance(count, int):
                    sentiment_data[sentiment] += count
    
    # Scientific records stats
    scientific_records = await db.scientific_records.find({}, {"_id": 0}).to_list(1000)
    records_by_type = {}
    records_by_line = {}
    
    for rec in scientific_records:
        rec_type = rec.get('record_type', 'unknown')
        records_by_type[rec_type] = records_by_type.get(rec_type, 0) + 1
        
        line = rec.get('research_line', 'unknown')
        records_by_line[line] = records_by_line.get(line, 0) + 1
    
    return {
        "report_type": query.report_type,
        "period": {
            "start": query.start_date,
            "end": query.end_date
        },
        "detections_summary": {
            "total": total_detections,
            "by_source": {
                "webcam": webcam_count,
                "upload": upload_count
            }
        },
        "emotions_analysis": emotions_data,
        "sentiment_analysis": sentiment_data,
        "objects_detected": dict(sorted(objects_count.items(), key=lambda x: x[1], reverse=True)[:10]),
        "scientific_records": {
            "total": len(scientific_records),
            "by_type": records_by_type,
            "by_research_line": records_by_line
        },
        "insights": {
            "most_detected_object": max(objects_count.items(), key=lambda x: x[1])[0] if objects_count else "N/A",
            "dominant_emotion": max(emotions_data.items(), key=lambda x: x[1])[0] if any(emotions_data.values()) else "N/A",
            "overall_sentiment": max(sentiment_data.items(), key=lambda x: x[1])[0] if any(sentiment_data.values()) else "N/A"
        }
    }

# Social Network Routes
@api_router.post("/researchers", response_model=ResearcherProfile)
async def create_researcher_profile(input: ResearcherProfileCreate):
    """Criar perfil de pesquisador"""
    profile = ResearcherProfile(**input.model_dump())
    doc = profile.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.researchers.insert_one(doc)
    return profile

@api_router.get("/researchers", response_model=List[ResearcherProfile])
async def get_researchers(limit: int = Query(50, ge=1, le=100)):
    """Listar pesquisadores"""
    researchers = await db.researchers.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    for r in researchers:
        if isinstance(r['created_at'], str):
            r['created_at'] = datetime.fromisoformat(r['created_at'])
    return researchers

@api_router.get("/researchers/{researcher_id}", response_model=ResearcherProfile)
async def get_researcher(researcher_id: str):
    """Obter perfil de pesquisador"""
    researcher = await db.researchers.find_one({"id": researcher_id}, {"_id": 0})
    if not researcher:
        raise HTTPException(status_code=404, detail="Researcher not found")
    if isinstance(researcher['created_at'], str):
        researcher['created_at'] = datetime.fromisoformat(researcher['created_at'])
    return ResearcherProfile(**researcher)

@api_router.delete("/researchers/{researcher_id}")
async def delete_researcher(researcher_id: str):
    """Deletar pesquisador"""
    result = await db.researchers.delete_one({"id": researcher_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Researcher not found")
    return {"message": "Researcher deleted"}

@api_router.post("/posts", response_model=Post)
async def create_post(input: PostCreate):
    """Criar post"""
    post = Post(**input.model_dump())
    doc = post.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.posts.insert_one(doc)
    return post

@api_router.get("/posts", response_model=List[Post])
async def get_posts(limit: int = Query(50, ge=1, le=100)):
    """Listar posts"""
    posts = await db.posts.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    for p in posts:
        if isinstance(p['created_at'], str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    return posts

@api_router.post("/posts/{post_id}/like")
async def like_post(post_id: str):
    """Curtir post"""
    result = await db.posts.update_one(
        {"id": post_id},
        {"$inc": {"likes": 1}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Post liked"}

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str):
    """Deletar post"""
    result = await db.posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    # Delete associated comments
    await db.comments.delete_many({"post_id": post_id})
    return {"message": "Post deleted"}

@api_router.post("/comments", response_model=Comment)
async def create_comment(input: CommentCreate):
    """Criar comentário"""
    comment = Comment(**input.model_dump())
    doc = comment.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.comments.insert_one(doc)
    
    # Increment comments count on post
    await db.posts.update_one(
        {"id": input.post_id},
        {"$inc": {"comments_count": 1}}
    )
    
    return comment

@api_router.get("/comments/{post_id}", response_model=List[Comment])
async def get_comments(post_id: str):
    """Listar comentários de um post"""
    comments = await db.comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    for c in comments:
        if isinstance(c['created_at'], str):
            c['created_at'] = datetime.fromisoformat(c['created_at'])
    return comments

@api_router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str):
    """Deletar comentário"""
    comment = await db.comments.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    await db.comments.delete_one({"id": comment_id})
    
    # Decrement comments count on post
    await db.posts.update_one(
        {"id": comment['post_id']},
        {"$inc": {"comments_count": -1}}
    )
    
    return {"message": "Comment deleted"}

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