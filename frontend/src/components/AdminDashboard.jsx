import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/context/SettingsContext";
import { FileText, Plus, Trash2, BookOpen, GraduationCap, Microscope } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const { settings } = useSettings();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    record_type: "atividade",
    title: "",
    authors: "",
    description: "",
    keywords: "",
    research_line: "1",
    status: "em_andamento",
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/scientific-records`);
      setRecords(response.data);
    } catch (error) {
      toast.error("Erro ao carregar registros");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        authors: formData.authors.split(",").map(a => a.trim()),
        keywords: formData.keywords.split(",").map(k => k.trim())
      };
      
      await axios.post(`${API}/scientific-records`, payload);
      toast.success("Registro criado com sucesso!");
      setShowForm(false);
      setFormData({
        record_type: "atividade",
        title: "",
        authors: "",
        description: "",
        keywords: "",
        research_line: "1",
        status: "em_andamento",
        date: new Date().toISOString().split('T')[0]
      });
      fetchRecords();
    } catch (error) {
      toast.error("Erro ao criar registro");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja deletar este registro?")) return;
    
    try {
      await axios.delete(`${API}/scientific-records/${id}`);
      toast.success("Registro deletado");
      fetchRecords();
    } catch (error) {
      toast.error("Erro ao deletar registro");
    }
  };

  const getIcon = (type) => {
    const icons = {
      atividade: Microscope,
      trabalho: FileText,
      artigo: BookOpen,
      tcc: GraduationCap
    };
    const Icon = icons[type] || FileText;
    return <Icon className="w-5 h-5" />;
  };

  const getTypeLabel = (type) => {
    const labels = {
      atividade: "Atividade",
      trabalho: "Trabalho",
      artigo: "Artigo",
      tcc: "TCC"
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status) => {
    const labels = {
      em_andamento: "Em Andamento",
      concluido: "Concluído",
      publicado: "Publicado"
    };
    return labels[status] || status;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6" data-testid="admin-dashboard">
      {/* Header */}
      <Card className={`${
        settings.highContrast 
          ? 'bg-gray-900 border-white border-2' 
          : 'bg-gradient-to-br from-indigo-950/90 via-purple-950/90 to-slate-950/90 backdrop-blur-xl border-indigo-700/30 shadow-2xl'
      }`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className={`text-2xl flex items-center gap-2 ${
              settings.highContrast ? 'text-white' : 'text-cyan-300'
            }`}>
              <FileText className="w-7 h-7" />
              Dashboard Administrativo - Registros Científicos
            </CardTitle>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Registro
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Form */}
      {showForm && (
        <Card className={`${
          settings.highContrast 
            ? 'bg-gray-900 border-white border-2' 
            : 'bg-gradient-to-br from-indigo-950/90 via-purple-950/90 to-slate-950/90 backdrop-blur-xl border-indigo-700/30 shadow-2xl'
        } animate-fade-in`}>
          <CardHeader>
            <CardTitle className={`text-xl ${settings.highContrast ? 'text-white' : 'text-cyan-300'}`}>
              Novo Registro Científico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className={settings.highContrast ? 'text-white' : 'text-gray-200'}>Tipo de Registro</Label>
                  <Select value={formData.record_type} onValueChange={(v) => setFormData({...formData, record_type: v})}>
                    <SelectTrigger className={settings.highContrast ? 'bg-gray-800 text-white border-white' : 'bg-indigo-900/50 text-white'}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="atividade">Atividade</SelectItem>
                      <SelectItem value="trabalho">Trabalho</SelectItem>
                      <SelectItem value="artigo">Artigo</SelectItem>
                      <SelectItem value="tcc">TCC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className={settings.highContrast ? 'text-white' : 'text-gray-200'}>Linha de Pesquisa</Label>
                  <Select value={formData.research_line} onValueChange={(v) => setFormData({...formData, research_line: v})}>
                    <SelectTrigger className={settings.highContrast ? 'bg-gray-800 text-white border-white' : 'bg-indigo-900/50 text-white'}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Linha 1: Junções Comunicantes</SelectItem>
                      <SelectItem value="2">Linha 2: Terapia Fotodinâmica</SelectItem>
                      <SelectItem value="3">Linha 3: Terapia Celular</SelectItem>
                      <SelectItem value="4">Linha 4: Ensino de Ciências</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label className={settings.highContrast ? 'text-white' : 'text-gray-200'}>Título</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    className={settings.highContrast ? 'bg-gray-800 text-white border-white' : 'bg-indigo-900/50 text-white'}
                  />
                </div>

                <div>
                  <Label className={settings.highContrast ? 'text-white' : 'text-gray-200'}>Autores (separados por vírgula)</Label>
                  <Input
                    value={formData.authors}
                    onChange={(e) => setFormData({...formData, authors: e.target.value})}
                    placeholder="Nome1, Nome2, Nome3"
                    required
                    className={settings.highContrast ? 'bg-gray-800 text-white border-white' : 'bg-indigo-900/50 text-white'}
                  />
                </div>

                <div>
                  <Label className={settings.highContrast ? 'text-white' : 'text-gray-200'}>Data</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                    className={settings.highContrast ? 'bg-gray-800 text-white border-white' : 'bg-indigo-900/50 text-white'}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className={settings.highContrast ? 'text-white' : 'text-gray-200'}>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                    rows={4}
                    className={settings.highContrast ? 'bg-gray-800 text-white border-white' : 'bg-indigo-900/50 text-white'}
                  />
                </div>

                <div>
                  <Label className={settings.highContrast ? 'text-white' : 'text-gray-200'}>Palavras-chave (separadas por vírgula)</Label>
                  <Input
                    value={formData.keywords}
                    onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                    placeholder="palavra1, palavra2, palavra3"
                    className={settings.highContrast ? 'bg-gray-800 text-white border-white' : 'bg-indigo-900/50 text-white'}
                  />
                </div>

                <div>
                  <Label className={settings.highContrast ? 'text-white' : 'text-gray-200'}>Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                    <SelectTrigger className={settings.highContrast ? 'bg-gray-800 text-white border-white' : 'bg-indigo-900/50 text-white'}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="concluido">Concluído</SelectItem>
                      <SelectItem value="publicado">Publicado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white">
                  Salvar Registro
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Records List */}
      <div className="grid md:grid-cols-2 gap-4">
        {loading ? (
          <p className={settings.highContrast ? 'text-white' : 'text-gray-200'}>Carregando...</p>
        ) : records.length === 0 ? (
          <Card className={`${
            settings.highContrast 
              ? 'bg-gray-900 border-white border-2' 
              : 'bg-gradient-to-br from-indigo-950/90 to-purple-950/90 backdrop-blur-xl border-indigo-700/30'
          } md:col-span-2`}>
            <CardContent className="py-12 text-center">
              <FileText className={`w-16 h-16 mx-auto mb-4 opacity-50 ${settings.highContrast ? 'text-white' : 'text-cyan-400'}`} />
              <p className={settings.highContrast ? 'text-white' : 'text-gray-200'}>
                Nenhum registro científico encontrado
              </p>
            </CardContent>
          </Card>
        ) : (
          records.map((record, idx) => (
            <Card
              key={record.id}
              className={`${
                settings.highContrast 
                  ? 'bg-gray-900 border-white border-2' 
                  : 'bg-gradient-to-br from-indigo-950/90 to-purple-950/90 backdrop-blur-xl border-indigo-700/30 hover:border-cyan-500/50'
              } transition-all duration-300 hover:scale-105 animate-slide-up`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${
                      settings.highContrast ? 'bg-gray-800' : 'bg-cyan-900/50'
                    }`}>
                      {getIcon(record.record_type)}
                    </div>
                    <div>
                      <div className={`text-xs uppercase font-mono ${
                        settings.highContrast ? 'text-gray-400' : 'text-cyan-400'
                      }`}>
                        {getTypeLabel(record.record_type)} • Linha {record.research_line}
                      </div>
                      <CardTitle className={`text-lg ${settings.highContrast ? 'text-white' : 'text-white'}`}>
                        {record.title}
                      </CardTitle>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDelete(record.id)}
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className={`text-sm ${settings.highContrast ? 'text-gray-300' : 'text-gray-300'}`}>
                  {record.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {record.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2 py-1 rounded-full ${
                        settings.highContrast 
                          ? 'bg-gray-800 text-gray-300' 
                          : 'bg-cyan-900/30 text-cyan-300'
                      }`}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={settings.highContrast ? 'text-gray-400' : 'text-gray-400'}>
                    Autores: {record.authors.join(", ")}
                  </span>
                  <span className={`px-2 py-1 rounded ${
                    record.status === 'publicado' 
                      ? 'bg-green-900/50 text-green-300' 
                      : record.status === 'concluido'
                      ? 'bg-blue-900/50 text-blue-300'
                      : 'bg-yellow-900/50 text-yellow-300'
                  }`}>
                    {getStatusLabel(record.status)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
