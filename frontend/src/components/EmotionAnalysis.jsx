import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/context/SettingsContext";

const EmotionAnalysis = ({ emotionData, sentimentData }) => {
  const { t } = useTranslation();
  const { settings, narrate } = useSettings();

  if (!emotionData && !sentimentData) {
    return null;
  }

  const emotions = [
    { key: 'sorrindo', emoji: '😊', label: t('emotions.smiling') },
    { key: 'serio', emoji: '😐', label: t('emotions.serious') },
    { key: 'triste', emoji: '😢', label: t('emotions.sad') },
    { key: 'surpreso', emoji: '😲', label: t('emotions.surprised') },
    { key: 'zangado', emoji: '😠', label: t('emotions.angry') },
    { key: 'neutro', emoji: '😶', label: t('emotions.neutral') }
  ];

  const sentiments = [
    { key: 'positivo', emoji: '👍', label: t('sentiments.positive') },
    { key: 'neutro', emoji: '➖', label: t('sentiments.neutral') },
    { key: 'negativo', emoji: '👎', label: t('sentiments.negative') }
  ];

  const handleEmotionClick = (emotion, count) => {
    const message = `${emotion.label}: ${count} ${count === 1 ? t('emotions.person') : t('emotions.people')}`;
    narrate(message);
  };

  const handleSentimentClick = (sentiment, count) => {
    const message = `${sentiment.label}: ${count} ${count === 1 ? t('sentiments.person') : t('sentiments.people')}`;
    narrate(message);
  };

  return (
    <div className="space-y-4">
      {/* Análise de Emoções */}
      {emotionData && (
        <Card className={`${settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-white/95 backdrop-blur-sm border-blue-200 shadow-lg'}`}>
          <CardHeader>
            <CardTitle className={`text-lg ${settings.highContrast ? 'text-white' : 'text-slate-800'} flex items-center gap-2`}>
              <span className="text-2xl">🎭</span>
              {t('emotions.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {emotions.map((emotion) => {
                const count = emotionData[emotion.key] || 0;
                return (
                  <button
                    key={emotion.key}
                    onClick={() => handleEmotionClick(emotion, count)}
                    className={`p-3 rounded-lg border text-center transition-all hover:scale-105 ${
                      settings.highContrast 
                        ? 'bg-gray-800 border-gray-600 hover:bg-gray-700 text-white' 
                        : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:border-blue-300 hover:shadow-md'
                    } ${count > 0 ? 'ring-2 ring-orange-400 shadow-lg' : ''}`}
                    data-testid={`emotion-${emotion.key}`}
                  >
                    <div className="text-3xl mb-1">{emotion.emoji}</div>
                    <div className={`text-sm font-medium mb-1 ${settings.highContrast ? 'text-gray-200' : 'text-slate-700'}`}>
                      {emotion.label}
                    </div>
                    <div className={`text-2xl font-bold ${
                      count > 0 
                        ? 'text-orange-600' 
                        : settings.highContrast ? 'text-gray-400' : 'text-slate-400'
                    }`}>
                      {count}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Análise de Sentimentos */}
      {sentimentData && (
        <Card className={`${settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-white/95 backdrop-blur-sm border-green-200 shadow-lg'}`}>
          <CardHeader>
            <CardTitle className={`text-lg ${settings.highContrast ? 'text-white' : 'text-slate-800'} flex items-center gap-2`}>
              <span className="text-2xl">💭</span>
              {t('sentiments.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {sentiments.map((sentiment) => {
                const count = sentimentData[sentiment.key] || 0;
                return (
                  <button
                    key={sentiment.key}
                    onClick={() => handleSentimentClick(sentiment, count)}
                    className={`p-4 rounded-lg border text-center transition-all hover:scale-105 ${
                      settings.highContrast 
                        ? 'bg-gray-800 border-gray-600 hover:bg-gray-700 text-white' 
                        : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-300 hover:shadow-md'
                    } ${count > 0 ? 'ring-2 ring-green-400 shadow-lg' : ''}`}
                    data-testid={`sentiment-${sentiment.key}`}
                  >
                    <div className="text-3xl mb-1">{sentiment.emoji}</div>
                    <div className={`text-sm font-medium mb-1 ${settings.highContrast ? 'text-gray-200' : 'text-slate-700'}`}>
                      {sentiment.label}
                    </div>
                    <div className={`text-2xl font-bold ${
                      count > 0 
                        ? 'text-green-600' 
                        : settings.highContrast ? 'text-gray-400' : 'text-slate-400'
                    }`}>
                      {count}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmotionAnalysis;