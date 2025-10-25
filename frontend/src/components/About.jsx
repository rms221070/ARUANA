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

      {/* Extended Sections - Alertas, Colaboração, Documentação */}
      <Card className={`${
        settings.highContrast 
          ? 'bg-gray-900 border-white border-2' 
          : 'bg-gradient-to-br from-slate-950/90 via-indigo-950/90 to-purple-950/90 backdrop-blur-xl border-slate-700/30 shadow-2xl'
      } animate-fade-in`}>
        <CardHeader>
          <CardTitle className={`text-2xl flex items-center gap-2 ${
            settings.highContrast ? 'text-white' : 'text-slate-300'
          }`}>
            <Info className="w-6 h-6" />
            Seções Adicionais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="alerts" className="w-full">
            <TabsList className={`grid w-full grid-cols-4 mb-6 ${
              settings.highContrast 
                ? 'bg-gray-800 border-2 border-gray-600' 
                : 'bg-slate-900/50 backdrop-blur-md'
            }`}>
              <TabsTrigger value="alerts" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Alertas</span>
              </TabsTrigger>
              <TabsTrigger value="collaboration" className="flex items-center gap-2">
                <Network className="w-4 h-4" />
                <span className="hidden sm:inline">Colaboração</span>
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Manual</span>
              </TabsTrigger>
              <TabsTrigger value="technical" className="flex items-center gap-2">
                <Beaker className="w-4 h-4" />
                <span className="hidden sm:inline">Técnico</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="alerts">
              <AlertsManager />
            </TabsContent>

            <TabsContent value="collaboration">
              <ScientificCollaboration />
            </TabsContent>

            <TabsContent value="manual">
              <SystemManual />
            </TabsContent>

            <TabsContent value="technical">
              <TechnicalDocument />
            </TabsContent>

            <TabsContent value="report">
              <Card className="bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-6 h-6 text-blue-600" />
                    Relatório Científico do Projeto
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none">
                  <div className="space-y-6">
                    <section>
                      <h3 className="text-2xl font-bold text-blue-900">RESUMO CIENTÍFICO</h3>
                      <p className="text-justify">
                        O presente projeto de pós-doutorado, desenvolvido no Laboratório de Comunicação Celular (LCC) 
                        do Instituto Oswaldo Cruz (IOC/Fiocruz), apresenta o sistema ARUANÃ - uma plataforma inovadora 
                        de visão assistiva baseada em inteligência artificial para promoção da acessibilidade e inclusão 
                        digital de pessoas cegas ou com deficiência visual.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-2xl font-bold text-blue-900">OBJETIVOS</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Desenvolver sistema de visão computacional com IA para transformar informações visuais em descrições auditivas ultra-detalhadas</li>
                        <li>Implementar análise multimodal incluindo detecção de objetos, pessoas, emoções, textos (OCR) e análise nutricional</li>
                        <li>Criar interface acessível com narração Text-to-Speech em múltiplos idiomas</li>
                        <li>Validar tecnologicamente a aplicabilidade de IA (Gemini 2.0 Flash) para acessibilidade</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-2xl font-bold text-blue-900">METODOLOGIA</h3>
                      <p className="text-justify">
                        <strong>Stack Tecnológico:</strong> Frontend em React 18 com Tailwind CSS e Shadcn UI; 
                        Backend em FastAPI (Python 3.11); Banco de dados MongoDB; Integração com Google Vision API 
                        e Gemini 2.0 Flash via emergentintegrations library.
                      </p>
                      <p className="text-justify">
                        <strong>Arquitetura:</strong> Sistema client-server com autenticação JWT, retry logic 
                        com exponential backoff, geolocalização GPS, categorização inteligente automática, 
                        e sistema de tags para organização semântica do conteúdo.
                      </p>
                      <p className="text-justify">
                        <strong>Prompt Engineering:</strong> Desenvolvimento de prompts especializados em nível PhD 
                        para análise nutricional, OCR ultra-detalhado preservando formatação, e descrições 
                        microscópicas com medidas precisas (mm, graus, proporções, hex codes) totalizando 
                        300+ palavras por análise.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-2xl font-bold text-blue-900">RESULTADOS</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Sistema funcional v3.0</strong> com 13 categorias automáticas e tags semânticas</li>
                        <li><strong>Descrições 200% mais detalhadas</strong> com análise biométrica, dermatológica e anatômica milimétrica</li>
                        <li><strong>OCR especializado</strong> para livros, quadros e documentos com preservação estrutural</li>
                        <li><strong>Análise nutricional PhD</strong> com macros, micros, índices glicêmicos e compatibilidade dietética</li>
                        <li><strong>Geolocalização GPS</strong> integrada com precisão em metros</li>
                        <li><strong>TTS em 5 idiomas</strong> com vozes masculina/feminina ajustáveis</li>
                        <li><strong>Autenticação completa</strong> com JWT, perfil de usuário e recuperação de senha</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-2xl font-bold text-blue-900">DISCUSSÃO</h3>
                      <p className="text-justify">
                        Os resultados demonstram a viabilidade técnica de sistemas de IA multimodal (Gemini 2.0 Flash) 
                        para acessibilidade. A integração de visão computacional, NLP e geolocalização proporciona 
                        experiência sensorial ampliada para usuários cegos. A categorização inteligente com scoring 
                        algorítmico e tags automáticas permite organização semântica do conhecimento adquirido. 
                        O sistema de retry logic e tratamento robusto de erros garante confiabilidade em ambientes 
                        de produção.
                      </p>
                      <p className="text-justify">
                        Limitações identificadas incluem dependência de conectividade (cloud-based), rate limits 
                        de APIs (60 RPM Gemini), e necessidade de HTTPS para acesso à câmera. Trabalhos futuros 
                        incluem implementação de 31 idiomas, reverse geocoding com Google Maps, integração com 
                        WeatherAPI para temperatura contextual, e comandos por voz.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-2xl font-bold text-blue-900">CONCLUSÃO</h3>
                      <p className="text-justify">
                        O sistema ARUANÃ representa avanço significativo na área de tecnologia assistiva, 
                        demonstrando que IA generativa pode ser efetivamente aplicada para promover inclusão 
                        digital. A abordagem multimodal (visão + áudio + geolocalização + categorização semântica) 
                        cria ecossistema informacional rico que empodera pessoas cegas a navegarem o mundo visual 
                        com autonomia. Este projeto contribui para a linha de pesquisa do LCC em biofísica 
                        translacional aplicada à acessibilidade.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-2xl font-bold text-blue-900">PUBLICAÇÕES E IMPACTO</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Sistema open-source disponível para pesquisa e replicação</li>
                        <li>Documentação técnico-científica completa (v3.0)</li>
                        <li>Histórico detalhado de 5 versões evolutivas</li>
                        <li>Base para artigos científicos em acessibilidade e IA</li>
                        <li>Potencial para patente de método de categorização inteligente</li>
                      </ul>
                    </section>

                    <section>
                      <h3 className="text-2xl font-bold text-blue-900">AGRADECIMENTOS</h3>
                      <p className="text-justify">
                        Ao Instituto Oswaldo Cruz (IOC/Fiocruz) e ao Laboratório de Comunicação Celular (LCC) 
                        pelo suporte institucional e infraestrutura de pesquisa. Ao Prof. Dr. Luiz Anastacio Alves 
                        pela supervisão científica. À comunidade de pessoas cegas que inspirou este trabalho.
                      </p>
                    </section>

                    <section className="border-t-2 border-blue-200 pt-4">
                      <h3 className="text-2xl font-bold text-blue-900">REFERÊNCIAS TÉCNICAS</h3>
                      <ol className="list-decimal pl-6 space-y-1 text-sm">
                        <li>Google AI. (2024). Gemini 2.0 Flash: Multimodal AI Model Documentation.</li>
                        <li>Google Cloud. (2024). Vision AI API Reference.</li>
                        <li>FastAPI Documentation. (2024). Modern Python Web Framework.</li>
                        <li>MongoDB. (2024). Motor: Async Python Driver for MongoDB.</li>
                        <li>React Team. (2024). React 18: JavaScript Library for UI.</li>
                        <li>W3C. (2024). Web Speech API Specification.</li>
                        <li>WCAG. (2024). Web Content Accessibility Guidelines 3.0.</li>
                      </ol>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className={`${
        settings.highContrast 
          ? 'bg-gray-900 border-white border-2' 
          : 'bg-gradient-to-r from-cyan-950/90 to-blue-950/90 backdrop-blur-xl border-cyan-700/30 shadow-2xl'
      } animate-fade-in`}>
        <CardHeader>
          <CardTitle className={`text-2xl flex items-center gap-2 ${
            settings.highContrast ? 'text-white' : 'text-cyan-300'
          }`}>
            <Users className="w-6 h-6" />
            Contato do Pesquisador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-6 rounded-xl ${
            settings.highContrast ? 'bg-gray-800' : 'bg-gradient-to-br from-cyan-900/40 to-blue-900/40'
          } border ${settings.highContrast ? 'border-gray-600' : 'border-cyan-500/20'}`}>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className={`text-lg font-bold mb-3 ${
                  settings.highContrast ? 'text-white' : 'text-cyan-300'
                }`}>
                  Aluno Pós-Doutorado
                </h3>
                <div className="space-y-2">
                  <p className={`${settings.highContrast ? 'text-gray-200' : 'text-gray-200'}`}>
                    <strong>Nome:</strong> Ricardo Marciano dos Santos
                  </p>
                  <p className={`${settings.highContrast ? 'text-gray-200' : 'text-gray-200'}`}>
                    <strong>E-mail:</strong>{' '}
                    <a 
                      href="mailto:rms221070@gmail.com" 
                      className="text-cyan-400 hover:text-cyan-300 underline"
                    >
                      rms221070@gmail.com
                    </a>
                  </p>
                  <p className={`${settings.highContrast ? 'text-gray-200' : 'text-gray-200'}`}>
                    <strong>WhatsApp:</strong>{' '}
                    <a 
                      href="https://wa.me/5521996431970" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 underline"
                    >
                      +55 21 99643-1970
                    </a>
                  </p>
                </div>
              </div>
              <div>
                <h3 className={`text-lg font-bold mb-3 ${
                  settings.highContrast ? 'text-white' : 'text-cyan-300'
                }`}>
                  Supervisor
                </h3>
                <div className="space-y-2">
                  <p className={`${settings.highContrast ? 'text-gray-200' : 'text-gray-200'}`}>
                    <strong>Nome:</strong> Prof. Dr. Luiz Anastacio Alves
                  </p>
                  <p className={`${settings.highContrast ? 'text-gray-200' : 'text-gray-200'}`}>
                    <strong>Instituição:</strong> IOC/Fiocruz
                  </p>
                  <p className={`${settings.highContrast ? 'text-gray-200' : 'text-gray-200'}`}>
                    <strong>Laboratório:</strong> LCC - Laboratório de Comunicação Celular
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-cyan-500/20">
              <p className={`text-center text-sm ${settings.highContrast ? 'text-gray-300' : 'text-cyan-200'}`}>
                Para colaborações científicas, dúvidas sobre o projeto ou sugestões, 
                entre em contato através dos canais acima.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
