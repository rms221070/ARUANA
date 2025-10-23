import React from 'react';
import { Award, TrendingUp, AlertTriangle, CheckCircle, Info, Activity, Target, Zap } from 'lucide-react';

const AdvancedNutritionReport = ({ analysis }) => {
  if (!analysis || !analysis.nutritional_analysis) return null;

  const nutrition = analysis.nutritional_analysis;

  return (
    <div className="space-y-6 mt-6">
      {/* Quality Score */}
      {nutrition.quality_score && (
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm border border-orange-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Award size={32} className="text-orange-400" />
              <div>
                <h3 className="text-xl font-bold text-white">Score de Qualidade Nutricional</h3>
                <p className="text-orange-200 text-sm">Avaliação PhD em Nutrição</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-orange-400">{nutrition.quality_score}</div>
              <div className="text-sm text-orange-200">de 100</div>
            </div>
          </div>
          
          {/* Score Bar */}
          <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-1000"
              style={{ width: `${nutrition.quality_score}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Nutritional Balance */}
      {nutrition.nutritional_balance && (
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity size={24} className="text-blue-400" />
            <h3 className="text-lg font-bold text-white">Balanço de Macronutrientes</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {nutrition.nutritional_balance.protein_percent && (
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400">
                  {nutrition.nutritional_balance.protein_percent.toFixed(1)}%
                </div>
                <div className="text-sm text-white/70">Proteínas</div>
              </div>
            )}
            {nutrition.nutritional_balance.carbs_percent && (
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">
                  {nutrition.nutritional_balance.carbs_percent.toFixed(1)}%
                </div>
                <div className="text-sm text-white/70">Carboidratos</div>
              </div>
            )}
            {nutrition.nutritional_balance.fat_percent && (
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">
                  {nutrition.nutritional_balance.fat_percent.toFixed(1)}%
                </div>
                <div className="text-sm text-white/70">Gorduras</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Glycemic Info */}
      {(nutrition.glycemic_load || nutrition.nutritional_quality_index) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nutrition.glycemic_load && (
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={20} className="text-yellow-400" />
                <h4 className="font-semibold text-white">Carga Glicêmica</h4>
              </div>
              <div className="text-2xl font-bold text-yellow-400">{nutrition.glycemic_load.toFixed(1)}</div>
              <p className="text-xs text-white/60 mt-1">
                {nutrition.glycemic_load < 10 ? 'Baixa' : nutrition.glycemic_load < 20 ? 'Média' : 'Alta'}
              </p>
            </div>
          )}
          
          {nutrition.nutritional_quality_index && (
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target size={20} className="text-purple-400" />
                <h4 className="font-semibold text-white">Índice de Qualidade</h4>
              </div>
              <div className="text-2xl font-bold text-purple-400">{nutrition.nutritional_quality_index.toFixed(1)}</div>
              <p className="text-xs text-white/60 mt-1">de 10</p>
            </div>
          )}
        </div>
      )}

      {/* Positive Aspects */}
      {nutrition.positive_aspects && nutrition.positive_aspects.length > 0 && (
        <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle size={24} className="text-green-400" />
            <h3 className="text-lg font-bold text-white">Aspectos Positivos</h3>
          </div>
          <ul className="space-y-2">
            {nutrition.positive_aspects.map((aspect, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle size={16} className="text-green-400 mt-1 flex-shrink-0" />
                <span className="text-white/90">{aspect}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvement Areas */}
      {nutrition.improvement_areas && nutrition.improvement_areas.length > 0 && (
        <div className="bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp size={24} className="text-yellow-400" />
            <h3 className="text-lg font-bold text-white">Áreas de Melhoria</h3>
          </div>
          <ul className="space-y-2">
            {nutrition.improvement_areas.map((area, index) => (
              <li key={index} className="flex items-start gap-2">
                <Info size={16} className="text-yellow-400 mt-1 flex-shrink-0" />
                <span className="text-white/90">{area}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Health Alerts */}
      {nutrition.health_alerts && nutrition.health_alerts.length > 0 && (
        <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={24} className="text-red-400" />
            <h3 className="text-lg font-bold text-white">Alertas de Saúde</h3>
          </div>
          <ul className="space-y-2">
            {nutrition.health_alerts.map((alert, index) => (
              <li key={index} className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-400 mt-1 flex-shrink-0" />
                <span className="text-white/90">{alert}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Health Recommendations */}
      {nutrition.health_recommendations && nutrition.health_recommendations.length > 0 && (
        <div className="bg-blue-500/10 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Info size={24} className="text-blue-400" />
            <h3 className="text-lg font-bold text-white">Recomendações PhD</h3>
          </div>
          <ul className="space-y-3">
            {nutrition.health_recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-400 text-sm font-semibold">{index + 1}</span>
                </div>
                <span className="text-white/90">{recommendation}</span>
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
