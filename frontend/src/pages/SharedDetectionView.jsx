import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Calendar, MapPin } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SharedDetectionView = () => {
  const { shareToken } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSharedDetection();
  }, [shareToken]);

  const loadSharedDetection = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/share/${shareToken}`);
      setData(response.data);
    } catch (error) {
      console.error('Error loading shared detection:', error);
      setError('Link inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Link Inválido</h2>
              <p className="text-slate-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const detection = data?.detection;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl md:text-3xl font-bold mb-2">
                  🔍 ARUANÃ - Visão Assistiva
                </CardTitle>
                <p className="text-indigo-100">Detecção Compartilhada</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Eye className="w-4 h-4" />
                <span>{data.views} visualizações</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            {/* Category Badge */}
            {detection.category && (
              <div className="mb-4">
                <span className="inline-block px-3 py-1.5 text-sm font-semibold rounded-full bg-gradient-to-r from-orange-400 to-orange-500 text-white">
                  {detection.category}
                </span>
              </div>
            )}

            {/* Image */}
            {detection.image_data && (
              <div className="mb-6 rounded-lg overflow-hidden bg-slate-900">
                <img
                  src={detection.image_data}
                  alt="Detecção"
                  className="w-full h-auto object-contain max-h-[500px]"
                />
              </div>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 mb-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(detection.timestamp).toLocaleString('pt-BR')}</span>
              </div>
              {detection.geo_location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span>
                    {detection.geo_location.city || 
                     `${detection.geo_location.latitude.toFixed(4)}, ${detection.geo_location.longitude.toFixed(4)}`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="font-semibold">Fonte:</span>
                <span>{detection.source === 'webcam' ? '📷 Câmera' : '📁 Upload'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Tipo:</span>
                <span>
                  {detection.detection_type === 'nutrition' ? '🍽️ Nutrição' : 
                   detection.detection_type === 'text_reading' ? '📚 Texto' : 
                   '🔍 Análise Geral'}
                </span>
              </div>
            </div>

            {/* Tags */}
            {detection.tags && detection.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-slate-700 mb-2">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {detection.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800 mb-3">Descrição Detalhada:</h3>
              <div className="prose max-w-none">
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {detection.description}
                </p>
              </div>
            </div>

            {/* Objects Detected */}
            {detection.objects_detected && detection.objects_detected.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-3">Objetos Detectados:</h3>
                <div className="grid gap-2">
                  {detection.objects_detected.map((obj, idx) => (
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

            {/* Emotion Analysis */}
            {detection.emotion_analysis && (
              <div className="mt-6">
                <h3 className="text-xl font-bold text-slate-800 mb-3">Análise de Emoções:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(detection.emotion_analysis).map(([emotion, count]) => (
                    count > 0 && (
                      <div key={emotion} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-2xl text-center mb-1">
                          {emotion === 'sorrindo' ? '😊' :
                           emotion === 'serio' ? '😐' :
                           emotion === 'triste' ? '😢' :
                           emotion === 'surpreso' ? '😮' :
                           emotion === 'zangado' ? '😠' : '😶'}
                        </div>
                        <div className="text-center">
                          <span className="text-sm text-slate-600">{emotion}</span>
                          <span className="block text-lg font-bold text-purple-600">{count}</span>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Nutritional Analysis */}
            {detection.nutritional_analysis && (
              <div className="mt-6">
                <h3 className="text-xl font-bold text-slate-800 mb-3">Análise Nutricional:</h3>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Calorias Totais</p>
                      <p className="text-2xl font-bold text-green-600">
                        {detection.nutritional_analysis.total_calories?.toFixed(1) || 'N/A'} kcal
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Score de Qualidade</p>
                      <p className="text-2xl font-bold text-green-600">
                        {detection.nutritional_analysis.quality_score || 'N/A'}/100
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <Card className="bg-gradient-to-r from-slate-800 to-slate-900 text-white border-0">
          <CardContent className="py-6">
            <div className="text-center">
              <p className="text-sm text-slate-300 mb-2">
                Compartilhado em {new Date(data.shared_at).toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-slate-400">
                Sistema ARUANÃ - Visão Assistiva | LCC - IOC/Fiocruz
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SharedDetectionView;
