import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Camera, Square, Loader2, Cloud, Cpu } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useSettings } from "@/context/SettingsContext";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WebcamDetection = () => {
  const { t } = useTranslation();
  const { settings, narrate } = useSettings();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectionType, setDetectionType] = useState("cloud");
  const [lastDetection, setLastDetection] = useState(null);
  const [model, setModel] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    // Load TensorFlow model for local detection
    const loadModel = async () => {
      try {
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
      } catch (error) {
        console.error("Error loading model:", error);
      }
    };
    loadModel();

    return () => {
      stopWebcam();
    };
  }, []);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
        
        if (detectionType === "local" && model) {
          detectObjects();
        }
      }
    } catch (error) {
      toast.error("Erro ao acessar webcam: " + error.message);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsStreaming(false);
  };

  const detectObjects = async () => {
    if (!videoRef.current || !canvasRef.current || !model) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const detect = async () => {
      if (video.readyState === 4) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const predictions = await model.detect(video);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        predictions.forEach(prediction => {
          const [x, y, width, height] = prediction.bbox;
          
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);
          
          ctx.fillStyle = "#10b981";
          ctx.font = "18px Space Grotesk";
          const text = `${prediction.class} ${Math.round(prediction.score * 100)}%`;
          const textWidth = ctx.measureText(text).width;
          ctx.fillRect(x, y - 25, textWidth + 10, 25);
          
          ctx.fillStyle = "white";
          ctx.fillText(text, x + 5, y - 7);
        });
      }

      if (isStreaming) {
        animationFrameRef.current = requestAnimationFrame(detect);
      }
    };

    detect();
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current) return;

    setIsAnalyzing(true);
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL("image/jpeg", 0.8);

    try {
      const response = await axios.post(`${API}/detect/analyze-frame`, {
        source: "webcam",
        detection_type: detectionType,
        image_data: imageData
      });

      setLastDetection(response.data);
      
      // Narrate the full description
      if (response.data.description) {
        narrate(response.data.description);
      }
      
      if (response.data.alerts_triggered && response.data.alerts_triggered.length > 0) {
        const alertMessage = `${t('toast.alertTriggered')} ${response.data.alerts_triggered.join(", ")} ${t('toast.detected')}`;
        toast.warning(alertMessage);
        narrate(alertMessage);
      } else {
        toast.success(t('toast.analyzeSuccess'));
      }
    } catch (error) {
      const errorMsg = t('toast.analyzeError') + ": " + error.message;
      toast.error(errorMsg);
      narrate(errorMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6" data-testid="webcam-detection-container">
      <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-slate-800">
            <Camera className="w-6 h-6 text-blue-600" />
            Captura de Vídeo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden" data-testid="video-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              data-testid="webcam-video"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ display: detectionType === "local" && isStreaming ? "block" : "none" }}
              data-testid="detection-canvas"
            />
          </div>

          <RadioGroup value={detectionType} onValueChange={setDetectionType} data-testid="detection-type-selector">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="local" id="local" data-testid="local-radio" />
              <Label htmlFor="local" className="flex items-center gap-2 cursor-pointer">
                <Cpu className="w-4 h-4" />
                Detecção Local (TensorFlow.js)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cloud" id="cloud" data-testid="cloud-radio" />
              <Label htmlFor="cloud" className="flex items-center gap-2 cursor-pointer">
                <Cloud className="w-4 h-4" />
                Análise em Nuvem (Gemini Vision)
              </Label>
            </div>
          </RadioGroup>

          <div className="flex gap-3">
            {!isStreaming ? (
              <Button
                onClick={startWebcam}
                className="flex-1 bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
                data-testid="start-webcam-btn"
              >
                <Camera className="w-4 h-4 mr-2" />
                Iniciar Câmera
              </Button>
            ) : (
              <>
                <Button
                  onClick={stopWebcam}
                  variant="destructive"
                  className="flex-1"
                  data-testid="stop-webcam-btn"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Parar
                </Button>
                {detectionType === "cloud" && (
                  <Button
                    onClick={captureAndAnalyze}
                    disabled={isAnalyzing}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
                    data-testid="analyze-btn"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Cloud className="w-4 h-4 mr-2" />
                    )}
                    Analisar Frame
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-800">Resultados da Detecção</CardTitle>
        </CardHeader>
        <CardContent>
          {lastDetection ? (
            <div className="space-y-4" data-testid="detection-results">
              <div>
                <h3 className="font-semibold text-lg text-slate-700 mb-2">Descrição:</h3>
                <p className="text-slate-600 leading-relaxed" data-testid="detection-description">
                  {lastDetection.description}
                </p>
              </div>

              {lastDetection.objects_detected && lastDetection.objects_detected.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg text-slate-700 mb-2">Objetos Detectados:</h3>
                  <div className="space-y-2" data-testid="detected-objects-list">
                    {lastDetection.objects_detected.map((obj, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                        data-testid={`detected-object-${idx}`}
                      >
                        <span className="font-medium text-slate-700">{obj.label}</span>
                        <span className="text-sm text-emerald-600 font-semibold">
                          {Math.round(obj.confidence * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lastDetection.alerts_triggered && lastDetection.alerts_triggered.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg" data-testid="alerts-triggered">
                  <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Alertas Disparados:
                  </h3>
                  <p className="text-amber-700">{lastDetection.alerts_triggered.join(", ")}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400" data-testid="no-detection-message">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Nenhuma detecção realizada ainda</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WebcamDetection;