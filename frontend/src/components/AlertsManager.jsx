import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Bell, Plus, Trash2, RefreshCw } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AlertsManager = () => {
  const [alerts, setAlerts] = useState([]);
  const [newAlertName, setNewAlertName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/alerts`);
      setAlerts(response.data);
    } catch (error) {
      toast.error("Erro ao carregar alertas");
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async () => {
    if (!newAlertName.trim()) {
      toast.error("Digite um nome para o alerta");
      return;
    }

    try {
      const response = await axios.post(`${API}/alerts`, {
        object_name: newAlertName.trim(),
        enabled: true
      });
      setAlerts([...alerts, response.data]);
      setNewAlertName("");
      toast.success("Alerta criado com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar alerta");
    }
  };

  const deleteAlert = async (id) => {
    try {
      await axios.delete(`${API}/alerts/${id}`);
      setAlerts(alerts.filter(a => a.id !== id));
      toast.success("Alerta removido");
    } catch (error) {
      toast.error("Erro ao remover alerta");
    }
  };

  const toggleAlert = async (id, enabled) => {
    try {
      await axios.patch(`${API}/alerts/${id}?enabled=${enabled}`);
      setAlerts(alerts.map(a => a.id === id ? { ...a, enabled } : a));
      toast.success(enabled ? "Alerta ativado" : "Alerta desativado");
    } catch (error) {
      toast.error("Erro ao atualizar alerta");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  return (
    <div className="max-w-4xl mx-auto" data-testid="alerts-manager-container">
      <Card className="bg-white/90 backdrop-blur-sm border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-600" />
              Gerenciar Alertas
            </div>
            <Button
              onClick={fetchAlerts}
              variant="ghost"
              size="icon"
              data-testid="refresh-alerts-btn"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Como funciona?</h3>
            <p className="text-sm text-blue-700">
              Crie alertas para objetos específicos. Quando esses objetos forem detectados,
              você será notificado. Por exemplo: "pessoa", "carro", "cão", etc.
            </p>
          </div>

          <div className="flex gap-2" data-testid="create-alert-form">
            <Input
              value={newAlertName}
              onChange={(e) => setNewAlertName(e.target.value)}
              placeholder="Nome do objeto (ex: pessoa, carro...)"
              onKeyPress={(e) => e.key === "Enter" && createAlert()}
              className="flex-1"
              data-testid="alert-name-input"
            />
            <Button
              onClick={createAlert}
              className="bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white"
              data-testid="create-alert-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-3" data-testid="alerts-list">
            {loading ? (
              <div className="text-center py-8 text-slate-400">Carregando alertas...</div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8 text-slate-400" data-testid="no-alerts-message">
                <Bell className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Nenhum alerta configurado</p>
                <p className="text-sm mt-2">Adicione alertas para ser notificado quando objetos específicos forem detectados</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                  data-testid={`alert-item-${alert.id}`}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 text-lg">{alert.object_name}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Criado em: {formatDate(alert.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.enabled}
                        onCheckedChange={(checked) => toggleAlert(alert.id, checked)}
                        data-testid={`toggle-alert-${alert.id}`}
                      />
                      <span className={`text-sm font-medium ${
                        alert.enabled ? "text-emerald-600" : "text-slate-400"
                      }`}>
                        {alert.enabled ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <Button
                      onClick={() => deleteAlert(alert.id)}
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      data-testid={`delete-alert-${alert.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertsManager;