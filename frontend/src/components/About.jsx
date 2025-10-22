import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings } from "@/context/SettingsContext";
import { Microscope, GraduationCap, Beaker, BookOpen, Users, Award, Bell, Network, Info } from "lucide-react";
import AlertsManager from "@/components/AlertsManager";
import ScientificCollaboration from "@/components/ScientificCollaboration";
import SystemManual from "@/components/SystemManual";
import TechnicalDocument from "@/components/TechnicalDocumentNew";

const About = () => {
  const { settings } = useSettings();

  return (
    <div className="max-w-6xl mx-auto space-y-6" data-testid="about-container">
      {/* Main Title Card */}
      <Card className={`${
        settings.highContrast 
          ? 'bg-gray-900 border-white border-2' 
          : 'bg-gradient-to-br from-indigo-950/90 via-purple-950/90 to-slate-950/90 backdrop-blur-xl border-indigo-700/30 shadow-2xl'
      } animate-fade-in`}>
        <CardHeader>
          <CardTitle className={`text-3xl font-bold text-center ${
            settings.highContrast 
              ? 'text-white' 
              : 'bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent'
          }`}>
            <div className="flex items-center justify-center gap-3 mb-2">
              <Microscope className="w-10 h-10 text-cyan-400 animate-pulse-slow" />
              Laboratório de Comunicação Celular
            </div>
          </CardTitle>
          <p className={`text-center text-lg ${settings.highContrast ? 'text-gray-300' : 'text-cyan-300'}`}>
            Instituto Oswaldo Cruz (IOC/Fiocruz)
          </p>
        </CardHeader>
        <CardContent>
          <div className={`p-6 rounded-xl ${
            settings.highContrast ? 'bg-gray-800' : 'bg-gradient-to-br from-indigo-900/50 to-purple-900/50'
          } border ${settings.highContrast ? 'border-gray-600' : 'border-cyan-500/20'}`}>
            <p className={`text-lg leading-relaxed ${settings.highContrast ? 'text-gray-200' : 'text-gray-200'}`}>
              O Laboratório de Comunicação Celular (LCC) do Instituto Oswaldo Cruz (IOC/Fiocruz) atua, desde 2004, 
              na área de <span className={`font-semibold ${settings.highContrast ? 'text-white' : 'text-cyan-300'}`}>Biofísica Translacional</span>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Research Lines */}
      <Card className={`${
        settings.highContrast 
          ? 'bg-gray-900 border-white border-2' 
          : 'bg-gradient-to-br from-indigo-950/90 via-purple-950/90 to-slate-950/90 backdrop-blur-xl border-indigo-700/30 shadow-2xl'
      } animate-fade-in`}>
        <CardHeader>
          <CardTitle className={`text-2xl flex items-center gap-2 ${
            settings.highContrast ? 'text-white' : 'text-cyan-300'
          }`}>
            <Beaker className="w-7 h-7" />
            Linhas de Pesquisa
          </CardTitle>
          <p className={`text-sm ${settings.highContrast ? 'text-gray-300' : 'text-gray-300'}`}>
            Atualmente, são desenvolvidas quatro linhas de pesquisa no laboratório, cujas metas são promover inovações 
            tecnológicas nas áreas de saúde e de ensino:
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                number: "01",
                title: "Junções Comunicantes e Receptores Purinérgicos",
                description: "Estudo de junções comunicantes e de receptores purinérgicos no sistema imune",
                icon: "🔬",
                color: "from-cyan-500 to-blue-600"
              },
              {
                number: "02",
                title: "Terapia Fotodinâmica",
                description: "Estudo da ação fotodinâmica no tratamento de tumores",
                icon: "💡",
                color: "from-purple-500 to-pink-600"
              },
              {
                number: "03",
                title: "Terapia Celular",
                description: "Desenvolvimento e aplicação de terapias celulares avançadas",
                icon: "🧬",
                color: "from-green-500 to-teal-600"
              },
              {
                number: "04",
                title: "Ensino de Ciências e Saúde",
                description: "Inovações pedagógicas em ciências e saúde",
                icon: "📚",
                color: "from-orange-500 to-red-600"
              }
            ].map((line, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-xl ${
                  settings.highContrast 
                    ? 'bg-gray-800 border border-gray-600' 
                    : 'bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-cyan-500/20'
                } hover:scale-105 transition-all duration-300 cursor-pointer group animate-slide-up`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`text-5xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    {line.icon}
                  </div>
                  <div className="flex-1">
                    <div className={`text-xs font-mono mb-2 ${
                      settings.highContrast ? 'text-gray-400' : 'text-cyan-400'
                    }`}>
                      LINHA {line.number}
                    </div>
                    <h3 className={`text-lg font-bold mb-2 ${
                      settings.highContrast ? 'text-white' : 'text-white'
                    }`}>
                      {line.title}
                    </h3>
                    <p className={`text-sm ${
                      settings.highContrast ? 'text-gray-300' : 'text-gray-300'
                    }`}>
                      {line.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Project Information */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className={`${
          settings.highContrast 
            ? 'bg-gray-900 border-white border-2' 
            : 'bg-gradient-to-br from-cyan-950/90 to-blue-950/90 backdrop-blur-xl border-cyan-700/30 shadow-2xl'
        } animate-fade-in hover:shadow-cyan-500/20 hover:shadow-2xl transition-all duration-300`}>
          <CardHeader>
            <CardTitle className={`text-xl flex items-center gap-2 ${
              settings.highContrast ? 'text-white' : 'text-cyan-300'
            }`}>
              <GraduationCap className="w-6 h-6" />
              Projeto de Pós-Doutorado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`p-4 rounded-lg ${
              settings.highContrast ? 'bg-gray-800' : 'bg-cyan-900/30'
            }`}>
              <div className={`text-xs uppercase tracking-wider mb-2 ${
                settings.highContrast ? 'text-gray-400' : 'text-cyan-400'
              }`}>
                Aluno de Pós-Doutorado
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  settings.highContrast ? 'bg-gray-700' : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                } shadow-lg`}>
                  <Users className={`w-6 h-6 ${settings.highContrast ? 'text-white' : 'text-white'}`} />
                </div>
                <div>
                  <p className={`font-bold text-lg ${
                    settings.highContrast ? 'text-white' : 'text-white'
                  }`}>
                    Ricardo Marciano dos Santos
                  </p>
                  <p className={`text-sm ${
                    settings.highContrast ? 'text-gray-400' : 'text-cyan-300'
                  }`}>
                    Pesquisador Pós-Doc
                  </p>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${
              settings.highContrast ? 'bg-gray-800' : 'bg-cyan-900/30'
            }`}>
              <div className={`text-xs uppercase tracking-wider mb-2 ${
                settings.highContrast ? 'text-gray-400' : 'text-cyan-400'
              }`}>
                Supervisor de Pós-Doutorado
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  settings.highContrast ? 'bg-gray-700' : 'bg-gradient-to-br from-purple-500 to-pink-600'
                } shadow-lg`}>
                  <Award className={`w-6 h-6 ${settings.highContrast ? 'text-white' : 'text-white'}`} />
                </div>
                <div>
                  <p className={`font-bold text-lg ${
                    settings.highContrast ? 'text-white' : 'text-white'
                  }`}>
                    Luiz Anastacio Alves
                  </p>
                  <p className={`text-sm ${
                    settings.highContrast ? 'text-gray-400' : 'text-cyan-300'
                  }`}>
                    Orientador Principal
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${
          settings.highContrast 
            ? 'bg-gray-900 border-white border-2' 
            : 'bg-gradient-to-br from-purple-950/90 to-pink-950/90 backdrop-blur-xl border-purple-700/30 shadow-2xl'
        } animate-fade-in hover:shadow-purple-500/20 hover:shadow-2xl transition-all duration-300`}>
          <CardHeader>
            <CardTitle className={`text-xl flex items-center gap-2 ${
              settings.highContrast ? 'text-white' : 'text-purple-300'
            }`}>
              <BookOpen className="w-6 h-6" />
              Sobre o Sistema ARUANÃ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className={`leading-relaxed ${
                settings.highContrast ? 'text-gray-200' : 'text-gray-200'
              }`}>
                O <span className="font-bold text-cyan-400">ARUANÃ - Visão Assistiva</span> é um sistema inovador 
                desenvolvido utilizando Inteligência Artificial para proporcionar acessibilidade e autonomia a 
                pessoas cegas e com baixa visão.
              </p>
              
              <div className={`p-4 rounded-lg ${
                settings.highContrast ? 'bg-gray-800' : 'bg-purple-900/30'
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  settings.highContrast ? 'text-white' : 'text-purple-300'
                }`}>
                  Tecnologias Utilizadas:
                </h4>
                <ul className={`space-y-1 text-sm ${
                  settings.highContrast ? 'text-gray-300' : 'text-gray-300'
                }`}>
                  <li>• Google Gemini Vision AI</li>
                  <li>• TensorFlow.js (COCO-SSD)</li>
                  <li>• Web Speech API (TTS)</li>
                  <li>• Sistema Multilíngue (5 idiomas)</li>
                </ul>
              </div>

              <div className={`p-4 rounded-lg ${
                settings.highContrast ? 'bg-gray-800' : 'bg-purple-900/30'
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  settings.highContrast ? 'text-white' : 'text-purple-300'
                }`}>
                  Funcionalidades Principais:
                </h4>
                <ul className={`space-y-1 text-sm ${
                  settings.highContrast ? 'text-gray-300' : 'text-gray-300'
                }`}>
                  <li>• Detecção em tempo real via webcam</li>
                  <li>• Análise de imagens carregadas</li>
                  <li>• Narração automática de descrições</li>
                  <li>• Sistema de alertas configurável</li>
                  <li>• Relatórios e exportação de dados</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <Card className={`${
        settings.highContrast 
          ? 'bg-gray-900 border-white border-2' 
          : 'bg-gradient-to-r from-indigo-950/90 via-purple-950/90 to-slate-950/90 backdrop-blur-xl border-indigo-700/30'
      }`}>
        <CardContent className="py-6">
          <p className={`text-center text-sm ${
            settings.highContrast ? 'text-gray-400' : 'text-gray-400'
          }`}>
            © 2024 Laboratório de Comunicação Celular - IOC/Fiocruz | 
            Desenvolvido como parte do Projeto de Pós-Doutorado | 
            Transformando informações visuais em experiências auditivas interativas
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;
