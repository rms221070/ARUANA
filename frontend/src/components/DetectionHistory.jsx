import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Trash2, RefreshCw, FileJson, FileText, Share2, Copy, Check } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DetectionHistory = () => {
  const { t } = useTranslation();
  const { settings, narrate, narrateInterface } = useSettings();
  const { token, getToken, user, isAdmin } = useAuth();
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetection, setSelectedDetection] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all"); // Filter state
  const [shareUrl, setShareUrl] = useState(null); // Share URL state
  const [copied, setCopied] = useState(false); // Copy state

  useEffect(() => {
    // Narrate history section when loaded
    narrateInterface('panel', t('history.title'), t('history.description'));
    fetchDetections();
  }, []);

  const getAuthHeaders = () => {
    const authToken = getToken();
    if (!authToken) {
      console.warn('No auth token available');
      return {};
    }
    return {
      'Authorization': `Bearer ${authToken}`
    };
  };

  const fetchDetections = async () => {
    setLoading(true);
    try {
      const authToken = getToken();
      if (!authToken) {
        console.warn('No auth token available for fetching detections');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API}/detections?limit=50`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      setDetections(response.data);
    } catch (error) {
      console.error('Error fetching detections:', error);
      if (error.response?.status === 401) {
        toast.error("Sessão expirada. Faça login novamente.");
      } else {
        toast.error("Erro ao carregar histórico");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteDetection = async (id) => {
    try {
      await axios.delete(`${API}/detections/${id}`, {
        headers: getAuthHeaders()
      });
      setDetections(detections.filter(d => d.id !== id));
      if (selectedDetection?.id === id) {
        setSelectedDetection(null);
      }
      toast.success("Detecção removida");
    } catch (error) {
      toast.error("Erro ao remover detecção");
    }
  };

  const shareDetection = async (detectionId) => {
    try {
      const authToken = getToken();
      if (!authToken) {
        toast.error('Você precisa fazer login');
        return;
      }

      toast.loading('Gerando link de compartilhamento...');

      const response = await axios.post(
        `${API}/detections/${detectionId}/share`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      const shareUrl = response.data.share_url;
      setShareUrl(shareUrl);
      
      toast.success('Link gerado!', { duration: 3000 });
      narrate('Link de compartilhamento gerado com sucesso');
      
      // Auto copy to clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });

    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Erro ao gerar link de compartilhamento');
    }
  };

  const copyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        toast.success('Link copiado!');
        setTimeout(() => setCopied(false), 3000);
      });
    }
  };

  const exportReport = async (format) => {
    try {
      const response = await axios.get(`${API}/reports/export?format=${format}`, {
        responseType: format === "csv" ? "blob" : "json",
        headers: getAuthHeaders()
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

  // Get unique categories
  const uniqueCategories = ["all", ...new Set(detections.map(d => d.category).filter(Boolean))];

  // Filter detections by category
  const filteredDetections = filterCategory === "all" 
    ? detections 
    : detections.filter(d => d.category === filterCategory);

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

          {/* Category Filter */}
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-600 mb-2 block">
              Filtrar por Categoria:
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">🔍 Todas as Categorias</option>
              {uniqueCategories.filter(c => c !== "all").map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {filterCategory !== "all" && (
              <Button
                onClick={() => setFilterCategory("all")}
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs"
              >
                Limpar Filtro
              </Button>
            )}
          </div>

          <ScrollArea className="h-[500px]" data-testid="detections-list">
            {loading ? (
              <div className="text-center py-8 text-slate-400">Carregando...</div>
            ) : filteredDetections.length === 0 ? (
              <div className="text-center py-8 text-slate-400" data-testid="no-detections-message">
                {filterCategory === "all" 
                  ? "Nenhuma detecção encontrada" 
                  : `Nenhuma detecção na categoria ${filterCategory}`}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDetections.map((detection) => (
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
                        {/* Category Badge */}
                        {detection.category && (
                          <div className="mb-2">
                            <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-orange-400 to-orange-500 text-white">
                              {detection.category}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-blue-600">
                            {detection.source === "webcam" ? "📷 Webcam" : "📁 Upload"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {detection.detection_type === "nutrition" ? "🍽️ Nutrição" : 
                             detection.detection_type === "text_reading" ? "📚 Texto" : 
                             "🔍 Análise"}
                          </span>
                        </div>
                        
                        {/* Geolocation */}
                        {detection.geo_location && (
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-xs text-green-600">
                              📍 {detection.geo_location.city || `${detection.geo_location.latitude.toFixed(4)}, ${detection.geo_location.longitude.toFixed(4)}`}
                            </span>
                          </div>
                        )}
                        
                        {/* Tags */}
                        {detection.tags && detection.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {detection.tags.slice(0, 3).map((tag, idx) => (
                              <span key={idx} className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-blue-100 text-blue-700">
                                {tag}
                              </span>
                            ))}
                            {detection.tags.length > 3 && (
                              <span className="text-[10px] text-slate-400">+{detection.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                        
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-slate-800">Detalhes da Detecção</CardTitle>
            {selectedDetection && (
              <Button
                onClick={() => shareDetection(selectedDetection.id)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar
              </Button>
            )}
          </div>
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

          {/* Share URL Card */}
          {shareUrl && (
            <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Link de Compartilhamento Gerado
              </h4>
              <p className="text-xs text-green-700 mb-3">
                Compartilhe este link em qualquer rede social. Qualquer pessoa poderá visualizar a imagem e descrição.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border border-green-300 rounded bg-white"
                />
                <Button
                  onClick={copyShareUrl}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent('Veja esta detecção: ' + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded flex items-center gap-1"
                >
                  📱 WhatsApp
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1"
                >
                  📘 Facebook
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Veja esta detecção')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs bg-blue-400 hover:bg-blue-500 text-white rounded flex items-center gap-1"
                >
                  🐦 Twitter
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Veja esta detecção')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded flex items-center gap-1"
                >
                  ✈️ Telegram
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DetectionHistory;