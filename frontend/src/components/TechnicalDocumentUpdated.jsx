import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Download, ChevronRight } from "lucide-react";

const TechnicalDocumentUpdated = () => {
  const [activeSection, setActiveSection] = useState("intro");

  const sections = {
    intro: "Introdução",
    versions: "Histórico de Versões",
    modules: "Módulos Especializados (15)",
    architecture: "Arquitetura Técnica",
    features: "Funcionalidades Implementadas",
    ai: "Inteligência Artificial",
    security: "Segurança e Autenticação",
    geolocation: "Sistema de Geolocalização",
    categorization: "Categorização Inteligente",
    ocr: "OCR e Leitura de Textos",
    nutrition: "Análise Nutricional PhD",
    api: "Documentação de APIs",
    deployment: "Deploy e Infraestrutura"
  };

  const downloadPDF = () => {
    const element = document.getElementById('technical-content');
    const text = element.innerText;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ARUANA_Documentacao_Tecnica_v3.0.txt';
    a.click();
  };

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      {/* Sidebar */}
      <Card className="lg:col-span-1 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Navegação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {Object.entries(sections).map(([key, label]) => (
              <Button
                key={key}
                variant={activeSection === key ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveSection(key)}
              >
                <ChevronRight className="w-4 h-4 mr-2" />
                {label}
              </Button>
            ))}
          </div>
          <Button
            onClick={downloadPDF}
            className="w-full mt-4"
            variant="outline"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar Documentação
          </Button>
        </CardContent>
      </Card>

      {/* Content */}
      <Card className="lg:col-span-3 bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>
            ARUANÃ - Documentação Técnico-Científica v3.0
          </CardTitle>
          <p className="text-sm text-slate-600">
            Sistema Avançado de Visão Assistiva com IA
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[700px] pr-4">
            <div id="technical-content" className="space-y-6 font-mono text-xs">
              
              {activeSection === "intro" && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</h2>
                  <h2 className="text-2xl font-bold text-center">ARUANÃ - VISÃO ASSISTIVA</h2>
                  <h3 className="text-xl text-center">Sistema de Inteligência Artificial para Acessibilidade Total</h3>
                  <h2 className="text-2xl font-bold">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</h2>
                  
                  <div className="space-y-4 mt-6">
                    <h3 className="text-lg font-bold">📋 INFORMAÇÕES DO DOCUMENTO</h3>
                    <pre className="bg-slate-900 text-green-400 p-4 rounded">
{`┌─────────────────────────────────────────────────┐
│ Versão do Sistema: 5.0.0 (Build 2025.11.16)   │
│ Tipo: Documentação Técnico-Científica         │
│ Última Atualização: 16 de Novembro de 2025    │
│ Autores: Ricardo Marciano dos Santos (Pós-Doc)│
│         Luiz Anastacio Alves (Supervisor)      │
│ Instituição: LCC - Lab. Comunicação Celular   │
│ Status: Produção - Totalmente Operacional     │
│ Recursos: 15 Módulos Especializados          │
└─────────────────────────────────────────────────┘`}
                    </pre>

                    <h3 className="text-lg font-bold mt-6">🎯 RESUMO EXECUTIVO</h3>
                    <p className="leading-relaxed">
                      O ARUANÃ é um sistema revolucionário de visão assistiva que utiliza
                      inteligência artificial avançada (Gemini 2.0 Flash + Google Vision API)
                      para transformar informações visuais em descrições auditivas ultra-detalhadas,
                      proporcionando autonomia total para pessoas cegas ou com deficiência visual.
                    </p>

                    <h3 className="text-lg font-bold mt-6">🌟 PRINCIPAIS CARACTERÍSTICAS (15 Módulos)</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>✅ Detecção em Tempo Real via Webcam</li>
                      <li>✅ Análise de Imagens por Upload</li>
                      <li>✅ OCR Avançado para Leitura de Textos</li>
                      <li>✅ Análise Nutricional PhD com 30+ nutrientes</li>
                      <li>✅ Busca Inteligente de Objetos com Distância e Navegação</li>
                      <li>✅ Leitor Especializado de Braille (Grade 1 e 2)</li>
                      <li>✅ Sistema de Segurança no Trânsito (2 modos)</li>
                      <li>✅ Identificação de Moedas e Valores</li>
                      <li>✅ Detecção de Cores com RGB/Hex</li>
                      <li>✅ Análise de Pessoas (Selfie Mode)</li>
                      <li>✅ Geolocalização GPS Integrada</li>
                      <li>✅ Sistema de Categorização (11 categorias)</li>
                      <li>✅ Text-to-Speech em 36 Idiomas</li>
                      <li>✅ Autenticação JWT + Gestão de Perfil</li>
                      <li>✅ Interface Ultra-Acessível com Alto Contraste</li>
                      <li>✅ Descrições Ultradetalhadas (300+ palavras)</li>
                      <li>✅ Relatórios Inteligentes e Histórico</li>
                    </ul>

                    <h3 className="text-lg font-bold mt-6">🔬 APLICAÇÕES CIENTÍFICAS</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Pesquisa em Acessibilidade e Inclusão Digital</li>
                      <li>Desenvolvimento de IA para Visão Computacional</li>
                      <li>Estudos de Usabilidade para Deficientes Visuais</li>
                      <li>Análise Comportamental via Emoções</li>
                      <li>Nutrição Clínica Assistida por IA</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeSection === "versions" && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">📚 HISTÓRICO DE VERSÕES DETALHADO</h2>
                  <p className="text-sm text-slate-600">Evolução completa do sistema com atribuição de versões por recurso</p>
                  
                  <div className="space-y-6 mt-6">
                    
                    {/* Versão 5.0.0 - ATUAL */}
                    <div className="border-l-4 border-red-500 pl-4">
                      <h3 className="text-xl font-bold text-red-600">v5.0.0 - "Safety & Accessibility Revolution" 🚦</h3>
                      <p className="text-sm text-slate-600">16 de Novembro de 2025</p>
                      <p className="mt-2 font-semibold">⭐ VERSÃO ATUAL - CRITICAL SAFETY UPDATE</p>
                      
                      <div className="mt-4 space-y-3">
                        <div>
                          <p className="font-bold">🚦 SISTEMA DE SEGURANÇA NO TRÂNSITO [v5.0.0]</p>
                          <p className="text-xs italic mb-2">Módulo crítico para navegação segura de pessoas cegas em ambientes urbanos</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li><strong>Endpoint Backend:</strong> POST /api/detect/traffic-safety</li>
                            <li><strong>Componente:</strong> TrafficSafety.jsx (520 linhas)</li>
                            <li><strong>Prompt IA:</strong> ~180 linhas especializadas em segurança viária</li>
                            <li><strong>Dois Modos Especializados:</strong>
                              <ul className="ml-6 mt-1">
                                <li>• Navegação: Alertas contínuos sobre veículos e obstáculos (análise a cada 2s)</li>
                                <li>• Atravessia: Verificação de segurança para travessia de rua (análise a cada 1.5s)</li>
                              </ul>
                            </li>
                            <li><strong>Detecção de Veículos com Distância:</strong>
                              <ul className="ml-6 mt-1">
                                <li>• Muito Próximo: 0-5m (PERIGO CRÍTICO)</li>
                                <li>• Próximo: 5-15m (ATENÇÃO MÁXIMA)</li>
                                <li>• Médio: 15-30m (CUIDADO)</li>
                                <li>• Longe: >30m (INFORMATIVO)</li>
                                <li>• Tipos identificados: carros, motos, ônibus, caminhões, bicicletas, patinetes</li>
                                <li>• Direção: esquerda, direita, frente</li>
                                <li>• Velocidade estimada: parado, lento, médio, rápido</li>
                              </ul>
                            </li>
                            <li><strong>Identificação de Sinais de Trânsito:</strong>
                              <ul className="ml-6 mt-1">
                                <li>• Semáforos: Estado (vermelho/amarelo/verde), tipo (pedestre/veículo)</li>
                                <li>• Placas: PARE, Dê a Preferência, Proibido, Velocidade, Direcionais</li>
                                <li>• Leitura de placas de rua completa</li>
                              </ul>
                            </li>
                            <li><strong>Detecção de Faixa de Pedestre:</strong> Tipo (zebrada/elevada/semaforizada), conservação, posição</li>
                            <li><strong>Sistema de Segurança para Atravessia:</strong>
                              <ul className="ml-6 mt-1">
                                <li>• Análise completa: veículos + semáforo + faixa</li>
                                <li>• Resposta definitiva: "PODE ATRAVESSAR" ✓ ou "NÃO ATRAVESSE" ✋</li>
                                <li>• Feedback visual grande e colorido</li>
                                <li>• Nunca ambíguo - sempre comando claro</li>
                              </ul>
                            </li>
                            <li><strong>Sistema de Alertas com 4 Níveis:</strong>
                              <ul className="ml-6 mt-1">
                                <li>• 🟢 SEGURO (verde)</li>
                                <li>• 🟡 CUIDADO (amarelo)</li>
                                <li>• 🟠 ATENÇÃO (laranja)</li>
                                <li>• 🔴 PERIGO CRÍTICO (vermelho)</li>
                                <li>• Alertas sonoros automáticos para perigos críticos</li>
                                <li>• Sons diferentes por nível de perigo</li>
                              </ul>
                            </li>
                            <li><strong>Interface:</strong>
                              <ul className="ml-6 mt-1">
                                <li>• Indicador de perigo no topo (cor + ícone + texto)</li>
                                <li>• Visualização de estado do semáforo (círculo animado)</li>
                                <li>• Cards informativos: veículos, sinais, faixa</li>
                                <li>• Histórico de alertas (últimos 10)</li>
                                <li>• Botões grandes para alternar modo</li>
                              </ul>
                            </li>
                            <li><strong>Análise Ambiental:</strong> Tipo de via, obstáculos na calçada, movimento do trânsito, elementos de segurança</li>
                            <li><strong>Base Científica:</strong> Princípios de segurança viária da OMS + normas ABNT NBR 9050</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Versão 4.5.0 */}
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h3 className="text-xl font-bold text-purple-600">v4.5.0 - "Braille Master" ⠃</h3>
                      <p className="text-sm text-slate-600">15 de Novembro de 2025</p>
                      
                      <div className="mt-4 space-y-3">
                        <div>
                          <p className="font-bold">⠃ LEITOR ESPECIALIZADO DE BRAILLE [v4.5.0]</p>
                          <p className="text-xs italic mb-2">Primeiro sistema de leitura de Braille via IA para pessoas cegas</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li><strong>Endpoint Backend:</strong> POST /api/detect/read-braille</li>
                            <li><strong>Componente:</strong> BrailleReader.jsx</li>
                            <li><strong>Prompt IA:</strong> ~150 linhas especializadas em Braille</li>
                            <li><strong>Suporte Completo:</strong>
                              <ul className="ml-6 mt-1">
                                <li>• Braille Grade 1 (literário/não contraído) - correspondência 1:1</li>
                                <li>• Braille Grade 2 (contraído/abreviado) - com contrações e sinais especiais</li>
                                <li>• Sistema Braille brasileiro conforme normas</li>
                              </ul>
                            </li>
                            <li><strong>Análise Célula por Célula:</strong>
                              <ul className="ml-6 mt-1">
                                <li>• Identificação dos 6 pontos por célula (pontos 1-6)</li>
                                <li>• Tradução considerando contexto</li>
                                <li>• Expansão de contrações Grade 2</li>
                                <li>• Detecção de indicadores especiais (maiúscula, números, ênfase)</li>
                              </ul>
                            </li>
                            <li><strong>Verificação de Qualidade:</strong>
                              <ul className="ml-6 mt-1">
                                <li>• Análise de iluminação e contraste</li>
                                <li>• Detecção de pontos bem definidos vs. borrados</li>
                                <li>• Verificação de espaçamento</li>
                                <li>• Recomendações para melhorar captura</li>
                              </ul>
                            </li>
                            <li><strong>Resposta JSON Estruturada:</strong>
                              <ul className="ml-6 mt-1">
                                <li>• braille_detected: true/false</li>
                                <li>• braille_grade: "Grade 1"/"Grade 2"/"Misto"</li>
                                <li>• image_quality: overall, contrast, clarity</li>
                                <li>• braille_text: representação dos pontos</li>
                                <li>• translated_text: texto traduzido completo em português</li>
                                <li>• detailed_translation: linha por linha, célula por célula</li>
                                <li>• contractions_used: lista de contrações encontradas</li>
                                <li>• confidence_score: 0.0-1.0</li>
                              </ul>
                            </li>
                            <li><strong>Interface Frontend:</strong>
                              <ul className="ml-6 mt-1">
                                <li>• Câmera alta resolução (1920x1080)</li>
                                <li>• Análise de qualidade em tempo real (brilho, contraste)</li>
                                <li>• Dois modos: Captura única ou contínua (3s)</li>
                                <li>• Histórico das últimas 10 leituras</li>
                                <li>• Compartilhamento: copiar, baixar .txt</li>
                                <li>• Narração TTS de todos os status</li>
                                <li>• Instruções de posicionamento atualizadas</li>
                              </ul>
                            </li>
                            <li><strong>Base Científica:</strong> Sistema Braille Louis Braille (1829) + Normas ABNT NBR 9050</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Versão 4.0.0 */}
                    <div className="border-l-4 border-indigo-500 pl-4">
                      <h3 className="text-xl font-bold text-indigo-600">v4.0.0 - "Smart Navigation" 🧭</h3>
                      <p className="text-sm text-slate-600">14 de Novembro de 2025</p>
                      
                      <div className="mt-4 space-y-3">
                        <div>
                          <p className="font-bold">🔍 BUSCA INTELIGENTE COM DISTÂNCIA E NAVEGAÇÃO [v4.0.0]</p>
                          <p className="text-xs italic mb-2">Sistema avançado de localização de objetos com guia de trajetória</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li><strong>Prompt IA Aprimorado:</strong> ~150 linhas com instruções detalhadas</li>
                            <li><strong>Estimativa de Distância em Metros:</strong>
                              <ul className="ml-6 mt-1">
                                <li>• Muito próximo: 0.5 a 1 metro (objeto >30% da imagem)</li>
                                <li>• Próximo: 1.5 a 3 metros (10-30% da imagem)</li>
                                <li>• Médio: 3 a 5 metros (5-10% da imagem)</li>
                                <li>• Longe: 5 a 8 metros (2-5% da imagem)</li>
                                <li>• Muito longe: >8 metros (<2% da imagem)</li>
                                <li>• Análise baseada em: tamanho aparente, detalhes visíveis, contexto espacial</li>
                              </ul>
                            </li>
                            <li><strong>Posicionamento Ultra-Preciso (Grid 7x3):</strong>
                              <ul className="ml-6 mt-1">
                                <li>• Horizontal: 7 zonas (Esquerda extrema, Esquerda, Centro-esquerda, Centro, Centro-direita, Direita, Direita extrema)</li>
                                <li>• Vertical: 3 zonas (Superior 0-33%, Meio 33-66%, Inferior 66-100%)</li>
                                <li>• Coordenadas em percentual</li>
                                <li>• Exemplo: "CENTRO-DIREITA (60% horizontal), MEIO (45% vertical)"</li>
                              </ul>
                            </li>
                            <li><strong>Instruções de Navegação e Trajetória:</strong>
                              <ul className="ml-6 mt-1">
                                <li>• Direção de giro em graus precisos</li>
                                <li>• Distância em metros e número de passos (1 passo ≈ 0.7m)</li>
                                <li>• Altura do objeto (chão, altura do peito, acima)</li>
                                <li>• Considerações de segurança sobre obstáculos</li>
                                <li>• Exemplo: "Vire 30 graus para a direita. Caminhe em linha reta por aproximadamente 2 metros (3 passos)"</li>
                              </ul>
                            </li>
                            <li><strong>Interface Aprimorada:</strong>
                              <ul className="ml-6 mt-1">
                                <li>• Painel de resultados detalhados com seções coloridas</li>
                                <li>• Seção de posição com ícone 📍</li>
                                <li>• Seção de distância em metros (destaque azul)</li>
                                <li>• Seção de navegação com comandos (destaque âmbar)</li>
                                <li>• Botão "Repetir Instruções" com TTS</li>
                                <li>• Botão "Nova Busca" para resetar</li>
                                <li>• Descrição completa expansível</li>
                              </ul>
                            </li>
                            <li><strong>Base Científica:</strong> Teoria de navegação espacial + Ciências Cognitivas</li>
                          </ul>
                        </div>
                      </div>
                    </div>


                    {/* Versão 3.5.0 */}
                    <div className="border-l-4 border-cyan-500 pl-4">
                      <h3 className="text-xl font-bold text-cyan-600">v3.5.0 - "Specialized Modes" 🎨</h3>
                      <p className="text-sm text-slate-600">10 de Novembro de 2025</p>
                      
                      <div className="mt-4 space-y-3">
                        <div>
                          <p className="font-bold">🪙 MODO IDENTIFICAÇÃO DE MOEDAS [v3.5.1]</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li>Detecção de moedas brasileiras (5¢, 10¢, 25¢, 50¢, R$1)</li>
                            <li>Identificação de cédulas (R$2, R$5, R$10, R$20, R$50, R$100, R$200)</li>
                            <li>Valor total calculado automaticamente</li>
                            <li>Estado de conservação avaliado</li>
                            <li>Autenticidade verificada (características de segurança)</li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-bold">🎨 MODO DETECÇÃO DE CORES [v3.5.2]</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li>Identificação de cores dominantes</li>
                            <li>Código RGB e Hexadecimal</li>
                            <li>Nome da cor em português</li>
                            <li>Paleta de cores presente</li>
                            <li>Tons e saturação descritos</li>
                            <li>Contraste e harmonia analisados</li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-bold">🤳 MODO SELFIE/PESSOAS [v3.5.3]</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li>Análise facial detalhada</li>
                            <li>Estimativa de idade</li>
                            <li>Expressão facial identificada</li>
                            <li>Características faciais descritas</li>
                            <li>Vestuário e acessórios</li>
                            <li>Fundo e contexto da foto</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    {/* Versão 3.0.0 */}
                    <div className="border-l-4 border-green-500 pl-4">
                      <h3 className="text-xl font-bold text-green-600">v3.0.0 - "Intelligence Revolution" 🚀</h3>
                      <p className="text-sm text-slate-600">25 de Outubro de 2025</p>
                      
                      <div className="mt-4 space-y-3">
                        <div>
                          <p className="font-bold">🗂️ SISTEMA DE CATEGORIZAÇÃO INTELIGENTE</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li>11 categorias automáticas com emojis visuais</li>
                            <li>Função auto_categorize_detection() com algoritmo de scoring</li>
                            <li>Keywords-based classification (100+ palavras-chave)</li>
                            <li>Categorias: Pessoas, Ambientes, Animais, Veículos, Eletrônicos, Roupas, Arte, Esportes, Compras, Documentos, Utensílios, Alimentos, Textos</li>
                            <li>Fallback inteligente para categoria "Outros"</li>
                            <li>Integração completa com MongoDB</li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-bold">🏷️ SISTEMA DE TAGS AUTOMÁTICAS</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li>Função generate_tags() com lógica avançada</li>
                            <li>Tags por tipo (nutrição, texto, análise-visual)</li>
                            <li>Tags por fonte (webcam, upload)</li>
                            <li>Tags dos Top 5 objetos detectados</li>
                            <li>Tags de emoções (sorrindo, triste, surpreso, etc)</li>
                            <li>Tags de sentimentos (positivo, negativo, neutro)</li>
                            <li>Tags de localização (cidade quando disponível)</li>
                            <li>Deduplicação automática</li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-bold">📍 GEOLOCALIZAÇÃO GPS COMPLETA</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li>Novo modelo GeoLocation (lat, long, accuracy, address, city, state, country, timestamp)</li>
                            <li>Função getCurrentLocation() com high accuracy</li>
                            <li>Timeout inteligente de 5 segundos</li>
                            <li>Captura automática antes de cada análise</li>
                            <li>Toast notification visual ("📍 Localização capturada")</li>
                            <li>Card verde destacado mostrando coordenadas</li>
                            <li>Precisão em metros exibida</li>
                            <li>Fallback gracioso se geolocalização falhar</li>
                            <li>Integrado em: WebcamDetection, UploadDetection, NutritionAnalysis</li>
                            <li>Salvo no MongoDB com cada detecção</li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-bold">📝 DESCRIÇÕES 200% MAIS DETALHADAS</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li>Prompt ultra-expandido com análise microscópica</li>
                            <li>Biometria facial milimétrica (medidas em mm e cm)</li>
                            <li>Análise dermatológica (Fitzpatrick, hex codes, poros 0.2mm)</li>
                            <li>Cabelos profissional (diâmetro fio 70 micrometros, densidade 150 fios/cm²)</li>
                            <li>Maquiagem cosmetic analysis detalhado</li>
                            <li>Vestuário fashion forensics (composição 100% algodão 180g/m², Pantone)</li>
                            <li>Análise anatômica precisa (ângulos em graus, proporções exatas)</li>
                            <li>Descrições mínimas de 300 palavras</li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-bold">🔍 FILTROS E BUSCA AVANÇADA</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li>Dropdown de filtro por categoria no Histórico</li>
                            <li>Busca por tags implementada</li>
                            <li>Contadores de detecções por categoria</li>
                            <li>Mensagens contextuais para filtros vazios</li>
                            <li>Botão "Limpar Filtro" quando ativo</li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-bold">🎨 MELHORIAS VISUAIS</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li>Badge de categoria com gradiente laranja no histórico</li>
                            <li>Tags azuis com contador "+X" para tags adicionais</li>
                            <li>Ícones emoji por tipo de detecção</li>
                            <li>Card verde para geolocalização capturada</li>
                            <li>Header reduzido em 40% (py-0.5, text-[9px])</li>
                            <li>Responsividade mobile otimizada</li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-bold">🛠️ MELHORIAS TÉCNICAS</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li>Fix f-string syntax error no backend</li>
                            <li>Correção do erro 401 mobile (getToken() helper)</li>
                            <li>Retry logic localStorage mobile (100ms wait)</li>
                            <li>Token validation antes de cada API call</li>
                            <li>Error handling aprimorado em todos endpoints</li>
                            <li>Timeout de 60s em chamadas IA</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Versão 2.5.0 */}
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h3 className="text-xl font-bold text-blue-600">v2.5.0 - "OCR & Nutrition Master" 📚</h3>
                      <p className="text-sm text-slate-600">20 de Outubro de 2025</p>
                      
                      <div className="mt-4 space-y-3">
                        <div>
                          <p className="font-bold">📚 MODO OCR PARA LEITURA DE TEXTOS</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li>Novo endpoint POST /api/detect/read-text</li>
                            <li>Prompt especializado para OCR ultra-detalhado</li>
                            <li>Extração completa palavra por palavra</li>
                            <li>Preservação de formatação e estrutura</li>
                            <li>Suporte para: livros, quadros, placas, documentos</li>
                            <li>Análise de tabelas, fórmulas, diagramas</li>
                            <li>Detecção de anotações manuscritas</li>
                            <li>Botões modo UI: 🔍 Normal | 📚 Ler Texto</li>
                            <li>Integrado em WebcamDetection e UploadDetection</li>
                            <li>detection_type = "text_reading"</li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-bold">🍽️ ANÁLISE NUTRICIONAL PhD</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li>Prompt em nível PhD com 100+ linhas</li>
                            <li>Macronutrientes detalhados (proteínas, carbos, gorduras, fibras)</li>
                            <li>Detalhamento de gorduras (saturada, mono, poli, trans)</li>
                            <li>Tipos de carboidratos (simples vs complexos)</li>
                            <li>Índice glicêmico e carga glicêmica</li>
                            <li>Micronutrientes (vitaminas A, C, D, E, K, B12, cálcio, ferro, magnésio, potássio, sódio)</li>
                            <li>Nutritional Quality Index (0-10)</li>
                            <li>Quality Score (0-100)</li>
                            <li>Recomendações de saúde personalizadas</li>
                            <li>Adequação DRI (% da ingestão diária recomendada)</li>
                            <li>Compatibilidade dietética (vegetariano, vegano, low-carb, keto, paleo, gluten-free, lactose-free, diabético)</li>
                            <li>Momento ideal de consumo</li>
                            <li>Componente AdvancedNutritionReport.jsx com 3D design</li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-bold">🎨 UI/UX IMPROVEMENTS</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li>Remoção de textos "Análise em Nuvem" e "Gemini Vision"</li>
                            <li>Modo fullscreen otimizado para captura</li>
                            <li>Header escondido durante fullscreen (mais área útil)</li>
                            <li>Floating controls em capture mode</li>
                            <li>isCaptureMode state management</li>
                            <li>Botões OCR mode claramente visíveis</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Versão 2.0.0 */}
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h3 className="text-xl font-bold text-purple-600">v2.0.0 - "Authentication & Security" 🔐</h3>
                      <p className="text-sm text-slate-600">15 de Outubro de 2025</p>
                      
                      <div className="mt-4 space-y-3">
                        <div>
                          <p className="font-bold">🔐 SISTEMA DE AUTENTICAÇÃO COMPLETO</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li>JWT (JSON Web Tokens) para autenticação stateless</li>
                            <li>Bcrypt para hash de senhas (rounds=10)</li>
                            <li>Endpoints: /api/auth/register, /api/auth/login, /api/auth/me</li>
                            <li>Admin hardcoded: aruanasistema@gmail.com</li>
                            <li>User types: "user" e "admin"</li>
                            <li>AuthContext React para gerenciamento de sessão</li>
                            <li>Token armazenado em localStorage</li>
                            <li>Retry logic para mobile (100ms wait)</li>
                            <li>Helper getToken() com fallback</li>
                            <li>Middleware require_auth e require_admin</li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-bold">👤 PERFIL DE USUÁRIO</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li>ProfilePage.jsx completo</li>
                            <li>Upload de foto de perfil (base64)</li>
                            <li>Campos: name, email, bio, phone, birth_date</li>
                            <li>PUT /api/auth/profile</li>
                            <li>Validação de dados</li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-bold">🔑 RECUPERAÇÃO DE SENHA</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li>POST /api/auth/forgot-password</li>
                            <li>POST /api/auth/reset-password</li>
                            <li>Token de reset com expiração (1 hora)</li>
                            <li>ForgotPasswordPage.jsx e ResetPasswordPage.jsx</li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-bold">📷 MELHORIAS DE PERMISSÃO DE CÂMERA</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li>Toast informativo ANTES de pedir permissão</li>
                            <li>Instruções detalhadas por erro (NotAllowedError, NotFoundError, NotReadableError)</li>
                            <li>Guia separado para mobile e desktop</li>
                            <li>Guia para Chrome e Firefox</li>
                            <li>Toast de 15 segundos para leitura</li>
                            <li>Retry automático com constraints simples</li>
                            <li>Mensagem de sucesso: "✅ Câmera iniciada com sucesso!"</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Versão 1.5.0 */}
                    <div className="border-l-4 border-orange-500 pl-4">
                      <h3 className="text-xl font-bold text-orange-600">v1.5.0 - "AI Power Upgrade" 🤖</h3>
                      <p className="text-sm text-slate-600">10 de Outubro de 2025</p>
                      
                      <div className="mt-4 space-y-3">
                        <div>
                          <p className="font-bold">🤖 INTEGRAÇÃO GEMINI 2.0 FLASH</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li>Migração de Gemini 1.5 Pro para 2.0 Flash</li>
                            <li>Velocidade 2x mais rápida</li>
                            <li>Menor latência</li>
                            <li>Mesma qualidade de análise</li>
                            <li>Custo reduzido</li>
                            <li>emergentintegrations library</li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-bold">🔄 RETRY LOGIC COM EXPONENTIAL BACKOFF</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li>Max 3 retries por chamada</li>
                            <li>Delay inicial: 2 segundos</li>
                            <li>Exponential backoff: 2s, 4s, 8s</li>
                            <li>Error handling para 503 (overloaded)</li>
                            <li>Error handling para rate limits</li>
                            <li>HTTPException 503 com mensagem clara</li>
                            <li>asyncio.sleep() para delays</li>
                            <li>Aplicado em: analyze-frame, analyze-nutrition, read-text</li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-bold">😊 ANÁLISE DE EMOÇÕES</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li>6 emoções: sorrindo, sério, triste, surpreso, zangado, neutro</li>
                            <li>Contadores por pessoa</li>
                            <li>EmotionAnalysis component</li>
                            <li>Integração com análise de sentimento</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Versão 1.0.0 */}
                    <div className="border-l-4 border-gray-500 pl-4">
                      <h3 className="text-xl font-bold text-gray-600">v1.0.0 - "Genesis" 🌱</h3>
                      <p className="text-sm text-slate-600">01 de Outubro de 2025</p>
                      
                      <div className="mt-4 space-y-3">
                        <div>
                          <p className="font-bold">🎉 LANÇAMENTO INICIAL</p>
                          <ul className="list-disc list-inside ml-4 text-xs">
                            <li>Stack: React + FastAPI + MongoDB</li>
                            <li>Google Vision API integrada</li>
                            <li>Gemini 1.5 Pro para análise</li>
                            <li>WebcamDetection básico</li>
                            <li>UploadDetection</li>
                            <li>DetectionHistory</li>
                            <li>Sistema de alertas</li>
                            <li>Text-to-Speech português</li>
                            <li>i18n (5 idiomas)</li>
                            <li>Modo alto contraste</li>
                            <li>Shadcn UI + Tailwind CSS</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {activeSection === "architecture" && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">🏗️ ARQUITETURA TÉCNICA COMPLETA</h2>
                  
                  <pre className="bg-slate-900 text-green-400 p-4 rounded text-[10px]">
{`┌─────────────────────────────────────────────────────────────────────┐
│                    ARQUITETURA ARUANÃ v5.0                          │
│            15 Módulos Especializados + IA Multi-Modelo              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐                                                   │
│  │   CLIENT    │ (Browser - React 18 + Vite)                       │
│  │  Frontend   │                                                   │
│  └──────┬──────┘                                                   │
│         │                                                           │
│         │ HTTPS + JWT Token                                        │
│         │                                                           │
│  ┌──────▼──────┐                                                   │
│  │   BACKEND   │ (FastAPI + Python 3.11)                          │
│  │   Server    │                                                   │
│  └──────┬──────┘                                                   │
│         │                                                           │
│         ├──────► MongoDB (Database)                                │
│         │                                                           │
│         ├──────► Google Vision API (Object Detection)             │
│         │                                                           │
│         ├──────► Gemini 2.0 Flash (AI Analysis)                   │
│         │                                                           │
│         └──────► Geolocation API (GPS)                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘`}
                  </pre>

                  <h3 className="text-lg font-bold mt-6">📦 TECNOLOGIAS E VERSÕES</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold">Frontend:</p>
                      <ul className="list-disc list-inside ml-4 text-xs">
                        <li>React 18.2.0</li>
                        <li>Vite 5.x (bundler)</li>
                        <li>Tailwind CSS 3.4.x</li>
                        <li>Shadcn UI (componentes)</li>
                        <li>i18next 23.x (internacionalização)</li>
                        <li>Axios 1.6.x (HTTP client)</li>
                        <li>Lucide React (ícones)</li>
                        <li>Sonner (toasts)</li>
                        <li>React Router DOM 6.x</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-bold">Backend:</p>
                      <ul className="list-disc list-inside ml-4 text-xs">
                        <li>Python 3.11</li>
                        <li>FastAPI 0.104.x</li>
                        <li>Motor 3.3.1 (MongoDB async)</li>
                        <li>PyMongo 4.5.0</li>
                        <li>Pydantic 2.x (validação)</li>
                        <li>PyJWT 2.8.x (autenticação)</li>
                        <li>Passlib 1.7.x (hashing)</li>
                        <li>emergentintegrations (Gemini)</li>
                        <li>google-cloud-vision (Google Vision)</li>
                      </ul>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold mt-6">🗄️ ESTRUTURA DE DADOS (MongoDB)</h3>
                  <pre className="bg-slate-900 text-yellow-400 p-4 rounded text-[10px]">
{`// Collection: detections
{
  "_id": "uuid-v4",
  "id": "uuid-v4",
  "timestamp": "2025-10-25T14:30:00.000Z",
  "source": "webcam" | "upload",
  "detection_type": "cloud" | "nutrition" | "text_reading",
  "user_id": "uuid-v4",
  "image_data": "data:image/jpeg;base64,...",
  "description": "Descrição ultra-detalhada em português...",
  "objects_detected": [
    {
      "label": "pessoa",
      "confidence": 0.95,
      "bbox": [x, y, w, h],
      "description": "Detalhes do objeto..."
    }
  ],
  "emotion_analysis": {
    "sorrindo": 2,
    "serio": 0,
    "triste": 0,
    "surpreso": 1,
    "zangado": 0,
    "neutro": 0
  },
  "sentiment_analysis": {
    "positivo": 2,
    "neutro": 0,
    "negativo": 1
  },
  "nutritional_analysis": {
    "foods_detected": [...],
    "total_calories": 450.5,
    "quality_score": 75,
    ...
  },
  "geo_location": {
    "latitude": -23.550520,
    "longitude": -46.633308,
    "accuracy": 12.5,
    "timestamp": "2025-10-25T14:30:00.000Z",
    "city": "São Paulo",
    "state": "SP",
    "country": "Brasil"
  },
  "category": "👥 Pessoas e Rostos",
  "tags": [
    "análise-visual",
    "fonte-webcam",
    "pessoa",
    "emoção-sorrindo",
    "sentimento-positivo",
    "local-sao-paulo"
  ],
  "alerts_triggered": []
}

// Collection: users
{
  "_id": "uuid-v4",
  "id": "uuid-v4",
  "name": "Ricardo Santos",
  "email": "ricardo@example.com",
  "password_hash": "$2b$10$...",
  "user_type": "user" | "admin",
  "created_at": "2025-10-01T10:00:00.000Z",
  "last_login": "2025-10-25T14:00:00.000Z",
  "is_active": true,
  "profile_photo": "data:image/jpeg;base64,...",
  "bio": "Biografia do usuário...",
  "phone": "+55 11 99999-9999",
  "birth_date": "1990-01-15",
  "reset_token": null,
  "reset_token_expiry": null
}

// Collection: alerts
{
  "_id": "uuid-v4",
  "id": "uuid-v4",
  "object_name": "pessoa",
  "enabled": true,
  "created_at": "2025-10-25T10:00:00.000Z"
}`}
                  </pre>
                </div>
              )}

              {activeSection === "features" && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">⚡ FUNCIONALIDADES IMPLEMENTADAS</h2>
                  
                  <div className="space-y-6">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h3 className="text-lg font-bold">1. DETECÇÃO EM TEMPO REAL (WebcamDetection)</h3>
                      <ul className="list-disc list-inside ml-4 text-xs space-y-1">
                        <li><strong>Câmera:</strong> getUserMedia API com constraints otimizadas</li>
                        <li><strong>Resolução:</strong> 1280x720 ideal, 1920x1080 max</li>
                        <li><strong>FacingMode:</strong> "environment" (câmera traseira mobile)</li>
                        <li><strong>FrameRate:</strong> 30fps ideal, 60fps max</li>
                        <li><strong>Captura:</strong> Canvas API para snapshot</li>
                        <li><strong>Formato:</strong> JPEG com qualidade 0.8</li>
                        <li><strong>Fullscreen:</strong> Modo otimizado com header escondido</li>
                        <li><strong>Preview:</strong> Visualização antes do envio</li>
                        <li><strong>Retry:</strong> Constraints simples se erro OverconstrainedError</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-green-500 pl-4">
                      <h3 className="text-lg font-bold">2. UPLOAD DE IMAGENS (UploadDetection)</h3>
                      <ul className="list-disc list-inside ml-4 text-xs space-y-1">
                        <li><strong>Formatos:</strong> JPEG, PNG, WEBP, HEIC</li>
                        <li><strong>Tamanho máximo:</strong> 10MB</li>
                        <li><strong>Preview:</strong> FileReader API base64</li>
                        <li><strong>Validação:</strong> Client-side antes upload</li>
                        <li><strong>Drag & Drop:</strong> Suportado</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-4">
                      <h3 className="text-lg font-bold">3. OCR - LEITURA DE TEXTOS</h3>
                      <ul className="list-disc list-inside ml-4 text-xs space-y-1">
                        <li><strong>Endpoint:</strong> POST /api/detect/read-text</li>
                        <li><strong>Tipos suportados:</strong> Livros, quadros, placas, documentos, recibos</li>
                        <li><strong>Extração:</strong> Palavra por palavra preservando formatação</li>
                        <li><strong>Estrutura:</strong> Títulos, seções, parágrafos, listas</li>
                        <li><strong>Elementos:</strong> Tabelas, fórmulas, diagramas, gráficos</li>
                        <li><strong>Manuscrito:</strong> Detecta anotações à mão</li>
                        <li><strong>Metadados:</strong> Página, autor, data quando visível</li>
                        <li><strong>Ordem:</strong> Recomenda ordem de leitura</li>
                        <li><strong>Qualidade:</strong> Indica legibilidade e problemas</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-orange-500 pl-4">
                      <h3 className="text-lg font-bold">4. ANÁLISE NUTRICIONAL PhD</h3>
                      <ul className="list-disc list-inside ml-4 text-xs space-y-1">
                        <li><strong>Endpoint:</strong> POST /api/detect/analyze-nutrition</li>
                        <li><strong>Nível:</strong> PhD em Nutrição Clínica</li>
                        <li><strong>Macronutrientes:</strong> Proteína, carboidrato, gordura, fibra (g)</li>
                        <li><strong>Gorduras detalhadas:</strong> Saturada, monoinsaturada, poliinsaturada, trans</li>
                        <li><strong>Carboidratos:</strong> Simples vs complexos</li>
                        <li><strong>Micronutrientes:</strong> Vitaminas (A, C, D, E, K, B12) e minerais (Ca, Fe, Mg, K, Na)</li>
                        <li><strong>Índices:</strong> Glicêmico (GI), Carga glicêmica (GL), Quality Score (0-100)</li>
                        <li><strong>Nutritional Quality Index:</strong> 0-10 escala</li>
                        <li><strong>DRI:</strong> % da ingestão diária recomendada</li>
                        <li><strong>Compatibilidade:</strong> 8 dietas (vegetariano, vegano, low-carb, keto, paleo, gluten-free, lactose-free, diabético)</li>
                        <li><strong>Recomendações:</strong> Saúde personalizada</li>
                        <li><strong>Alertas:</strong> Problemas nutricionais</li>
                        <li><strong>Timing:</strong> Melhor momento de consumo</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-red-500 pl-4">
                      <h3 className="text-lg font-bold">5. ANÁLISE DE EMOÇÕES E SENTIMENTOS</h3>
                      <ul className="list-disc list-inside ml-4 text-xs space-y-1">
                        <li><strong>Emoções (6):</strong> Sorrindo, sério, triste, surpreso, zangado, neutro</li>
                        <li><strong>Sentimentos (3):</strong> Positivo, neutro, negativo</li>
                        <li><strong>Contador:</strong> Número de pessoas por emoção</li>
                        <li><strong>Microexpressões:</strong> Detecta expressões sutis</li>
                        <li><strong>Linguagem corporal:</strong> Analisa postura</li>
                        <li><strong>Energia:</strong> Alto, médio, baixo</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-teal-500 pl-4">
                      <h3 className="text-lg font-bold">6. GEOLOCALIZAÇÃO GPS</h3>
                      <ul className="list-disc list-inside ml-4 text-xs space-y-1">
                        <li><strong>API:</strong> Geolocation API nativa</li>
                        <li><strong>High accuracy:</strong> enableHighAccuracy: true</li>
                        <li><strong>Timeout:</strong> 5000ms</li>
                        <li><strong>Dados:</strong> Latitude (6 decimais), longitude (6 decimais), accuracy (m), timestamp</li>
                        <li><strong>Captura:</strong> Automática antes de análise</li>
                        <li><strong>Notificação:</strong> Toast "📍 Localização capturada"</li>
                        <li><strong>Display:</strong> Card verde com coordenadas</li>
                        <li><strong>Fallback:</strong> Gracioso se negado ou indisponível</li>
                        <li><strong>Futuro:</strong> Reverse geocoding com Google Maps API</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-pink-500 pl-4">
                      <h3 className="text-lg font-bold">7. CATEGORIZAÇÃO INTELIGENTE</h3>
                      <ul className="list-disc list-inside ml-4 text-xs space-y-1">
                        <li><strong>Categorias (11):</strong> Pessoas, Ambientes, Animais, Veículos, Eletrônicos, Roupas, Arte, Esportes, Compras, Documentos, Utensílios</li>
                        <li><strong>Automáticas (2):</strong> Alimentos (nutrition), Textos (OCR)</li>
                        <li><strong>Fallback:</strong> "Outros"</li>
                        <li><strong>Algoritmo:</strong> Keyword scoring com 100+ palavras-chave</li>
                        <li><strong>Análise:</strong> Descrição + objetos detectados</li>
                        <li><strong>Prioridade:</strong> Tipo de detecção > conteúdo</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-indigo-500 pl-4">
                      <h3 className="text-lg font-bold">8. SISTEMA DE TAGS</h3>
                      <ul className="list-disc list-inside ml-4 text-xs space-y-1">
                        <li><strong>Automáticas:</strong> Geradas em cada detecção</li>
                        <li><strong>Tipos:</strong> Detecção, fonte, objetos (top 5), emoções, sentimentos, localização</li>
                        <li><strong>Deduplicação:</strong> Remove duplicatas</li>
                        <li><strong>Display:</strong> Até 3 tags + contador</li>
                        <li><strong>Busca:</strong> Facilita filtros e pesquisa</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h3 className="text-lg font-bold">9. HISTÓRICO E FILTROS</h3>
                      <ul className="list-disc list-inside ml-4 text-xs space-y-1">
                        <li><strong>Limite:</strong> 50 detecções mais recentes</li>
                        <li><strong>Filtro:</strong> Por categoria (dropdown)</li>
                        <li><strong>Busca:</strong> Por tags (futuro)</li>
                        <li><strong>Ordenação:</strong> Timestamp decrescente</li>
                        <li><strong>Detalhes:</strong> Modal com informações completas</li>
                        <li><strong>Exclusão:</strong> DELETE individual</li>
                        <li><strong>Exportação:</strong> JSON e CSV</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-cyan-500 pl-4">
                      <h3 className="text-lg font-bold">10. TEXT-TO-SPEECH (TTS)</h3>
                      <ul className="list-disc list-inside ml-4 text-xs space-y-1">
                        <li><strong>API:</strong> Web Speech API (SpeechSynthesis)</li>
                        <li><strong>Idiomas:</strong> Português (pt-BR), Inglês (en-US), Francês (fr-FR), Espanhol (es-ES), Chinês (zh-CN)</li>
                        <li><strong>Vozes:</strong> Masculina e Feminina por idioma</li>
                        <li><strong>Velocidade:</strong> 0.5x a 2.0x (ajustável)</li>
                        <li><strong>Auto-narração:</strong> Liga/desliga</li>
                        <li><strong>Narração:</strong> Descrições, alertas, UI</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-lime-500 pl-4">
                      <h3 className="text-lg font-bold">11. AUTENTICAÇÃO E SEGURANÇA</h3>
                      <ul className="list-disc list-inside ml-4 text-xs space-y-1">
                        <li><strong>JWT:</strong> HS256 algorithm</li>
                        <li><strong>Expiração:</strong> 7 dias</li>
                        <li><strong>Hash:</strong> Bcrypt rounds=10</li>
                        <li><strong>Admin:</strong> aruanasistema@gmail.com (hardcoded)</li>
                        <li><strong>Recuperação:</strong> Token 1 hora expiração</li>
                        <li><strong>Perfil:</strong> Upload foto, edição dados</li>
                        <li><strong>Middleware:</strong> require_auth, require_admin</li>
                      </ul>
                    </div>

                    <div className="border-l-4 border-gray-500 pl-4">
                      <h3 className="text-lg font-bold">12. INTERNACIONALIZAÇÃO (i18n)</h3>
                      <ul className="list-disc list-inside ml-4 text-xs space-y-1">
                        <li><strong>Biblioteca:</strong> i18next + react-i18next</li>
                        <li><strong>Idiomas (5):</strong> Português (pt), Inglês (en), Francês (fr), Espanhol (es), Chinês (zh)</li>
                        <li><strong>Padrão:</strong> Português Brasil (pt)</li>
                        <li><strong>Fallback:</strong> pt</li>
                        <li><strong>Persistência:</strong> localStorage</li>
                        <li><strong>TTS:</strong> Sincronizado com idioma selecionado</li>
                        <li><strong>Futuro:</strong> 31 idiomas planejados</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "ai" && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">🤖 INTELIGÊNCIA ARTIFICIAL</h2>
                  
                  <div className="space-y-6">
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h3 className="text-lg font-bold">GEMINI 2.0 FLASH</h3>
                      <p className="text-xs mt-2">
                        Modelo de última geração do Google para análise multimodal de alta velocidade.
                      </p>
                      
                      <h4 className="font-bold mt-4">Especificações Técnicas:</h4>
                      <ul className="list-disc list-inside ml-4 text-xs space-y-1">
                        <li><strong>Modelo:</strong> gemini-2.0-flash</li>
                        <li><strong>Tipo:</strong> Multimodal (texto + imagem)</li>
                        <li><strong>Contexto:</strong> 1M tokens</li>
                        <li><strong>Velocidade:</strong> 2x mais rápido que 1.5 Pro</li>
                        <li><strong>Latência:</strong> ~2-4 segundos</li>
                        <li><strong>Input:</strong> Text + ImageContent (base64)</li>
                        <li><strong>Output:</strong> JSON estruturado</li>
                        <li><strong>Rate Limit:</strong> 60 RPM</li>
                      </ul>

                      <h4 className="font-bold mt-4">Integração:</h4>
                      <pre className="bg-slate-900 text-green-400 p-4 rounded text-[10px] mt-2">
{`from emergentintegrations import LlmChat
from emergentintegrations.models import ImageContent, UserMessage

chat = LlmChat(
    api_key=GOOGLE_API_KEY,
    session_id=f"detection_{uuid.uuid4()}",
    system_message="Especialista em visão computacional..."
).with_model("gemini", "gemini-2.0-flash")

response = await chat.send_message(
    UserMessage(
        text=prompt,
        file_contents=[ImageContent(image_base64=image_data)]
    )
)`}
                      </pre>

                      <h4 className="font-bold mt-4">Retry Logic:</h4>
                      <pre className="bg-slate-900 text-yellow-400 p-4 rounded text-[10px] mt-2">
{`max_retries = 3
retry_delay = 2  # seconds

for attempt in range(max_retries):
    try:
        response = await chat.send_message(...)
        break  # Success
    except Exception as e:
        if '503' in str(e) or 'overloaded' in str(e):
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
                continue
            else:
                raise HTTPException(503, "IA temporariamente sobrecarregada")
        else:
            raise  # Other errors`}
                      </pre>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                      <h3 className="text-lg font-bold">GOOGLE VISION API</h3>
                      <p className="text-xs mt-2">
                        API de detecção de objetos e análise de imagem do Google Cloud.
                      </p>
                      
                      <h4 className="font-bold mt-4">Recursos Utilizados:</h4>
                      <ul className="list-disc list-inside ml-4 text-xs space-y-1">
                        <li><strong>Label Detection:</strong> Identifica objetos gerais</li>
                        <li><strong>Face Detection:</strong> Detecta rostos e emoções básicas</li>
                        <li><strong>Text Detection:</strong> OCR básico (complementa Gemini)</li>
                        <li><strong>Object Localization:</strong> Bounding boxes</li>
                        <li><strong>Image Properties:</strong> Cores dominantes</li>
                      </ul>

                      <h4 className="font-bold mt-4">Complementariedade:</h4>
                      <p className="text-xs mt-2">
                        Google Vision faz detecção rápida inicial, Gemini 2.0 Flash
                        faz análise profunda e contextual. Pipeline híbrido para
                        máxima precisão e velocidade.
                      </p>
                    </div>

                    <div className="border-l-4 border-green-500 pl-4">
                      <h3 className="text-lg font-bold">PROMPT ENGINEERING</h3>
                      
                      <h4 className="font-bold mt-4">Estrutura dos Prompts:</h4>
                      <ul className="list-disc list-inside ml-4 text-xs space-y-1">
                        <li><strong>Idioma:</strong> Forçado português brasileiro (🇧🇷)</li>
                        <li><strong>Persona:</strong> Especialista em visão computacional</li>
                        <li><strong>Objetivo:</strong> Acessibilidade para cegos</li>
                        <li><strong>Nível de detalhe:</strong> Máximo absoluto (200%)</li>
                        <li><strong>Estrutura:</strong> JSON estruturado</li>
                        <li><strong>Validação:</strong> Schema Pydantic</li>
                        <li><strong>Fallback:</strong> Raw text se JSON parsing falhar</li>
                      </ul>

                      <h4 className="font-bold mt-4">Tipos de Prompts:</h4>
                      <pre className="bg-slate-900 text-cyan-400 p-4 rounded text-[10px] mt-2">
{`1. DETECÇÃO GERAL (analyze-frame):
   - Pessoas: biometria, anatomia, vestuário, emoções
   - Objetos: identificação, materiais, cores, texturas
   - Ambiente: tipo, dimensões, iluminação, atmosfera
   - Contexto: narrativa, relações, temporalidade
   - Acessibilidade: obstáculos, pontos referência

2. NUTRIÇÃO PhD (analyze-nutrition):
   - Identificação de alimentos
   - Análise bioquímica nutricional
   - Macros e micros detalhados
   - Índices glicêmicos e qualidade
   - Recomendações personalizadas

3. OCR (read-text):
   - Extração completa de texto
   - Preservação de estrutura
   - Análise de elementos visuais
   - Metadata do documento
   - Ordem de leitura recomendada`}
                      </pre>

                      <h4 className="font-bold mt-4">Exemplo - Descrição Ultra-Detalhada:</h4>
                      <pre className="bg-slate-900 text-white p-4 rounded text-[10px] mt-2">
{`Prompt incluí:
- Medidas precisas (mm, cm, metros)
- Ângulos em graus (15°, 110°)
- Proporções exatas (1.4:1, 85:100)
- Hex codes (#C8997F)
- Fitzpatrick skin types (I-VI)
- Diâmetros microscópicos (70 micrômetros)
- Densidades (150 fios/cm²)
- Texturas tipo André Walker (2A, 3B, 4C)
- Composições químicas (100% algodão 180g/m²)
- Índices nutricionais (GI, GL, NQI)

Resultado: Descrições de 300+ palavras
com precisão científica`}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "api" && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">📡 DOCUMENTAÇÃO DE APIs</h2>
                  
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold">BASE URL</h3>
                    <pre className="bg-slate-900 text-green-400 p-4 rounded text-xs">
{`Production: https://sight-helper-8.preview.emergentagent.com
API Base: /api`}
                    </pre>

                    <div className="border-l-4 border-blue-500 pl-4">
                      <h3 className="text-lg font-bold">AUTENTICAÇÃO</h3>
                      
                      <div className="mt-4">
                        <p className="font-bold text-sm">POST /api/auth/register</p>
                        <p className="text-xs">Registrar novo usuário</p>
                        <pre className="bg-slate-900 text-yellow-400 p-3 rounded text-[10px] mt-2">
{`Request:
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123",
  "user_type": "user"
}

Response (200):
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhb...",
  "token_type": "bearer",
  "user": {
    "id": "uuid-v4",
    "name": "João Silva",
    "email": "joao@example.com",
    "user_type": "user"
  }
}`}
                        </pre>
                      </div>

                      <div className="mt-4">
                        <p className="font-bold text-sm">POST /api/auth/login</p>
                        <p className="text-xs">Login de usuário</p>
                        <pre className="bg-slate-900 text-yellow-400 p-3 rounded text-[10px] mt-2">
{`Request:
{
  "email": "joao@example.com",
  "password": "senha123"
}

Response (200):
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhb...",
  "token_type": "bearer",
  "user": {...}
}`}
                        </pre>
                      </div>

                      <div className="mt-4">
                        <p className="font-bold text-sm">GET /api/auth/me</p>
                        <p className="text-xs">Obter dados do usuário autenticado</p>
                        <pre className="bg-slate-900 text-yellow-400 p-3 rounded text-[10px] mt-2">
{`Headers:
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhb...

Response (200):
{
  "id": "uuid-v4",
  "name": "João Silva",
  "email": "joao@example.com",
  "user_type": "user",
  ...
}`}
                        </pre>
                      </div>
                    </div>

                    <div className="border-l-4 border-green-500 pl-4">
                      <h3 className="text-lg font-bold">DETECÇÃO</h3>
                      
                      <div className="mt-4">
                        <p className="font-bold text-sm">POST /api/detect/analyze-frame</p>
                        <p className="text-xs">Análise geral de imagem com IA</p>
                        <pre className="bg-slate-900 text-green-400 p-3 rounded text-[10px] mt-2">
{`Headers:
Authorization: Bearer token...
Content-Type: application/json

Request:
{
  "source": "webcam" | "upload",
  "detection_type": "cloud",
  "image_data": "data:image/jpeg;base64,...",
  "geo_location": {
    "latitude": -23.550520,
    "longitude": -46.633308,
    "accuracy": 12.5,
    "timestamp": "2025-10-25T14:30:00.000Z"
  }
}

Response (200):
{
  "id": "uuid-v4",
  "timestamp": "2025-10-25T14:30:00.000Z",
  "description": "Descrição ultra-detalhada...",
  "objects_detected": [...],
  "emotion_analysis": {...},
  "sentiment_analysis": {...},
  "geo_location": {...},
  "category": "👥 Pessoas e Rostos",
  "tags": ["análise-visual", "pessoa", ...],
  ...
}`}
                        </pre>
                      </div>

                      <div className="mt-4">
                        <p className="font-bold text-sm">POST /api/detect/analyze-nutrition</p>
                        <p className="text-xs">Análise nutricional PhD de alimentos</p>
                        <pre className="bg-slate-900 text-orange-400 p-3 rounded text-[10px] mt-2">
{`Request:
{
  "source": "camera" | "upload",
  "detection_type": "nutrition",
  "image_data": "data:image/jpeg;base64,...",
  "geo_location": {...}
}

Response (200):
{
  ...
  "nutritional_analysis": {
    "foods_detected": [
      {
        "name": "Arroz integral",
        "calories_per_100g": 112,
        "estimated_portion_grams": 150,
        "total_calories": 168,
        "macronutrients": {
          "protein": 3.5,
          "carbohydrates": 23.5,
          "fat": 0.9,
          "fiber": 1.8
        },
        "glycemic_index": 50,
        ...
      }
    ],
    "total_calories": 450.5,
    "quality_score": 75,
    "nutritional_balance": {
      "protein_percent": 20,
      "carbs_percent": 50,
      "fat_percent": 30
    },
    "health_recommendations": [...],
    "dietary_compatibility": {
      "vegetarian": true,
      "vegan": false,
      "low_carb": false,
      ...
    },
    ...
  },
  "category": "🍽️ Alimentos e Nutrição",
  ...
}`}
                        </pre>
                      </div>

                      <div className="mt-4">
                        <p className="font-bold text-sm">POST /api/detect/read-text</p>
                        <p className="text-xs">OCR especializado para leitura de textos</p>
                        <pre className="bg-slate-900 text-cyan-400 p-3 rounded text-[10px] mt-2">
{`Request:
{
  "source": "webcam" | "upload",
  "detection_type": "text_reading",
  "image_data": "data:image/jpeg;base64,...",
  "geo_location": {...}
}

Response (200):
{
  ...
  "description": "Análise completa do texto extraído...",
  "objects_detected": [
    {
      "label": "Texto Completo",
      "confidence": 0.95,
      "description": "Todo o texto extraído palavra por palavra..."
    }
  ],
  "category": "📚 Textos e Documentos",
  "tags": ["texto", "leitura", ...],
  ...
}`}
                        </pre>
                      </div>

                      <div className="mt-4">
                        <p className="font-bold text-sm">GET /api/detections?limit=50</p>
                        <p className="text-xs">Listar detecções do usuário</p>
                        <pre className="bg-slate-900 text-purple-400 p-3 rounded text-[10px] mt-2">
{`Headers:
Authorization: Bearer token...

Response (200):
[
  {
    "id": "uuid-v4",
    "timestamp": "...",
    "category": "👥 Pessoas e Rostos",
    "tags": [...],
    "geo_location": {...},
    ...
  },
  ...
]`}
                        </pre>
                      </div>

                      <div className="mt-4">
                        <p className="font-bold text-sm">DELETE /api/detections/{'{id}'}</p>
                        <p className="text-xs">Deletar detecção específica</p>
                        <pre className="bg-slate-900 text-red-400 p-3 rounded text-[10px] mt-2">
{`Headers:
Authorization: Bearer token...

Response (200):
{
  "message": "Detecção deletada"
}`}
                        </pre>
                      </div>
                    </div>

                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h3 className="text-lg font-bold">CÓDIGOS DE STATUS</h3>
                      <pre className="bg-slate-900 text-white p-3 rounded text-[10px] mt-2">
{`200 OK              - Sucesso
201 Created         - Recurso criado
400 Bad Request     - Dados inválidos
401 Unauthorized    - Token ausente ou inválido
403 Forbidden       - Sem permissão (admin only)
404 Not Found       - Recurso não encontrado
500 Internal Error  - Erro no servidor
503 Service Unavail - IA temporariamente sobrecarregada`}
                      </pre>
                    </div>

                    <div className="border-l-4 border-red-500 pl-4">
                      <h3 className="text-lg font-bold">RATE LIMITS</h3>
                      <ul className="list-disc list-inside ml-4 text-xs space-y-1">
                        <li><strong>Gemini API:</strong> 60 requisições por minuto</li>
                        <li><strong>Google Vision:</strong> 1800 requisições por minuto</li>
                        <li><strong>Backend:</strong> Sem limite (controlado por IA)</li>
                        <li><strong>Retry:</strong> 3 tentativas com exponential backoff</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Adicionar outras seções aqui... */}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicalDocumentUpdated;
