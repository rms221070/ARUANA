import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useSettings } from "@/context/SettingsContext";
import { BookOpen, Target, Lightbulb, FlaskConical, Users, Award } from "lucide-react";

const SystemManual = () => {
  const { settings } = useSettings();

  return (
    <div className="max-w-6xl mx-auto space-y-6" data-testid="system-manual">
      <Card className={`${
        settings.highContrast 
          ? 'bg-gray-900 border-white border-2' 
          : 'bg-gradient-to-br from-indigo-950/90 via-purple-950/90 to-slate-950/90 backdrop-blur-xl border-indigo-700/30 shadow-2xl'
      } animate-fade-in`}>
        <CardHeader>
          <CardTitle className={`text-2xl flex items-center gap-2 ${
            settings.highContrast ? 'text-white' : 'text-cyan-300'
          }`}>
            <BookOpen className="w-7 h-7" />
            Manual do Sistema ARUANÃ
          </CardTitle>
          <p className={`text-sm ${settings.highContrast ? 'text-gray-300' : 'text-gray-300'}`}>
            Guia completo sobre o projeto de pesquisa e uso do sistema
          </p>
        </CardHeader>
      </Card>

      <Accordion type="single" collapsible className="space-y-4">
        {/* Resumo do Projeto */}
        <AccordionItem value="item-1">
          <Card className={`${
            settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-indigo-950/90 backdrop-blur-xl border-indigo-700/30'
          }`}>
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${settings.highContrast ? 'bg-gray-800' : 'bg-cyan-900/50'}`}>
                  <BookOpen className={`w-5 h-5 ${settings.highContrast ? 'text-white' : 'text-cyan-400'}`} />
                </div>
                <span className={`text-lg font-semibold ${settings.highContrast ? 'text-white' : 'text-white'}`}>
                  1. Resumo do Projeto
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className={`${settings.highContrast ? 'text-gray-200' : 'text-gray-200'} space-y-4`}>
                <p className="leading-relaxed">
                  Este projeto de pesquisa tem como objetivo desenvolver e implementar o sistema de 
                  Inteligência Artificial com recursos de visão computacional <span className="font-bold text-cyan-400">"Aruanã"</span>, concebido 
                  para transformar informações multissensoriais em experiências interativas e 
                  enriquecedoras para usuários em diferentes contextos sociais e educacionais no que 
                  diz respeito a detecção e descrição de objetos e pessoas.
                </p>
                <p className="leading-relaxed">
                  Conduzido pelo <span className="font-semibold">Laboratório de Comunicação Celular (LCC)</span> do 
                  Instituto Oswaldo Cruz (IOC/Fiocruz), que atua desde 2004 na área de Biofísica Translacional, 
                  o projeto visa explorar o potencial da IA em promover inclusão, acessibilidade e novas 
                  formas de interação digital, com foco em pessoas com deficiência e voluntários profissionais de educação.
                </p>
                <div className={`p-4 rounded-lg ${settings.highContrast ? 'bg-gray-800' : 'bg-indigo-900/30'}`}>
                  <h4 className="font-semibold text-cyan-400 mb-2">Etapas Principais:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Revisão da literatura e desenvolvimento do protótipo inicial do sistema, integrando algoritmos de aprendizagem profundos com dispositivos sensoriais de última geração</li>
                    <li>Testes de validação em cenários reais, incluindo espaços culturais e dependências do laboratório de comunicação celular</li>
                    <li>Análise qualitativa e quantitativa dos dados encontrados, utilizando abordagens como análise de conteúdo e mapeamento de experiências</li>
                    <li>Refinamento do sistema, elaboração de relatórios e divulgação dos resultados em publicações científicas e eventos especializados</li>
                  </ol>
                </div>
                <p className="leading-relaxed">
                  A metodologia do projeto combina <span className="font-semibold text-purple-400">pesquisa-ação</span> com{" "}
                  <span className="font-semibold text-purple-400">design centrado no usuário</span>, buscando compreender 
                  como a IA pode ampliar percepções sensoriais e gerar resultados positivos na vida dos participantes.
                </p>
                <div className={`p-3 rounded-lg ${settings.highContrast ? 'bg-gray-800' : 'bg-cyan-900/20'} border ${settings.highContrast ? 'border-gray-600' : 'border-cyan-500/30'}`}>
                  <p className="text-sm font-semibold text-cyan-400 mb-1">Palavras-chave:</p>
                  <p className="text-sm">Inteligência Artificial Generativa, Aruanã, detecção, objetos, visão computacional</p>
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        {/* Justificativa */}
        <AccordionItem value="item-2">
          <Card className={`${
            settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-indigo-950/90 backdrop-blur-xl border-indigo-700/30'
          }`}>
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${settings.highContrast ? 'bg-gray-800' : 'bg-purple-900/50'}`}>
                  <Lightbulb className={`w-5 h-5 ${settings.highContrast ? 'text-white' : 'text-purple-400'}`} />
                </div>
                <span className={`text-lg font-semibold ${settings.highContrast ? 'text-white' : 'text-white'}`}>
                  2. Justificativa
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className={`${settings.highContrast ? 'text-gray-200' : 'text-gray-200'} space-y-4`}>
                <p className="leading-relaxed">
                  O projeto <span className="font-bold text-cyan-400">"Aruanã: inteligência artificial e visão computacional na 
                  construção de experiências interativas"</span> é relevante e justifica-se por uma série de 
                  fatores inclusivos, tecnológicos e sociais que destacam a necessidade de auxiliar 
                  usuários que precisam detectar e descrever objetos e pessoas, especialmente a 
                  Inteligência Artificial (IA) generativa, no uso de detecção.
                </p>
                
                <div className={`p-4 rounded-lg ${settings.highContrast ? 'bg-gray-800' : 'bg-purple-900/30'}`}>
                  <h4 className="font-semibold text-purple-400 mb-3">Demanda por Inovação no Monitoramento e Interação Multissensorial</h4>
                  <p className="leading-relaxed text-sm">
                    A necessidade de soluções tecnológicas que melhorem o monitoramento e a 
                    interação em ambientes diversos tem se tornado cada vez mais evidente. A detecção 
                    de objetos e seres, utilizando IA, possibilita experiências mais inclusivas e interativas, 
                    especialmente para pessoas com deficiência e em contextos educacionais.
                  </p>
                  <p className="leading-relaxed text-sm mt-3">
                    O projeto "Aruanã" justifica-se pela lacuna existente na integração de sistemas de IA que 
                    transformam dados sensoriais em informações acessíveis e enriquecedoras para 
                    diferentes públicos. Ao utilizar algoritmos avançados de detecção, o sistema visa 
                    atender à crescente demanda por ferramentas que promovam inclusão, engajamento 
                    e acessibilidade.
                  </p>
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        {/* Objetivos */}
        <AccordionItem value="item-3">
          <Card className={`${
            settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-indigo-950/90 backdrop-blur-xl border-indigo-700/30'
          }`}>
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${settings.highContrast ? 'bg-gray-800' : 'bg-green-900/50'}`}>
                  <Target className={`w-5 h-5 ${settings.highContrast ? 'text-white' : 'text-green-400'}`} />
                </div>
                <span className={`text-lg font-semibold ${settings.highContrast ? 'text-white' : 'text-white'}`}>
                  3. Objetivos
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className={`${settings.highContrast ? 'text-gray-200' : 'text-gray-200'} space-y-4`}>
                <div className={`p-4 rounded-lg ${settings.highContrast ? 'bg-gray-800' : 'bg-green-900/30'}`}>
                  <h4 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Objetivo Geral
                  </h4>
                  <p className="leading-relaxed text-sm">
                    Desenvolver e implementar o "Aruanã: inteligência artificial e visão computacional 
                    na construção de experiências interativas", que utiliza recursos avançados de 
                    detecção de objetos e seres para transformar informações multissensoriais em 
                    experiências interativas e inclusivas, promovendo acessibilidade, aprendizado e 
                    engajamento em contextos sociais, educacionais e culturais, com foco em pessoas 
                    com deficiência e comunidades em situação de vulnerabilidade.
                  </p>
                </div>

                <h4 className="font-semibold text-cyan-400 text-lg">Objetivos Específicos:</h4>
                
                <div className={`p-3 rounded-lg ${settings.highContrast ? 'bg-gray-800' : 'bg-cyan-900/20'} border-l-4 border-cyan-500`}>
                  <h5 className="font-semibold text-cyan-400 mb-2">Objetivo de Ensino</h5>
                  <p className="text-sm leading-relaxed">
                    Capacitar usuários, mediadores culturais e outros profissionais de educação para o uso 
                    do sistema "Aruanã", promovendo o desenvolvimento de práticas pedagógicas inclusivas 
                    e interativas que utilizam recursos de detecção de objetos e seres para ampliar a 
                    acessibilidade e o engajamento dos estudantes em contextos educacionais diversos.
                  </p>
                </div>

                <div className={`p-3 rounded-lg ${settings.highContrast ? 'bg-gray-800' : 'bg-purple-900/20'} border-l-4 border-purple-500`}>
                  <h5 className="font-semibold text-purple-400 mb-2">Objetivo de Pesquisa</h5>
                  <p className="text-sm leading-relaxed">
                    Investigar os impactos e desafios do uso de inteligência artificial generativa e sistemas 
                    de detecção de objetos e seres em diferentes contextos sociais e educacionais, avaliando 
                    sua eficácia, aplicabilidade e potencial para fomentar inclusão digital, acessibilidade 
                    e interação multissensorial, gerando conhecimentos que possam subsidiar futuros 
                    desenvolvimentos tecnológicos e estudos acadêmicos.
                  </p>
                </div>

                <div className={`p-3 rounded-lg ${settings.highContrast ? 'bg-gray-800' : 'bg-orange-900/20'} border-l-4 border-orange-500`}>
                  <h5 className="font-semibold text-orange-400 mb-2">Objetivo de Extensão</h5>
                  <p className="text-sm leading-relaxed">
                    Implementar o sistema "Aruanã" em comunidades vulneráveis, escolas e centros culturais, 
                    proporcionando formação prática, suporte técnico e recursos interativos que promovam 
                    a democratização do acesso à tecnologia, reduzam desigualdades tecnológicas e 
                    ampliem as oportunidades de inclusão e participação social.
                  </p>
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        {/* Hipóteses */}
        <AccordionItem value="item-4">
          <Card className={`${
            settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-indigo-950/90 backdrop-blur-xl border-indigo-700/30'
          }`}>
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${settings.highContrast ? 'bg-gray-800' : 'bg-blue-900/50'}`}>
                  <FlaskConical className={`w-5 h-5 ${settings.highContrast ? 'text-white' : 'text-blue-400'}`} />
                </div>
                <span className={`text-lg font-semibold ${settings.highContrast ? 'text-white' : 'text-white'}`}>
                  4. Hipóteses
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className={`${settings.highContrast ? 'text-gray-200' : 'text-gray-200'} space-y-4`}>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${settings.highContrast ? 'bg-gray-800' : 'bg-blue-900/30'}`}>
                    <h5 className="font-semibold text-blue-400 mb-2">Hipótese 1: Impacto na Inclusão Digital</h5>
                    <p className="text-sm leading-relaxed">
                      O uso do sistema "Aruanã: inteligência artificial e visão computacional na construção 
                      de experiências interativas" aumentará significativamente a inclusão digital e a 
                      acessibilidade em contextos sociais e educacionais, especialmente para pessoas com 
                      deficiência e comunidades vulneráveis.
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg ${settings.highContrast ? 'bg-gray-800' : 'bg-green-900/30'}`}>
                    <h5 className="font-semibold text-green-400 mb-2">Hipótese 2: Melhoria no Engajamento Social</h5>
                    <p className="text-sm leading-relaxed">
                      A integração do sistema "Aruanã" em práticas cotidianas e profissionais resultará 
                      em maior engajamento e compreensão dos usuários, ao promover experiências interativas 
                      e adaptativas que utilizam detecção de objetos e seres como recurso didático.
                    </p>
                  </div>

                  <div className={`p-4 rounded-lg ${settings.highContrast ? 'bg-gray-800' : 'bg-purple-900/30'}`}>
                    <h5 className="font-semibold text-purple-400 mb-2">Hipótese 3: Potencial para Democratização Tecnológica</h5>
                    <p className="text-sm leading-relaxed">
                      O uso da IA generativa permite maior engajamento e motivação dos participantes, 
                      incentivando-os a integrar tecnologias emergentes.
                    </p>
                  </div>

                  <p className={`text-sm italic ${settings.highContrast ? 'text-gray-400' : 'text-cyan-300'}`}>
                    Essas hipóteses guiam a pesquisa ao buscar evidências sobre os efeitos práticos e 
                    críticos da formação em IA generativa no projeto proposto.
                  </p>
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>

        {/* Metodologia */}
        <AccordionItem value="item-5">
          <Card className={`${
            settings.highContrast ? 'bg-gray-900 border-white border-2' : 'bg-indigo-950/90 backdrop-blur-xl border-indigo-700/30'
          }`}>
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${settings.highContrast ? 'bg-gray-800' : 'bg-pink-900/50'}`}>
                  <Users className={`w-5 h-5 ${settings.highContrast ? 'text-white' : 'text-pink-400'}`} />
                </div>
                <span className={`text-lg font-semibold ${settings.highContrast ? 'text-white' : 'text-white'}`}>
                  5. Metodologia
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <CardContent className={`${settings.highContrast ? 'text-gray-200' : 'text-gray-200'} space-y-4`}>
                <p className="leading-relaxed">
                  Este projeto utilizará uma <span className="font-semibold text-pink-400">abordagem qualitativa</span>, 
                  considerando que esta é eficaz para explorar as percepções, experiências e interpretações 
                  dos participantes sobre o uso do sistema de inteligência artificial "Aruanã", que emprega 
                  recursos de detecção de objetos e seres para promoção de inclusão, interatividade e acessibilidade.
                </p>

                <div className={`p-4 rounded-lg ${settings.highContrast ? 'bg-gray-800' : 'bg-pink-900/30'}`}>
                  <p className="text-sm leading-relaxed">
                    Segundo <span className="font-semibold">Denzin e Lincoln (2021)</span>, uma pesquisa qualitativa 
                    permite investigar questões sociais e tecnológicas de maneira contextualizada, capturando 
                    as nuances das interações humanas com a tecnologia e suas implicações em ambientes 
                    educacionais, sociais e culturais.
                  </p>
                </div>

                <p className="leading-relaxed">
                  A escolha pela metodologia qualitativa fundamenta-se na sua capacidade de examinar 
                  questões em ambientes reais, considerando as perspectivas dos participantes e os contextos 
                  nos quais estão inseridos.
                </p>

                <div className={`p-4 rounded-lg ${settings.highContrast ? 'bg-gray-800' : 'bg-indigo-900/30'}`}>
                  <p className="text-sm leading-relaxed mb-3">
                    <span className="font-semibold">Creswell e Poth (2023)</span> enfatizam que uma abordagem 
                    qualitativa é essencial para compreender como tecnologias emergentes, como a inteligência 
                    artificial, podem ser integradas em práticas sociais e educacionais de forma ética e eficaz.
                  </p>
                  <p className="text-sm leading-relaxed">
                    <span className="font-semibold">Flick (2020)</span> destaca que o envolvimento direto com 
                    os participantes, por meio de entrevistas e observações, facilita a coleta de informações 
                    ricas e contextualizadas, permitindo capturar a complexidade do impacto do sistema "Aruanã" 
                    em suas aplicações práticas.
                  </p>
                </div>
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default SystemManual;
