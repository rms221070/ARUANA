import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, X, Image as ImageIcon, Cloud, Cpu } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useSettings } from "@/context/SettingsContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UploadDetection = () => {
  const { t } = useTranslation();
  const { settings, narrate } = useSettings();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectionType, setDetectionType] = useState("cloud");
  const [result, setResult] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
      setResult(null);
      narrate(t('upload.title'));
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
  };

  const analyzeImage = async () => {
    if (!selectedFile || !previewUrl) return;

    setIsAnalyzing(true);
    narrate(t('webcam.analyzing'));
    
    try {
      const response = await axios.post(`${API}/detect/analyze-frame`, {
        source: "upload",
        detection_type: "cloud",
        image_data: previewUrl
      });

      setResult(response.data);
      
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
    <div className="grid lg:grid-cols-2 gap-6" data-testid="upload-detection-container">
      <Card className={`${settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-white/90 backdrop-blur-sm border-indigo-200 shadow-xl'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 text-2xl ${settings.highContrast ? 'text-white' : 'text-slate-800'}`}>
            <Upload className={`w-6 h-6 ${settings.highContrast ? 'text-white' : 'text-indigo-600'}`} />
            {t('upload.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!previewUrl ? (
            <label
              htmlFor="file-upload"
              className={`flex flex-col items-center justify-center w-full h-80 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                settings.highContrast 
                  ? 'border-white bg-gray-800 hover:bg-gray-700' 
                  : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
              }`}
              data-testid="upload-dropzone"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className={`w-16 h-16 mb-4 ${settings.highContrast ? 'text-gray-400' : 'text-slate-400'}`} />
                <p className={`mb-2 text-sm ${settings.highContrast ? 'text-gray-300' : 'text-slate-600'}`}>
                  <span className="font-semibold">{t('upload.dropzone')}</span>
                </p>
                <p className={`text-xs ${settings.highContrast ? 'text-gray-400' : 'text-slate-500'}`}>{t('upload.formats')}</p>
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
                data-testid="file-input"
              />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden" data-testid="image-preview-container">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  data-testid="preview-image"
                />
                <Button
                  onClick={clearFile}
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  data-testid="clear-image-btn"
                >
                  <X className="w-4 h-4" />
                </Button>
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

              <Button
                onClick={analyzeImage}
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                data-testid="analyze-upload-btn"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('webcam.analyzing')}
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4 mr-2" />
                    {t('upload.analyze')}
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={`${settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-white/90 backdrop-blur-sm border-indigo-200 shadow-xl'}`}>
        <CardHeader>
          <CardTitle className={`text-2xl ${settings.highContrast ? 'text-white' : 'text-slate-800'}`}>{t('upload.results')}</CardTitle>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4" data-testid="upload-results">
              <div>
                <h3 className={`font-semibold text-lg mb-2 ${settings.highContrast ? 'text-white' : 'text-slate-700'}`}>{t('webcam.description')}</h3>
                <p className={`leading-relaxed ${settings.highContrast ? 'text-gray-300' : 'text-slate-600'}`} data-testid="upload-description">
                  {result.description}
                </p>
              </div>

              {result.objects_detected && result.objects_detected.length > 0 && (
                <div>
                  <h3 className={`font-semibold text-lg mb-2 ${settings.highContrast ? 'text-white' : 'text-slate-700'}`}>{t('webcam.objectsDetected')}</h3>
                  <div className="space-y-2" data-testid="upload-objects-list">
                    {result.objects_detected.map((obj, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          settings.highContrast ? 'bg-gray-800 border-gray-600' : 'bg-slate-50 border-slate-200'
                        }`}
                        data-testid={`upload-object-${idx}`}
                      >
                        <div>
                          <span className={`font-medium ${settings.highContrast ? 'text-white' : 'text-slate-700'}`}>{obj.label}</span>
                          {obj.description && (
                            <p className={`text-sm mt-1 ${settings.highContrast ? 'text-gray-400' : 'text-slate-500'}`}>{obj.description}</p>
                          )}
                        </div>
                        <span className="text-sm text-emerald-600 font-semibold">
                          {Math.round(obj.confidence * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.alerts_triggered && result.alerts_triggered.length > 0 && (
                <div className={`p-4 rounded-lg border ${
                  settings.highContrast ? 'bg-yellow-900 border-yellow-500' : 'bg-amber-50 border-amber-200'
                }`} data-testid="upload-alerts">
                  <h3 className={`font-semibold mb-2 ${settings.highContrast ? 'text-yellow-200' : 'text-amber-800'}`}>{t('webcam.alertsTriggered')}</h3>
                  <p className={settings.highContrast ? 'text-yellow-100' : 'text-amber-700'}>{result.alerts_triggered.join(", ")}</p>
                </div>
              )}
            </div>
          ) : (
            <div className={`text-center py-12 ${settings.highContrast ? 'text-gray-400' : 'text-slate-400'}`} data-testid="no-upload-results">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>{t('upload.noResults')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadDetection;