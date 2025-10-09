import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSettings } from "@/context/SettingsContext";
import { BarChart3, TrendingUp, Users, Smile, Brain, AlertCircle, Download } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const IntelligentReports = () => {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [dateRange, setDateRange] = useState({
    start_date: "",
    end_date: ""
  });

  useEffect(() => {
    // Load report on mount
    generateReport();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/reports/intelligent`, {
        report_type: "general",
        start_date: dateRange.start_date || null,
        end_date: dateRange.end_date || null
      });
      setReport(response.data);
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar relatório");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!report) return;
    
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `relatorio_inteligente_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success("Relatório exportado!");
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <Card className={`${
      settings.highContrast 
        ? 'bg-gray-900 border-white border-2' 
        : 'bg-gradient-to-br from-indigo-950/90 to-purple-950/90 backdrop-blur-xl border-indigo-700/30 hover:border-cyan-500/50'
    } transition-all duration-300 hover:scale-105 animate-fade-in`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={`text-sm font-medium ${settings.highContrast ? 'text-gray-400' : 'text-gray-400'}`}>
              {title}
            </p>
            <p className={`text-3xl font-bold mt-2 ${settings.highContrast ? 'text-white' : color}`}>
              {value}
            </p>
            {subtitle && (
              <p className={`text-xs mt-1 ${settings.highContrast ? 'text-gray-500' : 'text-gray-400'}`}>
                {subtitle}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${
            settings.highContrast ? 'bg-gray-800' : 'bg-cyan-900/30'
          }`}>
            <Icon className={`w-6 h-6 ${settings.highContrast ? 'text-white' : color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6" data-testid="intelligent-reports">
      {/* Header */}
      <Card className={`${
        settings.highContrast 
          ? 'bg-gray-900 border-white border-2' 
          : 'bg-gradient-to-br from-indigo-950/90 via-purple-950/90 to-slate-950/90 backdrop-blur-xl border-indigo-700/30 shadow-2xl'
      }`}>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className={`text-2xl flex items-center gap-2 ${
              settings.highContrast ? 'text-white' : 'text-cyan-300'
            }`}>
              <BarChart3 className="w-7 h-7" />
              Relatórios Inteligentes
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={exportReport}
                disabled={!report}
                variant="outline"
                className="border-cyan-500 text-cyan-300 hover:bg-cyan-900/30"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label className={settings.highContrast ? 'text-white' : 'text-gray-200'}>Data Início</Label>
              <Input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
                className={settings.highContrast ? 'bg-gray-800 text-white border-white' : 'bg-indigo-900/50 text-white'}
              />
            </div>
            <div className="flex-1">
              <Label className={settings.highContrast ? 'text-white' : 'text-gray-200'}>Data Fim</Label>
              <Input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
                className={settings.highContrast ? 'bg-gray-800 text-white border-white' : 'bg-indigo-900/50 text-white'}
              />
            </div>
            <Button
              onClick={generateReport}
              disabled={loading}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
            >
              {loading ? "Gerando..." : "Gerar Relatório"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className={`text-center py-12 ${settings.highContrast ? 'text-white' : 'text-cyan-300'}`}>
          <BarChart3 className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <p>Analisando dados e gerando relatório inteligente...</p>
        </div>
      )}

      {!loading && report && (
        <>
          {/* Overview Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard
              title="Total de Detecções"
              value={report.detections_summary?.total || 0}
              icon={BarChart3}
              color="text-cyan-400"
              subtitle={`Webcam: ${report.detections_summary?.by_source?.webcam || 0} | Upload: ${report.detections_summary?.by_source?.upload || 0}`}
            />
            <StatCard
              title="Registros Científicos"
              value={report.scientific_records?.total || 0}
              icon={Brain}
              color="text-purple-400"
              subtitle="Atividades, artigos, trabalhos"
            />
            <StatCard
              title="Emoção Dominante"
              value={report.insights?.dominant_emotion || "N/A"}
              icon={Smile}
              color="text-green-400"
              subtitle="Mais detectada"
            />
            <StatCard
              title="Sentimento Geral"
              value={report.insights?.overall_sentiment || "N/A"}
              icon={TrendingUp}
              color="text-yellow-400"
              subtitle="Clima emocional"
            />
          </div>

          {/* Emotions Analysis */}
          <Card className={`${
            settings.highContrast 
              ? 'bg-gray-900 border-white border-2' 
              : 'bg-gradient-to-br from-indigo-950/90 to-purple-950/90 backdrop-blur-xl border-indigo-700/30 shadow-2xl'
          } animate-fade-in`}>
            <CardHeader>
              <CardTitle className={`text-xl flex items-center gap-2 ${
                settings.highContrast ? 'text-white' : 'text-cyan-300'
              }`}>
                <Smile className="w-6 h-6" />
                Análise de Emoções
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {report.emotions_analysis && Object.entries(report.emotions_analysis).map(([emotion, count]) => (
                  <div
                    key={emotion}
                    className={`p-4 rounded-lg ${
                      settings.highContrast ? 'bg-gray-800' : 'bg-indigo-900/30'
                    } border ${settings.highContrast ? 'border-gray-600' : 'border-cyan-500/20'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`capitalize font-medium ${
                        settings.highContrast ? 'text-white' : 'text-gray-200'
                      }`}>
                        {emotion === 'sorrindo' && '😊'} 
                        {emotion === 'serio' && '😐'}
                        {emotion === 'triste' && '😢'}
                        {emotion === 'surpreso' && '😲'}
                        {emotion === 'zangado' && '😠'}
                        {emotion === 'neutro' && '😶'}
                        {' '}{emotion}
                      </span>
                      <span className={`text-2xl font-bold ${
                        settings.highContrast ? 'text-white' : 'text-cyan-400'
                      }`}>
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sentiment Analysis */}
          <Card className={`${
            settings.highContrast 
              ? 'bg-gray-900 border-white border-2' 
              : 'bg-gradient-to-br from-indigo-950/90 to-purple-950/90 backdrop-blur-xl border-indigo-700/30 shadow-2xl'
          } animate-fade-in`}>
            <CardHeader>
              <CardTitle className={`text-xl flex items-center gap-2 ${
                settings.highContrast ? 'text-white' : 'text-cyan-300'
              }`}>
                <TrendingUp className="w-6 h-6" />
                Análise de Sentimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {report.sentiment_analysis && Object.entries(report.sentiment_analysis).map(([sentiment, count]) => {
                  const colors = {
                    positivo: { bg: 'bg-green-900/30', text: 'text-green-400', border: 'border-green-500/20' },
                    neutro: { bg: 'bg-gray-900/30', text: 'text-gray-400', border: 'border-gray-500/20' },
                    negativo: { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-500/20' }
                  };
                  const color = colors[sentiment] || colors.neutro;
                  
                  return (
                    <div
                      key={sentiment}
                      className={`p-4 rounded-lg ${
                        settings.highContrast ? 'bg-gray-800' : color.bg
                      } border ${settings.highContrast ? 'border-gray-600' : color.border}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`capitalize font-medium ${
                          settings.highContrast ? 'text-white' : 'text-gray-200'
                        }`}>
                          {sentiment === 'positivo' && '👍'} 
                          {sentiment === 'neutro' && '➖'}
                          {sentiment === 'negativo' && '👎'}
                          {' '}{sentiment}
                        </span>
                        <span className={`text-2xl font-bold ${
                          settings.highContrast ? 'text-white' : color.text
                        }`}>
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Objects Detected */}
          <Card className={`${
            settings.highContrast 
              ? 'bg-gray-900 border-white border-2' 
              : 'bg-gradient-to-br from-indigo-950/90 to-purple-950/90 backdrop-blur-xl border-indigo-700/30 shadow-2xl'
          } animate-fade-in`}>
            <CardHeader>
              <CardTitle className={`text-xl flex items-center gap-2 ${
                settings.highContrast ? 'text-white' : 'text-cyan-300'
              }`}>
                <Users className="w-6 h-6" />
                Objetos Mais Detectados (Top 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {report.objects_detected && Object.entries(report.objects_detected).map(([object, count], idx) => (
                  <div
                    key={object}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      settings.highContrast ? 'bg-gray-800' : 'bg-indigo-900/30'
                    } border ${settings.highContrast ? 'border-gray-600' : 'border-cyan-500/20'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono ${
                        settings.highContrast ? 'text-gray-400' : 'text-cyan-400'
                      }`}>
                        #{idx + 1}
                      </span>
                      <span className={`capitalize font-medium ${
                        settings.highContrast ? 'text-white' : 'text-gray-200'
                      }`}>
                        {object}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 rounded-full ${
                        settings.highContrast ? 'bg-gray-700' : 'bg-indigo-900/50'
                      }`} style={{ width: `${Math.max(50, count * 10)}px` }}>
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <span className={`text-lg font-bold ${
                        settings.highContrast ? 'text-white' : 'text-cyan-400'
                      }`}>
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Scientific Records Stats */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className={`${
              settings.highContrast 
                ? 'bg-gray-900 border-white border-2' 
                : 'bg-gradient-to-br from-cyan-950/90 to-blue-950/90 backdrop-blur-xl border-cyan-700/30 shadow-2xl'
            } animate-fade-in`}>
              <CardHeader>
                <CardTitle className={`text-lg ${settings.highContrast ? 'text-white' : 'text-cyan-300'}`}>
                  Registros por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.scientific_records?.by_type && Object.entries(report.scientific_records.by_type).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className={`capitalize ${settings.highContrast ? 'text-gray-300' : 'text-gray-300'}`}>
                        {type}
                      </span>
                      <span className={`font-bold ${settings.highContrast ? 'text-white' : 'text-cyan-400'}`}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className={`${
              settings.highContrast 
                ? 'bg-gray-900 border-white border-2' 
                : 'bg-gradient-to-br from-purple-950/90 to-pink-950/90 backdrop-blur-xl border-purple-700/30 shadow-2xl'
            } animate-fade-in`}>
              <CardHeader>
                <CardTitle className={`text-lg ${settings.highContrast ? 'text-white' : 'text-purple-300'}`}>
                  Registros por Linha de Pesquisa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.scientific_records?.by_research_line && Object.entries(report.scientific_records.by_research_line).map(([line, count]) => (
                    <div key={line} className="flex items-center justify-between">
                      <span className={settings.highContrast ? 'text-gray-300' : 'text-gray-300'}>
                        Linha {line}
                      </span>
                      <span className={`font-bold ${settings.highContrast ? 'text-white' : 'text-purple-400'}`}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          <Card className={`${
            settings.highContrast 
              ? 'bg-gray-900 border-white border-2' 
              : 'bg-gradient-to-br from-indigo-950/90 via-purple-950/90 to-slate-950/90 backdrop-blur-xl border-indigo-700/30 shadow-2xl'
          } animate-fade-in`}>
            <CardHeader>
              <CardTitle className={`text-xl flex items-center gap-2 ${
                settings.highContrast ? 'text-white' : 'text-cyan-300'
              }`}>
                <AlertCircle className="w-6 h-6" />
                Insights Inteligentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg space-y-3 ${
                settings.highContrast ? 'bg-gray-800' : 'bg-indigo-900/30'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2" />
                  <p className={settings.highContrast ? 'text-gray-200' : 'text-gray-200'}>
                    <span className="font-semibold text-cyan-400">Objeto mais detectado:</span> {report.insights?.most_detected_object || "N/A"}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-2" />
                  <p className={settings.highContrast ? 'text-gray-200' : 'text-gray-200'}>
                    <span className="font-semibold text-green-400">Emoção dominante:</span> {report.insights?.dominant_emotion || "N/A"}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2" />
                  <p className={settings.highContrast ? 'text-gray-200' : 'text-gray-200'}>
                    <span className="font-semibold text-yellow-400">Sentimento geral:</span> {report.insights?.overall_sentiment || "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default IntelligentReports;
