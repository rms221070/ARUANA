import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Square, Loader2, Upload, Apple, Calculator, Target, History } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import EmotionAnalysis from "@/components/EmotionAnalysis";
import AdvancedNutritionReport from "@/components/AdvancedNutritionReport";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NutritionAnalysis = () => {
  const { t } = useTranslation();
  const { settings, narrate, narrateInterface } = useSettings();
  const { token, getToken } = useAuth();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [analysisMode, setAnalysisMode] = useState("camera"); // "camera" or "upload"
  const [uploadFile, setUploadFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [nutritionHistory, setNutritionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Narrate component when loaded
    narrateInterface('panel', t('nutrition.title'), t('nutrition.description'));
    
    // Load nutrition history
    loadNutritionHistory();
    
    return () => {
      stopWebcam();
    };
  }, []);

  // Function to get geolocation
  const getCurrentLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation not supported');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const geoData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          console.log('Geolocation captured:', geoData);
          resolve(geoData);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          resolve(null); // Don't fail if geolocation fails
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  };

  const startWebcam = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: { ideal: "environment" },
          frameRate: { ideal: 30, max: 60 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
        setCapturedImage(null);
        setShowPreview(false);
        narrate(t('nutrition.cameraStarted'));
      }
    } catch (error) {
      const errorMsg = t('nutrition.cameraError') + ": " + error.message;
      toast.error(errorMsg);
      narrate(errorMsg);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    narrate(t('nutrition.cameraStopped'));
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current) return;

    setIsAnalyzing(true);
    narrate(t('nutrition.capturingFood'));
    
    // Create canvas with better quality settings
    const canvas = document.createElement("canvas");
    const video = videoRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    
    // Draw the current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    
    // Show captured image preview
    setCapturedImage(imageData);
    setShowPreview(true);
    stopWebcam();
    
    await analyzeNutrition(imageData);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        narrate(t('nutrition.fileSelected') + ': ' + file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeUploadedFile = async () => {
    if (!uploadFile || !previewUrl) {
      toast.error(t('nutrition.selectFileFirst'));
      return;
    }

    setIsAnalyzing(true);
    await analyzeNutrition(previewUrl);
  };

  const analyzeNutrition = async (imageData) => {
    try {
      // Get the current token
      const authToken = getToken();
      
      if (!authToken) {
        toast.error('Você precisa fazer login para usar esta funcionalidade');
        narrate('Você precisa fazer login para usar esta funcionalidade');
        setIsAnalyzing(false);
        return;
      }

      narrate(t('nutrition.analyzingFood'));

      const response = await axios.post(`${API}/detect/analyze-nutrition`, {
        source: analysisMode,
        detection_type: "nutrition",
        image_data: imageData
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 seconds timeout
      });

      setLastAnalysis(response.data);
      
      // COMPLETE NUTRITION NARRATION
      let completeNarration = t('nutrition.analysisComplete') + '. ';
      
      // 1. Main description
      if (response.data.description) {
        completeNarration += t('nutrition.foodDescription') + ': ' + response.data.description + '. ';
      }
      
      // 2. Nutritional analysis narration
      if (response.data.nutritional_analysis && response.data.nutritional_analysis.foods_detected.length > 0) {
        const nutrition = response.data.nutritional_analysis;
        
        completeNarration += t('nutrition.foodsDetected') + ': ';
        nutrition.foods_detected.forEach((food, index) => {
          completeNarration += `${food.name}, ${Math.round(food.total_calories)} ${t('nutrition.calories')}`;
          if (index < nutrition.foods_detected.length - 1) completeNarration += ', ';
        });
        completeNarration += '. ';
        
        completeNarration += `${t('nutrition.totalCalories')}: ${Math.round(nutrition.total_calories)} ${t('nutrition.calories')}. `;
        
        if (nutrition.meal_type) {
          completeNarration += `${t('nutrition.mealType')}: ${nutrition.meal_type}. `;
        }
        
        // Macronutrients
        if (nutrition.nutritional_summary) {
          const summary = nutrition.nutritional_summary;
          completeNarration += `${t('nutrition.macronutrients')}: `;
          completeNarration += `${t('nutrition.protein')} ${Math.round(summary.total_protein || 0)}g, `;
          completeNarration += `${t('nutrition.carbs')} ${Math.round(summary.total_carbs || 0)}g, `;
          completeNarration += `${t('nutrition.fat')} ${Math.round(summary.total_fat || 0)}g, `;
          completeNarration += `${t('nutrition.fiber')} ${Math.round(summary.total_fiber || 0)}g. `;
        }
      } else {
        completeNarration += t('nutrition.noFoodsDetected') + '. ';
      }
      
      // Narrate the complete analysis
      narrate(completeNarration);
      toast.success(t('nutrition.analysisSuccess'));
      
    } catch (error) {
      console.error('Nutrition analysis error:', error);
      let errorMsg = t('nutrition.analysisError');
      
      if (error.response) {
        // Server responded with error
        errorMsg += `: ${error.response.data?.detail || error.response.statusText}`;
        if (error.response.status === 401) {
          errorMsg = 'Sessão expirada. Faça login novamente.';
        }
      } else if (error.request) {
        // Request made but no response
        errorMsg += ': Sem resposta do servidor. Verifique sua conexão.';
      } else {
        // Error setting up request
        errorMsg += `: ${error.message}`;
      }
      
      toast.error(errorMsg);
      narrate(errorMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadNutritionHistory = async () => {
    try {
      const authToken = getToken();
      if (!authToken) {
        console.warn('No auth token available for loading history');
        return;
      }
      
      const response = await axios.get(`${API}/detections?limit=20`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      // Filter only nutrition detections
      const nutritionDetections = response.data.filter(d => d.detection_type === 'nutrition');
      setNutritionHistory(nutritionDetections);
    } catch (error) {
      console.error('Error loading nutrition history:', error);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setShowPreview(false);
    setLastAnalysis(null);
    startWebcam();
    narrate(t('nutrition.retakingPhoto'));
  };

  const clearUpload = () => {
    setUploadFile(null);
    setPreviewUrl(null);
    setLastAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    narrate(t('nutrition.uploadCleared'));
  };

  return (
    <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6" data-testid="nutrition-analysis-container">
      {/* Camera/Upload Section */}
      <Card className={`${settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-white/95 backdrop-blur-sm border-green-200 shadow-lg'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={`text-xl font-bold ${settings.highContrast ? 'text-white' : 'text-slate-800'} flex items-center gap-2`}>
                <Apple className="w-5 h-5 text-green-600" />
                {t('nutrition.title')}
              </CardTitle>
              <p className={`text-sm ${settings.highContrast ? 'text-gray-300' : 'text-slate-600'}`}>
                {t('nutrition.description')}
              </p>
            </div>
            <Button
              onClick={() => {
                setShowHistory(!showHistory);
                narrate(showHistory ? 'Fechando histórico' : 'Abrindo histórico nutricional');
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              {showHistory ? 'Ocultar' : 'Histórico'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Selection */}
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setAnalysisMode("camera");
                narrateInterface('button', t('nutrition.cameraMode'));
              }}
              variant={analysisMode === "camera" ? "default" : "outline"}
              className="flex-1"
            >
              <Camera className="w-4 h-4 mr-2" />
              {t('nutrition.cameraMode')}
            </Button>
            <Button
              onClick={() => {
                setAnalysisMode("upload");
                narrateInterface('button', t('nutrition.uploadMode'));
              }}
              variant={analysisMode === "upload" ? "default" : "outline"}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              {t('nutrition.uploadMode')}
            </Button>
          </div>

          {/* Camera Mode */}
          {analysisMode === "camera" && (
            <>
              <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
                {showPreview && capturedImage ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={capturedImage} 
                      alt={t('nutrition.capturedFood')}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      {t('nutrition.captured')}
                    </div>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="flex gap-3 flex-wrap">
                {!isStreaming && !showPreview ? (
                  <Button
                    onClick={startWebcam}
                    className="flex-1 min-w-[200px] bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {t('nutrition.startCamera')}
                  </Button>
                ) : showPreview ? (
                  <>
                    <Button
                      onClick={retakePhoto}
                      variant="outline"
                      className="flex-1 min-w-[140px]"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {t('nutrition.retake')}
                    </Button>
                    {!isAnalyzing && !lastAnalysis && (
                      <Button
                        onClick={() => analyzeNutrition(capturedImage)}
                        disabled={isAnalyzing}
                        className="flex-1 min-w-[140px] bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white"
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        {t('nutrition.analyzeFood')}
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      onClick={stopWebcam}
                      variant="destructive"
                      className="flex-1 min-w-[100px]"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      {t('nutrition.stop')}
                    </Button>
                    <Button
                      onClick={captureAndAnalyze}
                      disabled={isAnalyzing}
                      className="flex-1 min-w-[140px] bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('nutrition.analyzing')}
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          {t('nutrition.captureAndAnalyze')}
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </>
          )}

          {/* Upload Mode */}
          {analysisMode === "upload" && (
            <>
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {previewUrl ? (
                  <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden">
                    <img 
                      src={previewUrl} 
                      alt={t('nutrition.uploadedFood')}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      settings.highContrast 
                        ? 'border-gray-600 bg-gray-800 hover:bg-gray-700' 
                        : 'border-green-300 bg-green-50 hover:bg-green-100'
                    }`}
                  >
                    <Upload className={`w-12 h-12 mx-auto mb-4 ${settings.highContrast ? 'text-gray-400' : 'text-green-400'}`} />
                    <p className={`text-sm ${settings.highContrast ? 'text-gray-300' : 'text-slate-600'}`}>
                      {t('nutrition.clickToUpload')}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  {previewUrl ? (
                    <>
                      <Button
                        onClick={clearUpload}
                        variant="outline"
                        className="flex-1"
                      >
                        {t('nutrition.clearUpload')}
                      </Button>
                      <Button
                        onClick={analyzeUploadedFile}
                        disabled={isAnalyzing}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {t('nutrition.analyzing')}
                          </>
                        ) : (
                          <>
                            <Calculator className="w-4 h-4 mr-2" />
                            {t('nutrition.analyzeFood')}
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {t('nutrition.selectFile')}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card className={`${settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-white/95 backdrop-blur-sm border-orange-200 shadow-lg'}`}>
        <CardHeader>
          <CardTitle className={`text-xl font-bold ${settings.highContrast ? 'text-white' : 'text-slate-800'} flex items-center gap-2`}>
            <Target className="w-5 h-5 text-orange-600" />
            {t('nutrition.results')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lastAnalysis && lastAnalysis.nutritional_analysis ? (
            <div className="space-y-4">
              {/* Description */}
              <div className={`p-4 rounded-lg ${settings.highContrast ? 'bg-gray-800' : 'bg-slate-50'}`}>
                <h3 className={`font-semibold mb-2 ${settings.highContrast ? 'text-white' : 'text-slate-800'}`}>
                  {t('nutrition.description')}
                </h3>
                <p className={`text-sm ${settings.highContrast ? 'text-gray-300' : 'text-slate-600'}`}>
                  {lastAnalysis.description}
                </p>
              </div>

              {/* Foods Detected */}
              {lastAnalysis.nutritional_analysis.foods_detected.length > 0 && (
                <div className="space-y-3">
                  <h3 className={`font-semibold ${settings.highContrast ? 'text-white' : 'text-slate-800'}`}>
                    {t('nutrition.foodsDetected')}
                  </h3>
                  {lastAnalysis.nutritional_analysis.foods_detected.map((food, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${settings.highContrast ? 'bg-gray-800 border-gray-600' : 'bg-green-50 border-green-200'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`font-medium ${settings.highContrast ? 'text-white' : 'text-green-800'}`}>
                          {food.name}
                        </h4>
                        <span className={`text-lg font-bold ${settings.highContrast ? 'text-orange-400' : 'text-orange-600'}`}>
                          {Math.round(food.total_calories)} {t('nutrition.calories')}
                        </span>
                      </div>
                      <div className={`text-xs space-y-1 ${settings.highContrast ? 'text-gray-300' : 'text-green-700'}`}>
                        <p>{t('nutrition.portion')}: {Math.round(food.estimated_portion_grams)}g</p>
                        <div className="flex gap-4">
                          <span>P: {Math.round(food.macronutrients?.protein || 0)}g</span>
                          <span>C: {Math.round(food.macronutrients?.carbohydrates || 0)}g</span>
                          <span>G: {Math.round(food.macronutrients?.fat || 0)}g</span>
                          <span>F: {Math.round(food.macronutrients?.fiber || 0)}g</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total Summary */}
              <div className={`p-4 rounded-lg border-2 ${settings.highContrast ? 'bg-gray-800 border-orange-400' : 'bg-orange-50 border-orange-300'}`}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`font-bold ${settings.highContrast ? 'text-white' : 'text-orange-800'}`}>
                    {t('nutrition.totalSummary')}
                  </h3>
                  <span className={`text-2xl font-bold ${settings.highContrast ? 'text-orange-400' : 'text-orange-600'}`}>
                    {Math.round(lastAnalysis.nutritional_analysis.total_calories)} {t('nutrition.calories')}
                  </span>
                </div>
                
                {lastAnalysis.nutritional_analysis.meal_type && (
                  <p className={`text-sm mb-2 ${settings.highContrast ? 'text-gray-300' : 'text-orange-700'}`}>
                    {t('nutrition.mealType')}: {lastAnalysis.nutritional_analysis.meal_type}
                  </p>
                )}
                
                {lastAnalysis.nutritional_analysis.nutritional_summary && (
                  <div className={`text-sm space-y-1 ${settings.highContrast ? 'text-gray-300' : 'text-orange-700'}`}>
                    <div className="grid grid-cols-2 gap-2">
                      <span>{t('nutrition.protein')}: {Math.round(lastAnalysis.nutritional_analysis.nutritional_summary.total_protein || 0)}g</span>
                      <span>{t('nutrition.carbs')}: {Math.round(lastAnalysis.nutritional_analysis.nutritional_summary.total_carbs || 0)}g</span>
                      <span>{t('nutrition.fat')}: {Math.round(lastAnalysis.nutritional_analysis.nutritional_summary.total_fat || 0)}g</span>
                      <span>{t('nutrition.fiber')}: {Math.round(lastAnalysis.nutritional_analysis.nutritional_summary.total_fiber || 0)}g</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced PhD-Level Nutrition Report */}
              <AdvancedNutritionReport analysis={lastAnalysis} />
            </div>
          ) : (
            <div className={`text-center py-12 ${settings.highContrast ? 'text-gray-400' : 'text-slate-400'}`}>
              <Apple className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>{t('nutrition.noAnalysis')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nutrition History Panel */}
      {showHistory && (
        <Card className={`lg:col-span-2 ${settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-white/95 backdrop-blur-sm border-green-200 shadow-lg'}`}>
          <CardHeader>
            <CardTitle className={`text-xl font-bold ${settings.highContrast ? 'text-white' : 'text-slate-800'} flex items-center gap-2`}>
              <History className="w-5 h-5 text-green-600" />
              Histórico de Análises Nutricionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nutritionHistory.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {nutritionHistory.map((detection) => (
                  <div 
                    key={detection.id}
                    className={`p-4 rounded-xl border-2 ${
                      settings.highContrast 
                        ? 'bg-gray-800 border-white' 
                        : 'bg-gradient-to-r from-green-50 to-orange-50 border-green-300'
                    } cursor-pointer hover:scale-[1.02] transition-transform`}
                    onClick={() => {
                      setLastAnalysis(detection);
                      setShowHistory(false);
                      narrate('Análise carregada do histórico');
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            settings.highContrast 
                              ? 'bg-green-500 text-black' 
                              : 'bg-green-600 text-white'
                          }`}>
                            {new Date(detection.timestamp).toLocaleDateString('pt-BR')}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            settings.highContrast 
                              ? 'bg-orange-500 text-black' 
                              : 'bg-orange-600 text-white'
                          }`}>
                            {new Date(detection.timestamp).toLocaleTimeString('pt-BR')}
                          </span>
                        </div>
                        <p className={`text-sm ${settings.highContrast ? 'text-gray-300' : 'text-gray-700'} line-clamp-2`}>
                          {detection.description}
                        </p>
                      </div>
                      {detection.nutritional_analysis && (
                        <div className="ml-4 text-right">
                          <div className={`text-2xl font-bold ${settings.highContrast ? 'text-orange-400' : 'text-orange-600'}`}>
                            {Math.round(detection.nutritional_analysis.total_calories)}
                          </div>
                          <div className={`text-xs ${settings.highContrast ? 'text-gray-400' : 'text-gray-600'}`}>
                            calorias
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Apple className="w-16 h-16 mx-auto mb-4 opacity-50 text-green-600" />
                <p className={settings.highContrast ? 'text-gray-400' : 'text-slate-400'}>
                  Nenhuma análise nutricional no histórico
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NutritionAnalysis;