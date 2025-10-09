import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Square, Loader2, Cloud, Bell } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useSettings } from "@/context/SettingsContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WebcamDetection = () => {
  const { t } = useTranslation();
  const { settings, narrate } = useSettings();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastDetection, setLastDetection] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
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
      <Card className={`${settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-white/90 backdrop-blur-sm border-indigo-200 shadow-xl'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 text-2xl ${settings.highContrast ? 'text-white' : 'text-slate-800'}`}>
            <Camera className={`w-6 h-6 ${settings.highContrast ? 'text-white' : 'text-indigo-600'}`} />
            {t('webcam.title')}
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
              <Label htmlFor="local" className={`flex items-center gap-2 cursor-pointer ${settings.highContrast ? 'text-white' : ''}`}>
                <Cpu className="w-4 h-4" />
                {t('webcam.localDetection')}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cloud" id="cloud" data-testid="cloud-radio" />
              <Label htmlFor="cloud" className={`flex items-center gap-2 cursor-pointer ${settings.highContrast ? 'text-white' : ''}`}>
                <Cloud className="w-4 h-4" />
                {t('webcam.cloudAnalysis')}
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
                {t('webcam.start')}
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
                  {t('webcam.stop')}
                </Button>
                {detectionType === "cloud" && (
                  <Button
                    onClick={captureAndAnalyze}
                    disabled={isAnalyzing}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
                    data-testid="analyze-btn"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('webcam.analyzing')}
                      </>
                    ) : (
                      <>
                        <Cloud className="w-4 h-4 mr-2" />
                        {t('webcam.analyze')}
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className={`${settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-white/90 backdrop-blur-sm border-indigo-200 shadow-xl'}`}>
        <CardHeader>
          <CardTitle className={`text-2xl ${settings.highContrast ? 'text-white' : 'text-slate-800'}`}>{t('webcam.results')}</CardTitle>
        </CardHeader>
        <CardContent>
          {lastDetection ? (
            <div className="space-y-4" data-testid="detection-results">
              <div>
                <h3 className={`font-semibold text-lg mb-2 ${settings.highContrast ? 'text-white' : 'text-slate-700'}`}>{t('webcam.description')}</h3>
                <p className={`leading-relaxed ${settings.highContrast ? 'text-gray-300' : 'text-slate-600'}`} data-testid="detection-description">
                  {lastDetection.description}
                </p>
              </div>

              {lastDetection.objects_detected && lastDetection.objects_detected.length > 0 && (
                <div>
                  <h3 className={`font-semibold text-lg mb-2 ${settings.highContrast ? 'text-white' : 'text-slate-700'}`}>{t('webcam.objectsDetected')}</h3>
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
                <div className={`p-4 rounded-lg border ${settings.highContrast ? 'bg-yellow-900 border-yellow-500' : 'bg-amber-50 border-amber-200'}`} data-testid="alerts-triggered">
                  <h3 className={`font-semibold mb-2 flex items-center gap-2 ${settings.highContrast ? 'text-yellow-200' : 'text-amber-800'}`}>
                    <Bell className="w-5 h-5" />
                    {t('webcam.alertsTriggered')}
                  </h3>
                  <p className={settings.highContrast ? 'text-yellow-100' : 'text-amber-700'}>{lastDetection.alerts_triggered.join(", ")}</p>
                </div>
              )}
            </div>
          ) : (
            <div className={`text-center py-12 ${settings.highContrast ? 'text-gray-400' : 'text-slate-400'}`} data-testid="no-detection-message">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>{t('webcam.noDetection')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WebcamDetection;