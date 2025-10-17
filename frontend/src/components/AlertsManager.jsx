import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Bell, Plus, Trash2, RefreshCw } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useSettings } from "@/context/SettingsContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AlertsManager = () => {
  const { t } = useTranslation();
  const { settings, narrate, narrateInterface } = useSettings();
  const [alerts, setAlerts] = useState([]);
  const [newAlertName, setNewAlertName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Narrate alerts section when loaded
    narrateInterface('panel', t('alerts.title'), t('alerts.description'));
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/alerts`);
      setAlerts(response.data);
    } catch (error) {
      toast.error(t('toast.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async () => {
    if (!newAlertName.trim()) {
      const msg = t('alerts.inputPlaceholder');
      toast.error(msg);
      narrate(msg);
      return;
    }

    try {
      const response = await axios.post(`${API}/alerts`, {
        object_name: newAlertName.trim(),
        enabled: true
      });
      setAlerts([...alerts, response.data]);
      setNewAlertName("");
      const successMsg = t('toast.alertCreated');
      toast.success(successMsg);
      narrate(`${t('alerts.title')}: ${newAlertName} ${successMsg}`);
    } catch (error) {
      toast.error(t('toast.loadError'));
    }
  };

  const deleteAlert = async (id) => {
    try {
      const alertToDelete = alerts.find(a => a.id === id);
      await axios.delete(`${API}/alerts/${id}`);
      setAlerts(alerts.filter(a => a.id !== id));
      const successMsg = t('toast.alertDeleted');
      toast.success(successMsg);
      narrate(`${t('alerts.title')} ${alertToDelete?.object_name} ${successMsg}`);
    } catch (error) {
      const errorMsg = t('toast.loadError');
      toast.error(errorMsg);
      narrate(errorMsg);
    }
  };

  const toggleAlert = async (id, enabled) => {
    try {
      await axios.patch(`${API}/alerts/${id}?enabled=${enabled}`);
      setAlerts(alerts.map(a => a.id === id ? { ...a, enabled } : a));
      const msg = enabled ? t('alerts.active') : t('alerts.inactive');
      toast.success(t('toast.alertUpdated'));
      narrate(msg);
    } catch (error) {
      toast.error(t('toast.loadError'));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(settings.language === 'pt' ? 'pt-BR' : settings.language);
  };

  return (
    <div className="max-w-4xl mx-auto" data-testid="alerts-manager-container">
      <Card className={`${settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-white/90 backdrop-blur-sm border-indigo-200 shadow-xl'}`}>
        <CardHeader>
          <CardTitle className={`text-2xl flex items-center justify-between ${settings.highContrast ? 'text-white' : 'text-slate-800'}`}>
            <div className="flex items-center gap-2">
              <Bell className={`w-6 h-6 ${settings.highContrast ? 'text-white' : 'text-indigo-600'}`} />
              {t('alerts.title')}
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
          <div className={`rounded-lg p-4 border ${
            settings.highContrast ? 'bg-gray-800 border-white' : 'bg-indigo-50 border-indigo-200'
          }`}>
            <h3 className={`font-semibold mb-2 ${settings.highContrast ? 'text-white' : 'text-indigo-900'}`}>{t('alerts.howItWorks')}</h3>
            <p className={`text-sm ${settings.highContrast ? 'text-gray-300' : 'text-indigo-700'}`}>
              {t('alerts.description')}
            </p>
          </div>

          <div className="flex gap-2" data-testid="create-alert-form">
            <Input
              value={newAlertName}
              onChange={(e) => setNewAlertName(e.target.value)}
              placeholder={t('alerts.inputPlaceholder')}
              onKeyPress={(e) => e.key === "Enter" && createAlert()}
              className={`flex-1 ${settings.highContrast ? 'bg-gray-800 text-white border-white' : ''}`}
              data-testid="alert-name-input"
            />
            <Button
              onClick={createAlert}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              data-testid="create-alert-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('alerts.add')}
            </Button>
          </div>

          <div className="space-y-3" data-testid="alerts-list">
            {loading ? (
              <div className={`text-center py-8 ${settings.highContrast ? 'text-gray-400' : 'text-slate-400'}`}>
                {t('toast.loadError')}
              </div>
            ) : alerts.length === 0 ? (
              <div className={`text-center py-8 ${settings.highContrast ? 'text-gray-400' : 'text-slate-400'}`} data-testid="no-alerts-message">
                <Bell className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>{t('alerts.noAlerts')}</p>
                <p className="text-sm mt-2">{t('alerts.noAlertsDesc')}</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    settings.highContrast 
                      ? 'bg-gray-800 border-gray-600 hover:border-gray-500' 
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                  data-testid={`alert-item-${alert.id}`}
                >
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg ${settings.highContrast ? 'text-white' : 'text-slate-800'}`}>{alert.object_name}</h3>
                    <p className={`text-xs mt-1 ${settings.highContrast ? 'text-gray-400' : 'text-slate-500'}`}>
                      {t('alerts.created')} {formatDate(alert.created_at)}
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
                        alert.enabled 
                          ? 'text-emerald-600' 
                          : settings.highContrast ? 'text-gray-400' : 'text-slate-400'
                      }`}>
                        {alert.enabled ? t('alerts.active') : t('alerts.inactive')}
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