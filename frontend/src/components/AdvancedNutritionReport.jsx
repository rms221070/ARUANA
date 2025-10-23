import React from 'react';
import { Award, TrendingUp, AlertTriangle, CheckCircle, Info, Activity, Target, Zap } from 'lucide-react';

const AdvancedNutritionReport = ({ analysis }) => {
  if (!analysis || !analysis.nutritional_analysis) return null;

  const nutrition = analysis.nutritional_analysis;

  return (
    <div className="space-y-6 mt-6">
      {/* Quality Score */}
      {nutrition.quality_score && (
        <div className="bg-white rounded-2xl p-6 shadow-2xl border-4 border-orange-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500 p-2 rounded-xl">
                <Award size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Score de Qualidade Nutricional</h3>
                <p className="text-gray-700 text-sm font-semibold">Avaliação PhD em Nutrição</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-6xl font-bold text-orange-600">{nutrition.quality_score}</div>
              <div className="text-lg font-bold text-gray-700">de 100</div>
            </div>
          </div>
          
          {/* Score Bar */}
          <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden border-2 border-gray-300">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-1000 flex items-center justify-center"
              style={{ width: `${nutrition.quality_score}%` }}
            >
              <span className="text-white font-bold text-sm">{nutrition.quality_score}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Nutritional Balance */}
      {nutrition.nutritional_balance && (
        <div className="bg-white rounded-2xl p-6 shadow-2xl border-4 border-blue-600">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Activity size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Balanço de Macronutrientes</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {nutrition.nutritional_balance.protein_percent && (
              <div className="text-center bg-red-50 rounded-xl p-4 border-3 border-red-600">
                <div className="text-4xl font-bold text-red-700">
                  {nutrition.nutritional_balance.protein_percent.toFixed(1)}%
                </div>
                <div className="text-base font-bold text-gray-800 mt-2">Proteínas</div>
              </div>
            )}
            {nutrition.nutritional_balance.carbs_percent && (
              <div className="text-center bg-yellow-50 rounded-xl p-4 border-3 border-yellow-600">
                <div className="text-4xl font-bold text-yellow-700">
                  {nutrition.nutritional_balance.carbs_percent.toFixed(1)}%
                </div>
                <div className="text-base font-bold text-gray-800 mt-2">Carboidratos</div>
              </div>
            )}
            {nutrition.nutritional_balance.fat_percent && (
              <div className="text-center bg-green-50 rounded-xl p-4 border-3 border-green-600">
                <div className="text-4xl font-bold text-green-700">
                  {nutrition.nutritional_balance.fat_percent.toFixed(1)}%
                </div>
                <div className="text-base font-bold text-gray-800 mt-2">Gorduras</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Glycemic Info */}
      {(nutrition.glycemic_load || nutrition.nutritional_quality_index) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nutrition.glycemic_load && (
            <div className="bg-yellow-50 rounded-xl p-6 shadow-lg border-3 border-yellow-600">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-yellow-600 p-2 rounded-lg">
                  <Zap size={20} className="text-white" />
                </div>
                <h4 className="font-bold text-gray-900 text-lg">Carga Glicêmica</h4>
              </div>
              <div className="text-4xl font-bold text-yellow-700">{nutrition.glycemic_load.toFixed(1)}</div>
              <p className="text-base font-semibold text-gray-800 mt-2">
                {nutrition.glycemic_load < 10 ? 'Baixa ✓' : nutrition.glycemic_load < 20 ? 'Média' : 'Alta ⚠'}
              </p>
            </div>
          )}
          
          {nutrition.nutritional_quality_index && (
            <div className="bg-purple-50 rounded-xl p-6 shadow-lg border-3 border-purple-600">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-purple-600 p-2 rounded-lg">
                  <Target size={20} className="text-white" />
                </div>
                <h4 className="font-bold text-gray-900 text-lg">Índice de Qualidade</h4>
              </div>
              <div className="text-4xl font-bold text-purple-700">{nutrition.nutritional_quality_index.toFixed(1)}</div>
              <p className="text-base font-semibold text-gray-800 mt-2">de 10</p>
            </div>
          )}
        </div>
      )}

      {/* Positive Aspects */}
      {nutrition.positive_aspects && nutrition.positive_aspects.length > 0 && (
        <div className="bg-green-50 rounded-2xl p-6 shadow-2xl border-4 border-green-600">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-600 p-2 rounded-xl">
              <CheckCircle size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Aspectos Positivos</h3>
          </div>
          <ul className="space-y-3">
            {nutrition.positive_aspects.map((aspect, index) => (
              <li key={index} className="flex items-start gap-3 bg-white p-3 rounded-lg border-2 border-green-600">
                <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-900 font-medium">{aspect}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvement Areas */}
      {nutrition.improvement_areas && nutrition.improvement_areas.length > 0 && (
        <div className="bg-yellow-50 rounded-2xl p-6 shadow-2xl border-4 border-yellow-600">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-yellow-600 p-2 rounded-xl">
              <TrendingUp size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Áreas de Melhoria</h3>
          </div>
          <ul className="space-y-3">
            {nutrition.improvement_areas.map((area, index) => (
              <li key={index} className="flex items-start gap-3 bg-white p-3 rounded-lg border-2 border-yellow-600">
                <Info size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-900 font-medium">{area}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Health Alerts */}
      {nutrition.health_alerts && nutrition.health_alerts.length > 0 && (
        <div className="bg-red-50 rounded-2xl p-6 shadow-2xl border-4 border-red-600">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-600 p-2 rounded-xl">
              <AlertTriangle size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">⚠️ Alertas de Saúde</h3>
          </div>
          <ul className="space-y-3">
            {nutrition.health_alerts.map((alert, index) => (
              <li key={index} className="flex items-start gap-3 bg-white p-3 rounded-lg border-2 border-red-600">
                <AlertTriangle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-900 font-medium">{alert}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Health Recommendations */}
      {nutrition.health_recommendations && nutrition.health_recommendations.length > 0 && (
        <div className="bg-blue-50 rounded-2xl p-6 shadow-2xl border-4 border-blue-600">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Info size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">💡 Recomendações PhD</h3>
          </div>
          <ul className="space-y-3">
            {nutrition.health_recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-3 bg-white p-4 rounded-lg border-2 border-blue-600">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-base font-bold">{index + 1}</span>
                </div>
                <span className="text-gray-900 font-medium flex-1">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Dietary Compatibility */}
      {nutrition.dietary_compatibility && Object.keys(nutrition.dietary_compatibility).length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Compatibilidade com Dietas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(nutrition.dietary_compatibility).map(([diet, compatible]) => (
              <div 
                key={diet}
                className={`p-3 rounded-xl border-2 ${
                  compatible 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  {compatible ? (
                    <CheckCircle size={16} className="text-green-400" />
                  ) : (
                    <AlertTriangle size={16} className="text-red-400" />
                  )}
                  <span className="text-sm text-white capitalize">
                    {diet.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DRI Adequacy */}
      {nutrition.dri_adequacy && Object.keys(nutrition.dri_adequacy).length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Adequação às DRIs Brasileiras</h3>
          <div className="space-y-3">
            {Object.entries(nutrition.dri_adequacy).map(([nutrient, percentage]) => (
              <div key={nutrient}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-white/90 capitalize">{nutrient.replace('_', ' ')}</span>
                  <span className="text-sm font-semibold text-white">{percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      percentage >= 100 ? 'bg-green-500' : 
                      percentage >= 70 ? 'bg-yellow-500' : 
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ideal Consumption Time */}
      {nutrition.ideal_consumption_time && (
        <div className="bg-purple-500/10 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-2">Momento Ideal de Consumo</h3>
          <p className="text-white/90">{nutrition.ideal_consumption_time}</p>
        </div>
      )}
    </div>
  );
};

export default AdvancedNutritionReport;
