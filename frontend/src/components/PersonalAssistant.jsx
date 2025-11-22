import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Volume2, Heart, MessageCircle, Loader2, Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/context/SettingsContext";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PersonalAssistant = ({ onBack, isActive }) => {
  const { settings } = useSettings();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "assistant",
      text: "Olá! Sou seu assistente pessoal e estou aqui para apoiar você. Como posso ajudar hoje? Pode me contar sobre seus desafios, dúvidas ou apenas conversar.",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Automatic screen entry narration
  useEffect(() => {
    if (isActive) {
      const entryMessage = "Assistente Pessoal Ajuda ativado. Estou aqui para apoiar você emocionalmente e praticamente. Pode digitar sua mensagem ou usar o botão de microfone para falar. Como posso ajudar?";
      setTimeout(() => {
        announceStatus(entryMessage);
      }, 500);
    }
  }, [isActive]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error("Erro ao reconhecer voz. Tente novamente.");
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        announceStatus("Ouvindo... Pode falar agora.");
      } catch (error) {
        console.error('Error starting recognition:', error);
        toast.error("Erro ao ativar microfone.");
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const announceStatus = (message) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const readMessage = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API}/chat/personal-assistant`,
        {
          message: inputMessage,
          conversation_history: messages.slice(-10) // Last 10 messages for context
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const assistantMessage = {
        id: Date.now() + 1,
        type: "assistant",
        text: response.data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Read response automatically
      setTimeout(() => {
        readMessage(response.data.response);
      }, 500);

    } catch (error) {
      console.error("Assistant error:", error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: "assistant",
        text: "Desculpe, tive um problema para processar sua mensagem. Pode tentar novamente?",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error("Erro ao processar mensagem");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([
      {
        id: 1,
        type: "assistant",
        text: "Conversa reiniciada. Como posso ajudar você agora?",
        timestamp: new Date()
      }
    ]);
    announceStatus("Conversa reiniciada.");
    toast.success("Conversa reiniciada");
  };

  return (
    <div className={`min-h-screen flex flex-col ${settings.highContrast ? 'bg-black' : 'bg-slate-900'}`}>
      {/* Header */}
      <div className={`p-4 flex items-center justify-between ${
        settings.highContrast ? 'bg-gray-900 border-b-2 border-white' : 'bg-gradient-to-r from-pink-950/80 to-purple-950/80 backdrop-blur-xl border-b border-pink-500/30'
      }`}>
        <Button
          onClick={onBack}
          variant="ghost"
          size="lg"
          className="text-white"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-6 h-6 mr-2" />
          Voltar
        </Button>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Heart className="w-6 h-6 text-pink-400" />
          Ajuda
        </h2>
        <Button
          onClick={clearConversation}
          variant="ghost"
          size="sm"
          className="text-white"
          aria-label="Limpar conversa"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${
                message.type === 'user'
                  ? settings.highContrast
                    ? 'bg-white text-black'
                    : 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                  : settings.highContrast
                    ? 'bg-gray-800 text-white border-2 border-white'
                    : 'bg-gradient-to-br from-pink-900/50 to-purple-900/50 backdrop-blur-xl border border-pink-500/30 text-white'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.type === 'assistant' && (
                  <Heart className="w-5 h-5 text-pink-400 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.text}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {message.type === 'assistant' && (
                      <button
                        onClick={() => readMessage(message.text)}
                        className="ml-auto p-1 rounded hover:bg-white/20 transition-colors"
                        aria-label="Ler mensagem"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className={`p-4 rounded-2xl ${
              settings.highContrast
                ? 'bg-gray-800 text-white border-2 border-white'
                : 'bg-gradient-to-br from-pink-900/50 to-purple-900/50 backdrop-blur-xl border border-pink-500/30 text-white'
            }`}>
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-pink-400" />
                <p className="text-sm">Pensando...</p>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`p-4 ${
        settings.highContrast ? 'bg-gray-900 border-t-2 border-white' : 'bg-slate-950/50 backdrop-blur-xl border-t border-white/10'
      }`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Button
              onClick={isListening ? stopListening : startListening}
              size="lg"
              className={`${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
              aria-label={isListening ? "Parar de ouvir" : "Ativar voz"}
            >
              <Mic className="w-6 h-6" />
            </Button>
            
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className={`flex-1 text-lg ${
                settings.highContrast
                  ? 'bg-white text-black border-2 border-white'
                  : 'bg-slate-800 text-white border-white/20'
              }`}
              disabled={isLoading}
              aria-label="Campo de mensagem"
            />
            
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="lg"
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
              aria-label="Enviar mensagem"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Send className="w-6 h-6" />
              )}
            </Button>
          </div>
          
          <p className="text-xs text-center mt-3 text-white/60">
            Pressione Enter para enviar • Use o microfone para falar • As respostas são lidas automaticamente
          </p>
        </div>
      </div>
    </div>
  );
};

export default PersonalAssistant;
