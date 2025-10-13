import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Square, Loader2, Cloud, Bell } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useSettings } from "@/context/SettingsContext";
import EmotionAnalysis from "@/components/EmotionAnalysis";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WebcamDetection = () => {
  const { t } = useTranslation();
  const { settings, narrate } = useSettings();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastDetection, setLastDetection] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [cameraFacing, setCameraFacing] = useState("environment"); // "user" for front, "environment" for rear
  const [availableCameras, setAvailableCameras] = useState([]);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Narrate component when loaded and detect cameras
    narrate(t('webcam.title') + '. ' + t('webcam.accessibilityDescription'));
    detectCameras();
    
    return () => {
      stopWebcam();
    };
  }, []);

  // Detect available cameras
  const detectCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      
      // Check if we have front and back cameras
      const hasEnvironment = videoDevices.some(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      const hasUser = videoDevices.some(device => 
        device.label.toLowerCase().includes('front') || 
        device.label.toLowerCase().includes('user') ||
        device.label.toLowerCase().includes('facing')
      );
      
      if (hasEnvironment && hasUser) {
        narrate(t('webcam.multipleCamerasDetected'));
      }
    } catch (error) {
      console.log("Error detecting cameras:", error);
    }
  };

  const startWebcam = async () => {
    try {
      // Enhanced mobile camera configuration with camera selection
      const constraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: { ideal: cameraFacing },
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
        
        // Announce which camera is being used
        const cameraType = cameraFacing === "user" ? t('webcam.frontCamera') : t('webcam.rearCamera');
        const message = t('webcam.cameraStarted') + '. ' + t('webcam.usingCamera') + ' ' + cameraType;
        narrate(message);
      }
    } catch (error) {
      const errorMsg = t('webcam.cameraError') + ": " + error.message;
      toast.error(errorMsg);
      narrate(errorMsg);
    }
  };

  const switchCamera = async () => {
    const newFacing = cameraFacing === "user" ? "environment" : "user";
    setCameraFacing(newFacing);
    
    if (isStreaming) {
      stopWebcam();
      // Small delay before starting new camera
      setTimeout(() => {
        setCameraFacing(newFacing);
        setTimeout(startWebcam, 500);
      }, 200);
    }
    
    const cameraType = newFacing === "user" ? t('webcam.frontCamera') : t('webcam.rearCamera');
    narrate(t('webcam.switchingToCamera') + ' ' + cameraType);
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    narrate(t('webcam.cameraStopped'));
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current) return;

    setIsAnalyzing(true);
    narrate(t('webcam.capturingImage'));
    
    // Create canvas with better quality settings
    const canvas = document.createElement("canvas");
    const video = videoRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    
    // Draw the current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg", 0.9); // Higher quality
    
    // Show captured image preview
    setCapturedImage(imageData);
    setShowPreview(true);
    
    // Stop the camera stream to show the captured image clearly
    stopWebcam();
    
    narrate(t('webcam.imageCapturedd') + '. ' + t('webcam.analyzingImage'));

    try {
      const response = await axios.post(`${API}/detect/analyze-frame`, {
        source: "webcam",
        detection_type: "cloud",
        image_data: imageData
      });

      setLastDetection(response.data);
      
      // Enhanced narration with more details
      if (response.data.description) {
        const detailedNarration = t('webcam.analysisComplete') + '. ' + 
                                  t('webcam.detectionResults') + ': ' + 
                                  response.data.description;
        narrate(detailedNarration);
      }
      
      if (response.data.alerts_triggered && response.data.alerts_triggered.length > 0) {
        const alertMessage = `${t('toast.alertTriggered')} ${response.data.alerts_triggered.join(", ")} ${t('toast.detected')}`;
        toast.warning(alertMessage);
        narrate(alertMessage);
      } else {
        toast.success(t('toast.analyzeSuccess'));
        narrate(t('toast.analyzeSuccess'));
      }
    } catch (error) {
      const errorMsg = t('toast.analyzeError') + ": " + error.message;
      toast.error(errorMsg);
      narrate(errorMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setShowPreview(false);
    setLastDetection(null);
    startWebcam();
    narrate(t('webcam.retakingPhoto'));
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
            {showPreview && capturedImage ? (
              <div className="relative w-full h-full">
                <img 
                  src={capturedImage} 
                  alt={t('webcam.capturedImage')}
                  className="w-full h-full object-cover"
                  data-testid="captured-image"
                />
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                  {t('webcam.captured')}
                </div>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                data-testid="webcam-video"
              />
            )}
          </div>

          <div className={`p-3 rounded-lg ${settings.highContrast ? 'bg-gray-800 border border-gray-600' : 'bg-blue-50 border border-blue-200'}`}>
            <div className={`flex items-center gap-2 ${settings.highContrast ? 'text-white' : 'text-blue-800'}`}>
              <Cloud className="w-4 h-4" />
              <span className="text-sm font-medium">{t('webcam.cloudAnalysis')}</span>
            </div>
            <p className={`text-xs mt-1 ${settings.highContrast ? 'text-gray-300' : 'text-blue-600'}`}>
              {t('webcam.cloudDescription')}
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            {!isStreaming && !showPreview ? (
              <Button
                onClick={startWebcam}
                className="flex-1 min-w-[200px] bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
                data-testid="start-webcam-btn"
              >
                <Camera className="w-4 h-4 mr-2" />
                {t('webcam.start')}
              </Button>
            ) : showPreview ? (
              <>
                <Button
                  onClick={retakePhoto}
                  variant="outline"
                  className="flex-1 min-w-[140px]"
                  data-testid="retake-btn"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {t('webcam.retake')}
                </Button>
                {!isAnalyzing && !lastDetection && (
                  <Button
                    onClick={() => captureAndAnalyze()}
                    disabled={isAnalyzing}
                    className="flex-1 min-w-[140px] bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
                    data-testid="analyze-captured-btn"
                  >
                    <Cloud className="w-4 h-4 mr-2" />
                    {t('webcam.analyzeCapture')}
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  onClick={stopWebcam}
                  variant="destructive"
                  className="flex-1 min-w-[100px]"
                  data-testid="stop-webcam-btn"
                >
                  <Square className="w-4 h-4 mr-2" />
                  {t('webcam.stop')}
                </Button>
                <Button
                  onClick={captureAndAnalyze}
                  disabled={isAnalyzing}
                  className="flex-1 min-w-[140px] bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white"
                  data-testid="capture-analyze-btn"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('webcam.analyzing')}
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      {t('webcam.capture')}
                    </>
                  )}
                </Button>
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

      {/* Análise de Emoções e Sentimentos */}
      {lastDetection && (lastDetection.emotion_analysis || lastDetection.sentiment_analysis) && (
        <EmotionAnalysis 
          emotionData={lastDetection.emotion_analysis}
          sentimentData={lastDetection.sentiment_analysis}
        />
      )}
    </div>
  );
};

export default WebcamDetection;