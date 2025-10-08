import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, X, Image as ImageIcon, Cloud, Cpu } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UploadDetection = () => {
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
    try {
      const response = await axios.post(`${API}/detect/analyze-frame`, {
        source: "upload",
        detection_type: detectionType,
        image_data: previewUrl
      });

      setResult(response.data);
      
      if (response.data.alerts_triggered && response.data.alerts_triggered.length > 0) {
        toast.warning(`Alerta: ${response.data.alerts_triggered.join(", ")} detectado!`);
      } else {
        toast.success("Análise concluída com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao analisar imagem: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6" data-testid="upload-detection-container">
      <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-slate-800">
            <Upload className="w-6 h-6 text-blue-600" />
            Upload de Imagem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!previewUrl ? (
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
              data-testid="upload-dropzone"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-16 h-16 mb-4 text-slate-400" />
                <p className="mb-2 text-sm text-slate-600">
                  <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                </p>
                <p className="text-xs text-slate-500">PNG, JPG ou JPEG</p>
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

              <RadioGroup value={detectionType} onValueChange={setDetectionType} data-testid="upload-detection-type">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="local" id="upload-local" data-testid="upload-local-radio" />
                  <Label htmlFor="upload-local" className="flex items-center gap-2 cursor-pointer">
                    <Cpu className="w-4 h-4" />
                    Detecção Local
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cloud" id="upload-cloud" data-testid="upload-cloud-radio" />
                  <Label htmlFor="upload-cloud" className="flex items-center gap-2 cursor-pointer">
                    <Cloud className="w-4 h-4" />
                    Análise em Nuvem
                  </Label>
                </div>
              </RadioGroup>

              <Button
                onClick={analyzeImage}
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
                data-testid="analyze-upload-btn"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4 mr-2" />
                    Analisar Imagem
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-800">Resultados da Análise</CardTitle>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4" data-testid="upload-results">
              <div>
                <h3 className="font-semibold text-lg text-slate-700 mb-2">Descrição:</h3>
                <p className="text-slate-600 leading-relaxed" data-testid="upload-description">
                  {result.description}
                </p>
              </div>

              {result.objects_detected && result.objects_detected.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg text-slate-700 mb-2">Objetos Detectados:</h3>
                  <div className="space-y-2" data-testid="upload-objects-list">
                    {result.objects_detected.map((obj, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                        data-testid={`upload-object-${idx}`}
                      >
                        <div>
                          <span className="font-medium text-slate-700">{obj.label}</span>
                          {obj.description && (
                            <p className="text-sm text-slate-500 mt-1">{obj.description}</p>
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
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg" data-testid="upload-alerts">
                  <h3 className="font-semibold text-amber-800 mb-2">Alertas Disparados:</h3>
                  <p className="text-amber-700">{result.alerts_triggered.join(", ")}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400" data-testid="no-upload-results">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Faça upload de uma imagem para análise</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadDetection;