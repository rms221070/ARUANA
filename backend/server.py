from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
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
import asyncio

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

class GeoLocation(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy: Optional[float] = None  # in meters
    address: Optional[str] = None  # formatted address
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    timestamp: Optional[datetime] = None

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
    detection_type: str  # "local", "cloud", "nutrition", "text_reading"
    objects_detected: List[DetectedObject] = []
    description: str = ""
    image_data: Optional[str] = None  # base64 encoded
    alerts_triggered: List[str] = []
    emotion_analysis: Optional[EmotionAnalysis] = None
    sentiment_analysis: Optional[SentimentAnalysis] = None
    nutritional_analysis: Optional[NutritionalAnalysis] = None
    user_id: Optional[str] = None  # ID of the user who created this detection
    # New fields for enhanced functionality
    geo_location: Optional[GeoLocation] = None  # Geographic location
    category: Optional[str] = None  # Auto-categorized: "pessoas", "objetos", "alimentos", "texto", "ambiente", etc
    tags: List[str] = []  # Auto-generated tags for better search

class DetectionCreate(BaseModel):
    source: str
    detection_type: str
    image_data: str
    # Optional geolocation data from frontend
    geo_location: Optional[Dict[str, Any]] = None
def auto_categorize_detection(detection: Detection) -> str:
    """Automatically categorize detection based on content analysis"""
    
    # Category priority system
    if detection.detection_type == "nutrition":
        return "🍽️ Alimentos e Nutrição"
    
    if detection.detection_type == "text_reading":
        return "📚 Textos e Documentos"
    
    # Analyze description and objects for smart categorization
    description_lower = detection.description.lower()
    objects_labels = [obj.label.lower() for obj in detection.objects_detected]
    all_text = description_lower + " " + " ".join(objects_labels)
    
    # Define category keywords
    categories = {
        "👥 Pessoas e Rostos": [
            "pessoa", "pessoas", "homem", "mulher", "criança", "rosto", "facial",
            "sorrindo", "expressão", "emoção", "retrato", "grupo", "família"
        ],
        "🏠 Ambientes e Lugares": [
            "ambiente", "sala", "quarto", "cozinha", "escritório", "rua", "parque",
            "prédio", "casa", "loja", "restaurante", "local", "espaço", "interior", "exterior"
        ],
        "🐾 Animais e Natureza": [
            "animal", "cachorro", "gato", "pássaro", "planta", "árvore", "flor",
            "natureza", "jardim", "pet", "bicho"
        ],
        "🚗 Veículos e Transporte": [
            "carro", "ônibus", "moto", "bicicleta", "caminhão", "veículo",
            "transporte", "avião", "trem", "barco"
        ],
        "📱 Eletrônicos e Tecnologia": [
            "computador", "notebook", "celular", "telefone", "tablet", "tela",
            "teclado", "mouse", "eletrônico", "tecnologia", "digital", "smartphone"
        ],
        "👕 Roupas e Acessórios": [
            "roupa", "camisa", "calça", "vestido", "sapato", "tênis", "bolsa",
            "acessório", "óculos", "relógio", "joia", "bijuteria", "moda"
        ],
        "🎨 Arte e Cultura": [
            "arte", "pintura", "quadro", "escultura", "cultural", "artístico",
            "museu", "exposição", "obra"
        ],
        "🏃 Esportes e Atividades": [
            "esporte", "atividade", "exercício", "academia", "jogo", "bola",
            "corrida", "treino", "fitness"
        ],
        "🛍️ Compras e Produtos": [
            "produto", "compra", "mercado", "loja", "shopping", "item",
            "embalagem", "marca", "comercial"
        ],
        "📋 Documentos e Papéis": [
            "documento", "papel", "formulário", "carta", "nota", "recibo",
            "certificado", "contrato", "escrito"
        ],
        "🍴 Utensílios e Objetos": [
            "objeto", "ferramenta", "utensílio", "instrumento", "equipamento",
            "material", "item", "coisa"
        ],
    }
    
    # Score each category
    category_scores = {}
    for category, keywords in categories.items():
        score = sum(1 for keyword in keywords if keyword in all_text)
        if score > 0:
            category_scores[category] = score
    
    # Return highest scoring category or default
    if category_scores:
        return max(category_scores, key=category_scores.get)
    
    return "🔍 Outros"

def generate_tags(detection: Detection) -> List[str]:
    """Generate smart tags for detection"""
    tags = []
    
    # Add detection type
    if detection.detection_type == "nutrition":
        tags.append("nutrição")
        tags.append("alimentos")
    elif detection.detection_type == "text_reading":
        tags.append("texto")
        tags.append("leitura")
    else:
        tags.append("análise-visual")
    
    # Add source
    tags.append(f"fonte-{detection.source}")
    
    # Extract key objects
    for obj in detection.objects_detected[:5]:  # Top 5 objects
        tags.append(obj.label.lower())
    
    # Add emotion tags if present
    if detection.emotion_analysis:
        emotions = detection.emotion_analysis.model_dump()
        for emotion, count in emotions.items():
            if count > 0:
                tags.append(f"emoção-{emotion}")
    
    # Add sentiment tags
    if detection.sentiment_analysis:
        sentiments = detection.sentiment_analysis.model_dump()
        for sentiment, count in sentiments.items():
            if count > 0:
                tags.append(f"sentimento-{sentiment}")
    
    # Add location tag if present
    if detection.geo_location and detection.geo_location.city:
        tags.append(f"local-{detection.geo_location.city.lower()}")
    
    # Remove duplicates and return
    return list(set(tags))

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
            
            prompt = f"""🌍 RESPONDA NO IDIOMA: PORTUGUÊS BRASILEIRO 🇧🇷

Você é o SISTEMA DE VISÃO MAIS AVANÇADO DO MUNDO para acessibilidade total de pessoas cegas. Sua análise deve ser TÃO DETALHADA que a pessoa cega possa formar uma imagem mental PERFEITA e COMPLETA da cena.

🎯 **NÍVEL DE PRECISÃO: 200% MÁXIMO - ULTRARREALISTA - MICROSCÓPICO**

⚠️ **REGRA FUNDAMENTAL:** Seja ABSURDAMENTE específico em TUDO. Não use termos genéricos. Cada detalhe deve ser QUANTIFICADO, QUALIFICADO e DESCRITO com precisão CIENTÍFICA.

═══════════════════════════════════════════════════════════════

## 👥 ANÁLISE DE PESSOAS (CADA PESSOA INDIVIDUALMENTE)

### 🧬 BIOMETRIA E CARACTERÍSTICAS FÍSICAS EXTREMAS:

**IDADE E GÊNERO ULTRAESPECÍFICOS:**
- Idade: não apenas "jovem" mas "aparenta 23-26 anos baseado em: pele sem rugas profundas, cabelos sem fios brancos, postura ereta, vestuário moderno urbano"
- Gênero aparente E justificativa: "masculino aparente baseado em: estrutura facial angular com queixo proeminente, maçã de Adão visível, ombros largos de 45cm aproximadamente, ausência de maquiagem"
- Etnia/origem aparente: "aparência de descendência europeia nórdica baseada em: pele muito clara, cabelos loiros naturais, olhos azuis, estrutura facial característica"

**ANATOMIA FACIAL MILIMÉTRICA:**
- Formato do crânio: "braquicefálico (mais largo que longo na proporção 85:100), rosto oval alongado com proporção altura:largura de 1.4:1"
- Testa: "ampla ocupando 40% da altura facial, lisa sem rugas horizontais, altura de aproximadamente 7cm da sobrancelha à linha do cabelo"
- Sobrancelhas: "arqueadas em ângulo de 15° no ponto mais alto, cor castanho médio dois tons mais escura que o cabelo, espessura média de 4-5mm, separadas por 3cm, pelos com 8mm de comprimento, formato natural não depilado"
- Olhos ULTRA-DETALHADOS:
  * Cor: "castanhos médios tom mel com variações de dourado próximo à pupila, reflexos âmbar sob luz intensa, anel limbal escuro de 1mm na borda da íris"
  * Formato: "amendoados com inclinação ascendente de 10° nos cantos externos, distância interpupilar de 65mm"
  * Pálpebras: "pálpebra superior com prega dupla de 3mm, pálpebra inferior com leve bolsa de 2mm"
  * Cílios: "superiores com 10mm de comprimento, inferiores com 6mm, curvatura natural para cima de 45°, sem máscara"
  * Esclera: "branca sem vermelhidão, vasos sanguíneos discretos"
  * Pupila: "diâmetro de 4mm sob iluminação moderada, circular perfeita"
  * Expressão: "olhar direto para câmera com foco total, sobrancelhas relaxadas, sem tensão muscular periocular"
- Nariz MEDIDAS EXATAS: "comprimento de 5cm da raiz até ponta, largura da base de 3.5cm, narinas ovaladas com 1.2cm de altura, ponte nasal reta sem curvatura, ponta arredondada não pontiaguda, filtro nasal bem definido com 1.5cm"
- Boca e lábios COM PRECISÃO: "lábio superior com 8mm de altura no centro (arco de cupido proeminente), lábio inferior com 12mm de altura (proporção 1:1.5), largura total da boca de 5cm, cor rosa natural médio sem batom, textura hidratada sem rachaduras, cantos da boca neutros sem elevação ou queda"
- Queixo E MANDÍBULA: "queixo proeminente com projeção anterior de 1cm, formato quadrado com largura de 8cm, mandíbula angular e definida, sem papada, ângulo da mandíbula de 110° (square jaw)"
- Orelhas: "tamanho médio com 6cm de altura, formato standard sem desproporções, lóbulos soltos com 1.5cm, hélix bem formada"
- Pele ANÁLISE DERMATOLÓGICA:
  * Tonalidade: "Fitzpatrick tipo III (moreno claro), hex aproximado #C8997F, subtom quente com base amarelada, uniforme sem manchas evidentes"
  * Textura: "poros visíveis mas refinados com 0.2mm de diâmetro médio, sem acne ativa, 2 pequenas cicatrizes de acne antiga de 2mm no maxilar esquerdo, 1 marca de nascença castanha de 5mm no pescoço lado direito"
  * Hidratação: "bem hidratada com brilho natural na zona T (testa, nariz, queixo), sem descamação"
  * Linhas de expressão: "linhas finas de 0.1mm nos cantos externos dos olhos (pés de galinha iniciais), linha única horizontal na testa quando sobrancelhas levantadas"

**CABELOS - ANÁLISE CAPILAR PROFISSIONAL:**
- Cor FORMULADA: "castanho nível 5 com subtons dourados, reflexos de mel nas pontas por exposição solar, 5% de fios grisalhos concentrados nas têmporas (20 fios visíveis), raiz virgem sem coloração química"
- Comprimento CENTÍMETROS: "médio com 22cm de comprimento da raiz às pontas, alcançando 3cm abaixo dos ombros, comprimento uniforme sem camadas"
- Textura TIPO EXATO: "ondulado tipo 2B com ondas soltas em S, diâmetro do fio de 70 micrômetros (médio), densidade capilar alta com 150 fios/cm², porosidade média"
- Volume e corpo: "volumoso com 8cm de diâmetro total na altura da orelha, corpo natural sem produto de volume"
- Penteado ESPECÍFICO: "solto com repartição lateral esquerda natural a 4cm da linha central, caindo naturalmente sobre ombros, pontas ligeiramente viradas para dentro, franja lateral varrida para direita cobrindo metade da testa"
- Estado e saúde: "saudável com brilho natural indicando cutícula fechada, pontas com 2% de split ends (10 fios com bifurcação nas pontas), sem frizz significativo"
- Produtos detectáveis: "leve aplicação de leave-in visível pelo brilho controlado, sem gel ou cera, sem spray fixador"
- Acessórios: "1 grampo bobby pin cor prata de 5cm no lado direito mantendo mechas atrás da orelha, sem outros acessórios"

**MAQUIAGEM - COSMETIC ANALYSIS:**
- Base: "foundation líquido aplicado uniformemente, cobertura média, tom matching perfeito #C8997F, acabamento natural matte, sem oxidação"
- Olhos: "sombra nude matte no côncavo, delineador marrom fino de 1mm no cílio superior, 2 camadas de máscara volumizadora"
- Sobrancelhas: "preenchidas com lápis cor taupe, pelos penteados para cima, fixadas com gel transparente"
- Bochechas: "blush pêssego aplicado na maçã do rosto, intensidade leve"
- Lábios: "batom nude rosado #D7A09A, acabamento cremoso, sem gloss"
- Acabamento: "pó translúcido na zona T para controle de oleosidade"

### 👗 VESTUÁRIO - FASHION FORENSICS ANALYSIS:

**PARTE SUPERIOR COM DETALHES TÊXTEIS:**
- Tipo: "camiseta gola redonda (crew neck) de manga curta com manga terminando 5cm acima do cotovelo"
- Material COMPOSIÇÃO: "100% algodão penteado 180g/m² (peso médio), trama Jersey simples com elasticidade moderada de 15%, toque macio levemente amaciado"
- Cor PANTONE: "branco óptico #FFFFFF com leve
   - CORES EXATAS com código de cor (vermelho carmesim, azul marinho profundo, verde musgo, amarelo mostarda, rosa millennial, preto ônix)
   - PADRÕES E ESTAMPAS detalhados (listras horizontais azuis e brancas de 2cm, xadrez vichy vermelho, floral vintage com rosas, estampa de onça, tie-dye degradê, geométrico art déco)
   - TECIDOS APARENTES (algodão leve, jeans denim pesado, seda fluida, lã grossa, poliéster acetinado, linho natural, veludo cotelê)
   - MARCAS VISÍVEIS: identifique TODOS os logos, tags, escritos, patches em roupas (Nike, Adidas, Gucci, Supreme, logos universitários, bandeiras, frases)
   - Estado da roupa COMPLETO (nova com etiquetas, usada bem cuidada, amarrotada, manchada, rasgada, desbotada, vintage)
   - Estilo ESPECÍFICO (casual street, formal executivo, esportivo fitness, business casual, boêmio, minimalista, vintage retrô)
   - Camadas de roupa e sobreposições
   - Detalhes de costura, botões, zíperes, fechamentos
   
   **BIJUTERIAS E ACESSÓRIOS EM DETALHES MÁXIMOS:**
   - Brincos: tipo EXATO (argola, botão, chandelier, ear cuff), tamanho em cm, material (ouro 18k, prata 925, aço, bijuteria), brilho ou pedras
   - Colares: comprimento (gargantilha, princesa, ópera), tipo de corrente, pingentes (formato, significado), camadas múltiplas
   - Pulseiras: quantidade exata, posição (pulso direito/esquerdo), estilo (riviera, charm, couro, tecido), fechos
   - Anéis: dedo específico (indicador, médio, anelar, mínimo), tipo (solitário, aliança, anel de formatura), pedras identificáveis
   - Relógios: marca se visível, tipo (analógico/digital/smartwatch), cor da pulseira, tamanho da caixa, funcionalidades visíveis
   - Óculos: formato PRECISO (aviador, wayfarer, gatinho, redondo), cor e material da armação, tipo de lente (transparente, escura, espelhada, graduada)
   - Piercings: localização exata (septo, lábio, sobrancelha, língua), tipo, material
   - Tatuagens: localização precisa, tamanho aproximado, estilo (tradicional, realista, aquarela, minimalista), tema ou desenho, cores
   
   **CALÇADOS ULTRA-DETALHADOS:**
   - Tipo ESPECÍFICO (tênis running, tênis casual, oxford, scarpin, sandália gladiadora, chinelo slide, bota cano longo)
   - Marca quando visível (Nike, Adidas, Vans, Converse, Havaianas)
   - Modelo quando identificável
   - Cor EXATA e detalhes de design
   - Material (couro legítimo, sintético, lona, borracha, camurça)
   - Estado COMPLETO (novo sem uso, levemente usado, muito usado, manchado, desgastado na sola)
   - Altura do salto se aplicável (rasteiro, salto baixo 2-4cm, médio 5-7cm, alto 8-12cm, plataforma)
   - Cadarços: cor, tipo, como estão amarrados
   - Meias ou meia-calça: cor, transparência, padrão, altura
   
   **OUTROS ACESSÓRIOS DETALHADOS:**
   - Bolsas: tipo ESPECÍFICO (mochila, shoulder bag, clutch, tote, crossbody), tamanho em litros ou cm, cor e texturas, marca se visível, estado de conservação, alças/correntes
   - Chapéus ou bonés: estilo EXATO (boné aba reta, aba curva, bucket hat, fedora, panama), cor, material, logos ou bordados, ajuste
   - Lenços ou echarpes: tamanho, tecido, padrão, como está amarrado/usado
   - Cintos: largura, cor, material, tipo de fivela (metálica, automática), marcas/logos
   - Mochilas: tamanho, número de compartimentos visíveis, marca, estado
   - Luvas: tipo, material, cor, comprimento
   - Qualquer objeto que a pessoa está segurando: descrição completa (smartphone, garrafa d'água, livro, chaves, etc.)
   
   **POSTURA E LINGUAGEM CORPORAL ULTRA-DETALHADA:**
   - Posição do corpo PRECISA (em pé ereto, sentado relaxado, deitado de costas, caminhando em direção à câmera, agachado, inclinado)
   - Distribuição de peso corporal
   - Alinhamento postural (ereta, curvada, torta)
   - Direção do olhar E FOCO: para onde EXATAMENTE está olhando (câmera, horizonte, chão, outra pessoa, objeto específico)
   - Posição dos braços: EXATA (ao longo do corpo, cruzados no peito, mãos nos quadris, um braço levantado)
   - Posição das mãos: DETALHADA (abertas, fechadas, dedos entrelaçados, segurando algo, gesticulando)
   - Posição das pernas (cruzadas, abertas, uma à frente, apoiadas)
   - Expressão facial COMPLETA (músculos faciais ativos, linha da boca, rugas visíveis)
   - Gestos específicos que está fazendo (apontando, acenando, polegar para cima, sinal de paz)
   - Distância aproximada em relação à câmera
   
   **ANÁLISE EMOCIONAL E PSICOLÓGICA AVANÇADA:**
   - Expressão facial MICROSCÓPICA (sorriso genuíno com olhos, sorriso forçado, testa franzida, sobrancelhas levantadas, lábios apertados)
   - Estado emocional COMPLETO (feliz radiante, tristeza profunda, ansiedade moderada, relaxado tranquilo, excitado animado, entediado, surpreso)
   - Microexpressões observáveis (piscar frequente, movimentos sutis da boca, tensão facial)
   - Linguagem corporal emocional (ombros caídos=tristeza, peito aberto=confiança, braços cruzados=defesa)
   - Sinais de estado físico: cansaço (olhos pesados, postura curvada), energia (movimentos vívidos), estresse (tensão visível), dor, desconforto
   - Nível de conforto com a situação
   - Sinais de interação social (conectado/desconectado com outros)
   
   **ATIVIDADES E CONTEXTO COMPORTAMENTAL:**
   - O que EXATAMENTE a pessoa está fazendo (lendo um livro de capa azul, digitando no notebook, tomando café, conversando ao telefone, exercitando-se)
   - Interações com outras pessoas: DETALHADAS (conversando olhando nos olhos, ignorando, rindo juntos, discutindo, colaborando em tarefa)
   - Interação com objetos: ESPECÍFICA (segurando smartphone com mão direita, apoiado em mesa, sentado em cadeira giratória)
   - Localização na cena: PRECISA (canto inferior esquerdo, centro da imagem, ao fundo à direita, plano principal)
   - Movimento implícito (parado, andando, correndo, movimento de braço)

2. **OBJETOS E ELEMENTOS VISÍVEIS** - Identifique ABSOLUTAMENTE TUDO com detalhes extremos:
   
   **MÓVEIS E MOBILIÁRIO:**
   - Tipo ESPECÍFICO (sofá de 3 lugares, cadeira office ergonômica, mesa de jantar retangular, estante modular, rack para TV)
   - Material DETALHADO (madeira maciça de carvalho, MDF laqueado, metal cromado, vime natural, plástico injetado, vidro temperado)
   - Cor EXATA e acabamento (branco brilhante, cinza fosco, madeira natural vernizada, preto matte)
   - Dimensões aproximadas (largura x profundidade x altura em cm)
   - Estilo (moderno minimalista, clássico colonial, industrial, escandinavo, rústico)
   - Condição COMPLETA (novo sem marcas, usado bem conservado, desgastado com arranhões, manchado, quebrado)
   - Posição e orientação no espaço
   - Funcionalidade atual (em uso, vazio, coberto com objetos)
   
   **ELETRÔNICOS E TECNOLOGIA:**
   - Dispositivos ESPECÍFICOS (notebook Dell 15", smartphone iPhone 14 Pro, TV Samsung 55" QLED, tablet iPad, fones Bluetooth)
   - Estado: ligado com tela acesa, desligado, em modo standby, carregando
   - Marcas visíveis e modelos identificáveis
   - Cabos, carregadores, acessórios conectados
   - Conteúdo da tela se visível
   - Idade aparente do dispositivo
   - Posição e distância de outros objetos
   
   **DECORAÇÃO E ARTE:**
   - Quadros: tamanho, tipo de moldura, tema da imagem (paisagem, retrato, abstrato), cores dominantes, estilo artístico
   - Plantas: tipo (suculenta, samambaia, espada-de-são-jorge), tamanho, vaso (material, cor, formato), estado de saúde
   - Ornamentos: descrição completa (vaso decorativo, escultura, bibelô), material, cor, estilo
   - Cortinas: tecido, cor, padrão, estado (abertas, fechadas, semi-abertas)
   - Almofadas: quantidade, cores, padrões, disposição
   - Tapetes: tamanho, padrão, cores, textura aparente
   
   **UTENSÍLIOS E OBJETOS DO DIA-A-DIA:**
   - Ferramentas: tipo específico, marca, estado
   - Livros: títulos se visíveis, cores das capas, tamanho, posição (aberto, fechado, empilhado)
   - Documentos: tipo (folhas avulsas, caderno, revista), quantidade visível
   - Comida: tipo ESPECÍFICO, quantidade, estado (fresco, meio consumido), apresentação
   - Bebida: tipo (água, café, refrigerante), recipiente, nível do líquido
   - Utensílios de cozinha, escrita, higiene pessoal (descreva cada item)
   
   **ARQUITETURA E ESTRUTURA:**
   - Portas: material (madeira, vidro, metal), cor, tipo (convencional, deslizante), estado (aberta, fechada, entreaberta), maçanetas
   - Janelas: tamanho, quantidade, tipo (correr, basculante, guilhotina), vidro (transparente, fosco), presença de grades ou redes
   - Paredes: material aparente (gesso, tijolo aparente, madeira, azulejo), cor, textura, decorações/quadros, tomadas e interruptores visíveis
   - Piso: material (madeira, cerâmica, porcelanato, carpete, vinílico), cor, padrão, estado de conservação, reflexo de luz
   - Teto: altura aproximada, cor, tipo (laje, gesso, madeira), iluminação embutida, ventiladores ou ar-condicionado
   - Rodapés, molduras, detalhes arquitetônicos
   - Localização espacial PRECISA: disposição tridimensional, profundidade, planos (primeiro plano, plano médio, fundo)

3. **AMBIENTE COMPLETO E ATMOSFERA EM DETALHES MÁXIMOS**:
   
   **IDENTIFICAÇÃO E CLASSIFICAÇÃO DO LOCAL:**
   - Tipo ESPECÍFICO de local (cozinha planejada moderna, sala de estar familiar, escritório corporativo, rua comercial urbana, parque público, praia, montanha, ambiente interno/externo)
   - Sub-classificação (se cozinha: gourmet, compacta, industrial; se sala: TV, jantar, estar; se escritório: home office, corporativo aberto, sala de reunião)
   - Propósito aparente do espaço
   
   **DIMENSÕES E LAYOUT ESPACIAL:**
   - Tamanho aproximado do ambiente (pequeno 10-15m², médio 20-40m², grande 50m²+)
   - Pé-direito (altura do teto): baixo 2,4m, médio 2,7m, alto 3m+, pé-direito duplo
   - Formato do espaço (quadrado, retangular, L, aberto integrado)
   - Distribuição dos móveis e objetos
   - Circulação e espaços vazios
   - Profundidade de campo (primeiro plano, médio, fundo)
   
   **ILUMINAÇÃO ULTRA-DETALHADA:**
   - Tipo principal: Natural (luz do dia, sol direto, luz difusa) OU Artificial (LED, incandescente, fluorescente, mista)
   - Intensidade PRECISA: muito escuro, penumbra, iluminado moderado, bem iluminado, muito brilhante, ofuscante
   - Direção da luz: frontal, lateral, superior, contraluz, difusa de várias direções
   - Temperatura de cor: luz fria azulada (6500K+), neutra (4000K), quente amarelada (2700-3000K)
   - Fontes de luz visíveis: janelas (quantidade, tamanho, orientação), luminárias (pendentes, spots, abajures, arandelas), lâmpadas expostas
   - Sombras: duras e definidas, suaves e difusas, ausência de sombras, direção das sombras
   - Reflexos: em superfícies metálicas, vidros, pisos brilhantes, espelhos
   - Contraste: alto contraste com áreas muito escuras e muito claras, baixo contraste suave
   - Hora do dia aparente pela luz: amanhecer dourado, meio-dia intenso, tarde suave, entardecer alaranjado, noite artificial
   
   **CORES E PALETA CROMÁTICA:**
   - Paleta de cores DOMINANTE: monocromática, complementar, análoga, triádica
   - Cores principais do ambiente com percentuais (70% branco, 20% cinza, 10% azul)
   - Cores de destaque e acentos
   - Saturação geral: cores vivas e saturadas, tons pastéis suaves, neutros dessaturados, preto e branco
   - Harmonia cromática: equilibrada, contrastante, caótica
   - Códigos aproximados (branco gelo, cinza chumbo, azul marinho, verde oliva, terracota, bege areia)
   
   **TEXTURAS E MATERIAIS VISÍVEIS:**
   - Texturas TÁTEIS aparentes: liso brilhante (vidro, acrílico), liso fosco (gesso, MDF pintado), áspero (concreto, pedra), macio (tecidos, carpete), granulado (porcelanato, granito)
   - Superfícies: polidas e reflexivas, foscas e absorventes, rugosas, estriadas
   - Materiais identificados: madeira (tipo se possível), metal (inox, ferro, alumínio), vidro, plástico, tecido (algodão, linho, veludo), couro, cerâmica, pedra natural
   - Acabamentos: verniz, laca, pintura, natural sem tratamento
   
   **CLIMA, ATMOSFERA E SENSAÇÃO:**
   - Estilo GERAL: minimalista moderno, clássico tradicional, rústico aconchegante, industrial urbano, boêmio eclético, luxuoso sofisticado, casual despojado
   - Formalidade: muito formal executivo, semi-formal, casual relaxado, informal bagunçado
   - Limpeza e organização: impecável arrumado, organizado funcional, levemente bagunçado, muito desorganizado, sujo
   - Conservação: novo recém-construído, bem mantido, desgaste leve, necessitando reformas, deteriorado
   - Sensação térmica aparente: ambiente fresco/frio, neutro confortável, quente/abafado (por elementos visuais como ventiladores ligados, pessoas com roupas leves)
   - Ventilação: janelas abertas, ar condicionado visível, ventiladores, ambiente fechado
   - Umidade aparente: seco, normal, úmido (condensação, mofo, plantas)
   
   **SONS IMPLÍCITOS (inferidos pela cena visual):**
   - Sons ambientes prováveis: silêncio total, ruído urbano de fundo, trânsito, conversas distantes, música tocando (se há caixas de som), TV ligada, natureza (pássaros, vento, água)
   - Sons de atividades: digitação, passos, objetos sendo manipulados, máquinas funcionando
   - Nível de ruído estimado: ambiente silencioso, moderado, barulhento
   
   **CLIMA METEOROLÓGICO (se ambiente externo ou visível pela janela):**
   - Condições: céu claro ensolarado, parcialmente nublado, nublado fechado, chuvoso, tempestade
   - Fenômenos: sol forte, sombras longas, neblina, chuva, vento (árvores balançando), neve
   - Visibilidade: excelente, boa, reduzida

4. **CONTEXTO, NARRATIVA E HISTÓRIA DA CENA**:
   
   **AÇÃO PRINCIPAL:**
   - O que está acontecendo AGORA na cena: descrição completa da ação central
   - Momento no tempo: antes, durante ou depois de uma ação
   - Movimento: estático parado, movimentos lentos, ação rápida, congelamento de movimento
   
   **HISTÓRIA E SITUAÇÃO:**
   - Possível narrativa completa: qual história esta cena conta?
   - Contexto social: reunião de trabalho, encontro familiar, momento solitário, evento público, situação casual
   - Propósito da cena: fotografia posada, momento espontâneo, documentação, artística
   - O que pode ter acontecido antes e o que pode acontecer depois
   
   **RELAÇÕES E INTERAÇÕES:**
   - Relações entre pessoas visíveis: familiares, amigos, colegas, estranhos, distantes, próximos
   - Dinâmica social: colaborativa, competitiva, harmoniosa, tensa
   - Relações pessoa-objeto: interação ativa (usando), posse (segurando), proximidade
   - Relações pessoa-ambiente: confortável, deslocada, integrada, dominante na cena
   - Hierarquia visual: quem/o que é o foco principal, secundário, fundo
   
   **TEMPORALIDADE:**
   - Hora do dia ESPECÍFICA (inferida pela luz e atividades): 06h-09h manhã, 09h-12h meio da manhã, 12h-14h meio-dia, 14h-17h tarde, 17h-20h fim de tarde/noite, 20h+ noite
   - Estação do ano aparente (roupas, decoração, luz): primavera, verão, outono, inverno
   - Época: contemporânea, recente, passado (indicadores temporais)
   - Momento do ciclo: início (chegando), meio (acontecendo), fim (saindo)
   
   **CONTEXTO CULTURAL E SOCIAL:**
   - Indicadores culturais: bandeiras, símbolos, idiomas visíveis, objetos típicos
   - Classe social aparente: indicadores de poder aquisitivo
   - Contexto geográfico: urbano/rural, país/região (se identificável)

5. **DETALHES CRÍTICOS DE ACESSIBILIDADE PARA PESSOAS COM DEFICIÊNCIA VISUAL**:
   
   **MOBILIDADE E NAVEGAÇÃO:**
   - Obstáculos físicos ESPECÍFICOS: móveis baixos que podem causar tropeço, objetos no chão, degraus, desníveis, portas estreitas, passagens bloqueadas
   - Facilidades de mobilidade: corredores amplos (largura em metros), espaço livre para circulação, rampas, elevadores, corrimãos
   - Superfícies do piso: lisa fácil de andar, irregular com risco de tropeço, escorregadia (molhada, encerada), com textura de alerta
   - Mudanças de nível: degraus (quantidade, altura), rampas (inclinação), elevações
   
   **ELEMENTOS DE SEGURANÇA:**
   - Sinalizações de segurança visíveis: saída de emergência, extintor, placas de atenção/perigo
   - Iluminação de segurança: boa visibilidade geral, áreas escuras perigosas
   - Riscos identificados: objetos pontiagudos, bordas afiadas, superfícies quentes, áreas de risco de queda
   - Elementos de proteção: grades em janelas, proteções em escadas, tapetes antiderrapantes
   
   **PONTOS DE REFERÊNCIA IMPORTANTES:**
   - Marcos visuais principais para orientação: porta de entrada (posição), janelas grandes, móveis dominantes, paredes coloridas
   - Elementos fixos que servem de referência: colunas, pilares, divisórias, bancadas fixas
   - Características únicas do ambiente: qualquer elemento distintivo para ajudar na orientação espacial
   - Sinalização tátil se visível: piso tátil, braile, texturas de alerta
   
   **INFORMAÇÕES TEXTUAIS E VISUAIS:**
   - Texto visível: placas, avisos, etiquetas, letreiros (transcrever tudo)
   - Símbolos e ícones: banheiro, acessibilidade, proibido, atenção (descrever cada um)
   - Cores codificadas: verde=seguro, vermelho=perigo, azul=informação
   
   **CONFORTO E USABILIDADE:**
   - Ergonomia aparente: móveis adaptados, altura acessível
   - Espaço pessoal: densidade de objetos/pessoas, sensação de aperto ou amplitude
   - Conforto ambiental: temperatura aparente, ventilação, nível de ruído estimado

Forneça uma resposta JSON COMPLETA em português com esta estrutura:
{
  "objects": [
    {
      "label": "pessoa/objeto específico", 
      "confidence": 0.95, 
      "description": "descrição ULTRA-DETALHADA em português com todos os detalhes possíveis (mínimo 100 palavras por objeto importante)",
      "position": "localização exata na cena (canto superior esquerdo, centro, primeiro plano à direita)",
      "colors": ["cor1 exata", "cor2 exata", "cor3 exata"],
      "materials": ["material1", "material2"],
      "size": "tamanho aproximado (pequeno, médio, grande, dimensões se possível)",
      "emotions": {
        "expression": "descrição microscópica da expressão",
        "emotional_state": "estado emocional profundamente detalhado",
        "is_smiling": true/false,
        "sentiment": "análise psicológica completa do sentimento",
        "energy_level": "nível de energia com justificativa detalhada",
        "body_language": "linguagem corporal completa"
      }
    }
  ],
  "environment": {
    "type": "tipo específico do local",
    "dimensions": "tamanho aproximado do espaço",
    "lighting": {
      "type": "natural/artificial/mista",
      "intensity": "nível de intensidade",
      "temperature": "quente/neutra/fria",
      "time_of_day": "hora aparente do dia"
    },
    "colors": {
      "dominant": ["cor1", "cor2", "cor3"],
      "accents": ["cor4", "cor5"]
    },
    "atmosphere": "descrição completa da atmosfera e sensação",
    "sounds_implied": ["som1 provável", "som2 provável"]
  },
  "description": "DESCRIÇÃO NARRATIVA ULTRA-RICA, EXTREMAMENTE DETALHADA E COMPLETA da cena em português brasileiro. Imagine que você está descrevendo para uma pessoa TOTALMENTE CEGA e precisa transmitir ABSOLUTAMENTE TUDO que você vê com o máximo de detalhes possível. Inclua cores exatas, texturas, materiais, posições espaciais, distâncias, tamanhos, estados emocionais, expressões faciais, roupas com todos os detalhes, acessórios, ambiente completo, iluminação, atmosfera, o que está acontecendo, relações entre elementos. Mínimo 300 palavras. Esta descrição deve ser tão rica que a pessoa cega consiga formar uma imagem mental completa e precisa da cena.",
  "overall_sentiment": "análise psicológica profunda do sentimento, atmosfera geral, emoções transmitidas pela cena completa",
  "accessibility_notes": "informações críticas para acessibilidade, navegação, segurança, obstáculos, pontos de referência, texto visível transcrito",
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
  },
  "visual_details": {
    "dominant_colors": ["lista de cores dominantes com nomes exatos"],
    "textures": ["lista de texturas visíveis"],
    "patterns": ["lista de padrões identificados"],
    "text_visible": "TODO texto visível na imagem transcrito aqui",
    "brands_logos": ["marcas e logos identificados"]
  },
  "spatial_analysis": {
    "depth": "análise de profundidade (primeiro plano, meio, fundo)",
    "perspective": "tipo de perspectiva e ângulo da câmera",
    "distances": "distâncias aproximadas entre elementos principais"
  }
}

IMPORTANTE: 
- Para emotion_analysis e sentiment_analysis, conte QUANTAS PESSOAS na imagem apresentam cada emoção/sentimento. 
- Por exemplo, se há 3 pessoas sorrindo, coloque "sorrindo": 3. Se há 2 pessoas com sentimento positivo, coloque "positivo": 2.
- A "description" deve ser EXTREMAMENTE detalhada, mínimo 300 palavras, descrevendo TUDO que você vê.
- Transcreva TODO texto visível em "text_visible".
- Seja incrivelmente específico em cores (não apenas "azul", mas "azul marinho profundo"), texturas, materiais, posições.

🇧🇷 LEMBRE-SE: TODA A DESCRIÇÃO DEVE ESTAR EM PORTUGUÊS BRASILEIRO COM MÁXIMO DETALHAMENTO! NÃO USE INGLÊS! 🇧🇷"""
            
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
        
        # Process geolocation if provided
        if input.geo_location:
            detection.geo_location = GeoLocation(**input.geo_location)
        
        # Auto-categorize detection
        detection.category = auto_categorize_detection(detection)
        
        # Generate smart tags
        detection.tags = generate_tags(detection)
        
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
        if doc.get('geo_location') and doc['geo_location'].get('timestamp'):
            doc['geo_location']['timestamp'] = doc['geo_location']['timestamp'].isoformat()
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
        nutrition_prompt = """
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
{
  "description": "descrição científica completa e detalhada da refeição",
  "nutritional_analysis": {
    "foods_detected": [
      {
        "name": "nome do alimento",
        "scientific_name": "nome científico quando aplicável",
        "preparation_method": "método de preparo",
        "calories_per_100g": 0.0,
        "estimated_portion_grams": 0.0,
        "total_calories": 0.0,
        "macronutrients": {
          "protein": 0.0,
          "carbohydrates": 0.0,
          "fat": 0.0,
          "fiber": 0.0
        },
        "detailed_fats": {
          "saturated": 0.0,
          "monounsaturated": 0.0,
          "polyunsaturated": 0.0,
          "trans": 0.0
        },
        "carb_types": {
          "simple": 0.0,
          "complex": 0.0
        },
        "glycemic_index": 55,
        "micronutrients": {
          "vitamin_a": 0.0,
          "vitamin_c": 0.0,
          "vitamin_d": 0.0,
          "calcium": 0.0,
          "iron": 0.0,
          "magnesium": 0.0,
          "potassium": 0.0,
          "sodium": 0.0
        },
        "confidence": 0.9
      }
    ],
    "total_calories": 0.0,
    "total_weight_grams": 0.0,
    "meal_type": "café da manhã/almoço/jantar/lanche/pré-treino/pós-treino",
    "nutritional_summary": {
      "total_protein": 0.0,
      "total_carbs": 0.0,
      "total_fat": 0.0,
      "total_fiber": 0.0,
      "total_saturated_fat": 0.0,
      "total_sodium": 0.0
    },
    "quality_score": 75,
    "nutritional_balance": {
      "protein_percent": 20.0,
      "carbs_percent": 50.0,
      "fat_percent": 30.0
    },
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
    "dietary_compatibility": {
      "vegetarian": true/false,
      "vegan": true/false,
      "low_carb": true/false,
      "keto": true/false,
      "mediterranean": true/false,
      "gluten_free": true/false,
      "lactose_free": true/false,
      "diabetic_friendly": true/false
    },
    "ideal_consumption_time": "descrição do melhor momento",
    "dri_adequacy": {
      "protein": 35.5,
      "fiber": 20.0,
      "vitamin_c": 45.0,
      "calcium": 15.0,
      "iron": 25.0
    }
  }
}

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
                        logging.error("Max retries reached for nutrition analysis")
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
        
        # Process geolocation if provided
        if input.geo_location:
            detection.geo_location = GeoLocation(**input.geo_location)
        
        # Auto-categorize detection
        detection.category = auto_categorize_detection(detection)
        
        # Generate smart tags
        detection.tags = generate_tags(detection)
        
        # Save to database
        doc = detection.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        if doc.get('geo_location') and doc['geo_location'].get('timestamp'):
            doc['geo_location']['timestamp'] = doc['geo_location']['timestamp'].isoformat()
        await db.detections.insert_one(doc)
        
        return detection
        
    except HTTPException:
        raise  # Re-raise HTTPException as-is (preserves status code)
    except Exception as e:
        logging.error(f"Error analyzing nutrition: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/detect/read-text", response_model=Detection)
async def read_text_ocr(input: DetectionCreate, request: Request):
    """OCR especializado para leitura de textos - livros, quadros, documentos"""
    try:
        # Get authenticated user
        auth_header = request.headers.get("Authorization")
        user_id = get_current_user(auth_header)
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        detection = Detection(
            source=input.source,
            detection_type="text_reading",  # Novo tipo
            image_data=input.image_data,
            user_id=user_id
        )
        
        # Extract base64 image data
        image_data = input.image_data.split(',')[1] if ',' in input.image_data else input.image_data
        
        # OCR Ultra-Detailed Prompt
        ocr_prompt = """🇧🇷 RESPONDA EXCLUSIVAMENTE EM PORTUGUÊS BRASILEIRO 🇧🇷

Você é um especialista em OCR (Optical Character Recognition) e análise de documentos para ACESSIBILIDADE.
Sua missão é extrair e descrever TODO O TEXTO visível na imagem de forma EXTREMAMENTE DETALHADA.

IMPORTANTE: TODA A RESPOSTA DEVE SER EM PORTUGUÊS DO BRASIL!

**TIPOS DE CONTEÚDO QUE VOCÊ DEVE ANALISAR:**
1. 📖 Páginas de livros (capítulos, parágrafos, notas de rodapé)
2. 📝 Quadros de aula (anotações, diagramas, fórmulas)
3. 📄 Documentos (contratos, formulários, cartas)
4. 📰 Jornais e revistas
5. 🏷️ Placas, avisos e sinalizações
6. 💳 Cartões, tickets e recibos
7. 📱 Telas de dispositivos

**ANÁLISE COMPLETA E ESTRUTURADA:**

1. **TIPO DE DOCUMENTO/CONTEÚDO:**
   - Identifique o que é (livro, quadro, placa, etc.)
   - Idioma do texto
   - Estado de conservação
   - Qualidade da imagem

2. **ESTRUTURA DO DOCUMENTO:**
   - Título principal (se houver)
   - Subtítulos e seções
   - Hierarquia da informação
   - Layout e organização visual

3. **EXTRAÇÃO COMPLETA DO TEXTO:**
   - Transcreva TODO o texto visível, palavra por palavra
   - Preserve quebras de linha e parágrafos
   - Mantenha a ordem de leitura natural
   - Indique formatação especial (negrito, itálico, sublinhado)
   - Transcreva números, fórmulas matemáticas, símbolos

4. **ELEMENTOS VISUAIS:**
   - Diagramas, gráficos, tabelas (descreva estrutura e conteúdo)
   - Imagens ou ilustrações (descreva brevemente)
   - Linhas, setas, destaque visual
   - Cores usadas para destacar informação

5. **ANOTAÇÕES E MARCAÇÕES:**
   - Texto manuscrito ou anotações à mão
   - Sublinhados, marcações, post-its
   - Correções ou rasuras

6. **CONTEXTO ADICIONAL:**
   - Número de página (se visível)
   - Data ou referências temporais
   - Autor ou fonte (se identificável)
   - Qualquer informação contextual relevante

7. **LEGIBILIDADE E QUALIDADE:**
   - Partes do texto ilegíveis ou borradas
   - Dificuldades de leitura
   - Sugestões para melhor captura

Forneça uma resposta JSON COMPLETA em português com esta estrutura:
{
  "document_type": "tipo do documento (livro, quadro, placa, etc.)",
  "language": "idioma do texto",
  "title": "título principal se houver",
  "full_text": "TEXTO COMPLETO extraído preservando formatação e ordem",
  "structured_content": {
    "sections": [
      {
        "heading": "título da seção",
        "content": "conteúdo da seção",
        "subsections": []
      }
    ],
    "lists": [
      {
        "type": "ordered/unordered",
        "items": ["item 1", "item 2"]
      }
    ],
    "tables": [
      {
        "description": "descrição da tabela",
        "rows": 5,
        "columns": 3,
        "content": "conteúdo textual da tabela"
      }
    ],
    "formulas": [
      {
        "formula": "fórmula matemática",
        "description": "explicação da fórmula"
      }
    ]
  },
  "visual_elements": [
    {
      "type": "diagram/image/chart",
      "description": "descrição detalhada",
      "position": "localização na página"
    }
  ],
  "handwritten_notes": [
    "anotação manuscrita 1",
    "anotação manuscrita 2"
  ],
  "metadata": {
    "page_number": "número da página se visível",
    "author": "autor se identificável",
    "date": "data se presente",
    "quality": "excelente/boa/regular/ruim"
  },
  "accessibility_notes": "informações adicionais para pessoas com deficiência visual",
  "reading_order": "ordem recomendada de leitura do conteúdo",
  "description": "DESCRIÇÃO NARRATIVA COMPLETA: Um resumo de TUDO que foi lido, como se estivesse narrando para uma pessoa cega, incluindo TODO o texto, estrutura, elementos visuais e contexto"
}

**DIRETRIZES CRÍTICAS:**
- 🇧🇷 TODA A RESPOSTA DEVE SER EM PORTUGUÊS BRASILEIRO
- Transcreva TUDO que conseguir ler, não omita nada
- Se uma palavra estiver ilegível, indique: [palavra ilegível]
- Se faltar uma seção, indique: [conteúdo não visível]
- Seja EXTREMAMENTE detalhado na descrição narrativa
- Pense em acessibilidade: uma pessoa cega precisa entender TUDO
- Preserve a estrutura e hierarquia do texto original

🇧🇷 LEMBRE-SE: RESPOSTA 100% EM PORTUGUÊS DO BRASIL! 🇧🇷"""
        
        # Process via Gemini 2.0 Flash with retry logic
        max_retries = 3
        retry_delay = 2
        response = None
        last_error = None
        
        for attempt in range(max_retries):
            try:
                chat = LlmChat(
                    api_key=GOOGLE_API_KEY,
                    session_id=f"ocr_analysis_{uuid.uuid4()}",
                    system_message="Você é um especialista em OCR e análise de documentos para acessibilidade. RESPONDA SEMPRE EM PORTUGUÊS BRASILEIRO. Extraia e descreva TODO o texto visível nas imagens com máximo detalhamento."
                ).with_model("gemini", "gemini-2.0-flash")
                
                response = await chat.send_message(
                    UserMessage(
                        text=ocr_prompt,
                        file_contents=[ImageContent(image_base64=image_data)]
                    )
                )
                
                # If we got here, request succeeded
                break
                
            except Exception as e:
                last_error = e
                error_msg = str(e).lower()
                
                # Check if it's a retryable error
                if '503' in error_msg or 'overloaded' in error_msg or 'rate' in error_msg:
                    if attempt < max_retries - 1:
                        logging.warning(f"Gemini API overloaded, retrying in {retry_delay}s... (attempt {attempt + 1}/{max_retries})")
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
            response_text = response.strip()
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()
            
            result = json.loads(response_text)
            
            # Store the full OCR result in description
            detection.description = result.get('description', '')
            
            # Store full text and structured content in objects_detected for easier access
            if result.get('full_text'):
                detection.objects_detected = [
                    DetectedObject(
                        label="Texto Completo",
                        confidence=0.95,
                        description=result.get('full_text', '')
                    )
                ]
            
        except json.JSONDecodeError as e:
            logging.error(f"JSON parsing failed for OCR: {str(e)}")
            # Use raw response as description
            detection.description = response_text if 'response_text' in locals() else str(response)
        except Exception as e:
            logging.error(f"Error processing OCR data: {str(e)}")
            detection.description = response_text if 'response_text' in locals() else str(response)
        
        # Process geolocation if provided
        if input.geo_location:
            detection.geo_location = GeoLocation(**input.geo_location)
        
        # Auto-categorize detection
        detection.category = auto_categorize_detection(detection)
        
        # Generate smart tags
        detection.tags = generate_tags(detection)
        
        # Save to database
        doc = detection.model_dump()
        doc['timestamp'] = doc['timestamp'].isoformat()
        if doc.get('geo_location') and doc['geo_location'].get('timestamp'):
            doc['geo_location']['timestamp'] = doc['geo_location']['timestamp'].isoformat()
        await db.detections.insert_one(doc)
        
        return detection
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error in OCR text reading: {str(e)}")
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
        
        # Determine user type - HARDCODED ADMIN
        # Only aruanasistema@gmail.com gets admin privileges
        user_type = "admin" if user_data.email.lower() == "aruanasistema@gmail.com" else "user"
        
        # Create user
        user = User(
            name=user_data.name,
            email=user_data.email,
            password_hash=password_hash,
            user_type=user_type
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

# ==================== ADMIN ENDPOINTS ====================

@api_router.get("/admin/users")
async def get_all_users(request: Request):
    """Admin: Get all users"""
    auth_header = request.headers.get("Authorization")
    user_id = get_current_user(auth_header)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if user is admin
    current_user = await db.users.find_one({"id": user_id})
    if not current_user or current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get all users
    users = await db.users.find(
        {},
        {"_id": 0, "password_hash": 0, "reset_token": 0, "reset_token_expiry": 0}
    ).to_list(1000)
    
    return users

@api_router.put("/admin/users/{user_id}")
async def update_user(request: Request, user_id: str, update_data: dict):
    """Admin: Update any user"""
    auth_header = request.headers.get("Authorization")
    current_user_id = get_current_user(auth_header)
    
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if user is admin
    current_user = await db.users.find_one({"id": current_user_id})
    if not current_user or current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Remove sensitive fields from update
    update_data.pop('password_hash', None)
    update_data.pop('id', None)
    
    # Update user
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "message": "User updated"}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(request: Request, user_id: str):
    """Admin: Delete user"""
    auth_header = request.headers.get("Authorization")
    current_user_id = get_current_user(auth_header)
    
    if not current_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if user is admin
    current_user = await db.users.find_one({"id": current_user_id})
    if not current_user or current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Prevent deleting self
    if user_id == current_user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    # Delete user
    result = await db.users.delete_one({"id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"success": True, "message": "User deleted"}

@api_router.get("/admin/stats")
async def get_admin_stats(request: Request):
    """Admin: Get system statistics"""
    auth_header = request.headers.get("Authorization")
    user_id = get_current_user(auth_header)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if user is admin
    current_user = await db.users.find_one({"id": user_id})
    if not current_user or current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get statistics
    total_users = await db.users.count_documents({})
    total_detections = await db.detections.count_documents({})
    total_alerts = await db.alerts.count_documents({})
    
    return {
        "total_users": total_users,
        "total_detections": total_detections,
        "total_alerts": total_alerts
    }

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

@app.on_event("startup")
async def create_default_admin():
    """Create default admin user if not exists"""
    try:
        admin_email = "aruanasistema@gmail.com"
        admin_password = "Ricardo@2025"
        
        # Check if admin exists
        existing_admin = await db.users.find_one({"email": admin_email})
        
        if not existing_admin:
            # Create admin user
            password_hash = pwd_context.hash(admin_password)
            admin_user = {
                "id": str(uuid.uuid4()),
                "name": "Administrador ARUANÃ",
                "email": admin_email,
                "password_hash": password_hash,
                "user_type": "admin",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "is_active": True
            }
            await db.users.insert_one(admin_user)
            logging.info(f"✅ Default admin user created: {admin_email}")
        else:
            logging.info(f"✅ Admin user already exists: {admin_email}")
            
    except Exception as e:
        logging.error(f"Error creating default admin: {str(e)}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()