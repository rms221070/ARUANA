import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Trash2, RefreshCw, FileJson, FileText } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useSettings } from "@/context/SettingsContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DetectionHistory = () => {
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetection, setSelectedDetection] = useState(null);

  useEffect(() => {
    fetchDetections();
  }, []);

  const fetchDetections = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/detections?limit=50`);
      setDetections(response.data);
    } catch (error) {
      toast.error("Erro ao carregar histórico");
    } finally {
      setLoading(false);
    }
  };

  const deleteDetection = async (id) => {
    try {
      await axios.delete(`${API}/detections/${id}`);
      setDetections(detections.filter(d => d.id !== id));
      if (selectedDetection?.id === id) {
        setSelectedDetection(null);
      }
      toast.success("Detecção removida");
    } catch (error) {
      toast.error("Erro ao remover detecção");
    }
  };

  const exportReport = async (format) => {
    try {
      const response = await axios.get(`${API}/reports/export?format=${format}`, {
        responseType: format === "csv" ? "blob" : "json"
      });

      if (format === "csv") {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "detections_report.csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "detections_report.json");
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      toast.success(`Relatório ${format.toUpperCase()} exportado com sucesso!`);
    } catch (error) {
      toast.error("Erro ao exportar relatório");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6" data-testid="history-container">
      <Card className="lg:col-span-1 bg-white/90 backdrop-blur-sm border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-slate-800 flex items-center justify-between">
            <span>Histórico</span>
            <Button
              onClick={fetchDetections}
              variant="ghost"
              size="icon"
              data-testid="refresh-history-btn"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            <Button
              onClick={() => exportReport("json")}
              variant="outline"
              className="w-full justify-start"
              data-testid="export-json-btn"
            >
              <FileJson className="w-4 h-4 mr-2" />
              Exportar JSON
            </Button>
            <Button
              onClick={() => exportReport("csv")}
              variant="outline"
              className="w-full justify-start"
              data-testid="export-csv-btn"
            >
              <FileText className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          <ScrollArea className="h-[500px]" data-testid="detections-list">
            {loading ? (
              <div className="text-center py-8 text-slate-400">Carregando...</div>
            ) : detections.length === 0 ? (
              <div className="text-center py-8 text-slate-400" data-testid="no-detections-message">
                Nenhuma detecção encontrada
              </div>
            ) : (
              <div className="space-y-2">
                {detections.map((detection) => (
                  <div
                    key={detection.id}
                    onClick={() => setSelectedDetection(detection)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedDetection?.id === detection.id
                        ? "bg-blue-50 border-blue-300"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                    data-testid={`detection-item-${detection.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-blue-600">
                            {detection.source === "webcam" ? "Webcam" : "Upload"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {detection.detection_type === "cloud" ? "Nuvem" : "Local"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {formatDate(detection.timestamp)}
                        </p>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDetection(detection.id);
                        }}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        data-testid={`delete-detection-${detection.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 bg-white/90 backdrop-blur-sm border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl text-slate-800">Detalhes da Detecção</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDetection ? (
            <div className="space-y-4" data-testid="detection-details">
              {selectedDetection.image_data && (
                <div className="rounded-lg overflow-hidden bg-slate-900">
                  <img
                    src={selectedDetection.image_data}
                    alt="Detection"
                    className="w-full h-auto max-h-96 object-contain"
                    data-testid="detection-detail-image"
                  />
                </div>
              )}

              <div>
                <h3 className="font-semibold text-lg text-slate-700 mb-2">Descrição:</h3>
                <p className="text-slate-600 leading-relaxed" data-testid="detection-detail-description">
                  {selectedDetection.description}
                </p>
              </div>

              {selectedDetection.objects_detected && selectedDetection.objects_detected.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg text-slate-700 mb-2">Objetos Detectados:</h3>
                  <div className="space-y-2" data-testid="detection-detail-objects">
                    {selectedDetection.objects_detected.map((obj, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
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
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400" data-testid="no-selection-message">
              <Download className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Selecione uma detecção para ver os detalhes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DetectionHistory;