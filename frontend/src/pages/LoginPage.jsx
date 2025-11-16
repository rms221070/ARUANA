import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings } from '@/context/SettingsContext';
import { useTranslation } from 'react-i18next';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { settings, narrate } = useSettings();
  const { t } = useTranslation();

  useEffect(() => {
    // Check for OAuth token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const provider = urlParams.get('provider');
    const error = urlParams.get('error');

    if (error) {
      toast.error('Erro ao fazer login com ' + (provider || 'OAuth'));
      narrate('Erro ao fazer login social.');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (token) {
      // Store token and redirect
      localStorage.setItem('auth_token', token);
      toast.success(`Login realizado com sucesso via ${provider || 'OAuth'}!`);
      narrate(`Login realizado com sucesso via ${provider || 'OAuth'}. Bem-vindo ao sistema.`);
      // Clean URL and redirect
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate('/');
      return;
    }

    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate, narrate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        toast.success('Login realizado com sucesso!');
        narrate('Login realizado com sucesso! Bem-vindo ao sistema.');
        navigate('/');
      } else {
        toast.error(result.error || 'Falha no login');
        narrate('Erro ao fazer login. Verifique suas credenciais.');
      }
    } catch (error) {
      toast.error('Erro ao fazer login');
      narrate('Erro ao fazer login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute w-64 h-64 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-2xl mb-6 transform hover:scale-110 transition-transform duration-300" style={{
              boxShadow: '0 20px 60px -15px rgba(251, 146, 60, 0.5)'
            }}>
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2" style={{
              textShadow: '0 4px 20px rgba(255, 255, 255, 0.3)'
            }}>
              ARUANÃ
            </h1>
            <p className="text-blue-200 text-lg">Visão Assistiva</p>
            <p className="text-blue-300/70 text-sm mt-2">Faça login para continuar</p>
          </div>

          {/* Login Card with 3D effect */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 transform hover:scale-[1.02] transition-all duration-300" style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
          }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-white text-sm font-medium block">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
                  style={{
                    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)'
                  }}
                  onFocus={() => narrate('Campo de email')}
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-white text-sm font-medium block">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 pr-12"
                    style={{
                      boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)'
                    }}
                    onFocus={() => narrate('Campo de senha')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg transform hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 flex items-center justify-center"
                style={{
                  boxShadow: '0 10px 30px -5px rgba(251, 146, 60, 0.5)'
                }}
                onMouseEnter={() => narrate('Botão entrar')}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            {/* Social Login */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-white/70">Ou continue com</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    narrate('Login com Google');
                    window.location.href = `${process.env.REACT_APP_BACKEND_URL}/api/auth/google`;
                  }}
                  className="w-full py-3 px-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
                    <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
                    <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
                    <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/>
                  </svg>
                  Google
                </button>

                <button
                  type="button"
                  onClick={() => {
                    narrate('Login com Microsoft');
                    window.location.href = `${process.env.REACT_APP_BACKEND_URL}/api/auth/microsoft`;
                  }}
                  className="w-full py-3 px-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 23 23">
                    <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                    <path fill="#f35325" d="M1 1h10v10H1z"/>
                    <path fill="#81bc06" d="M12 1h10v10H12z"/>
                    <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                    <path fill="#ffba08" d="M12 12h10v10H12z"/>
                  </svg>
                  Microsoft
                </button>
              </div>
            </div>

            {/* Register Link */}
            <div className="mt-6 text-center space-y-3">
              <Link
                to="/forgot-password"
                className="text-blue-300 hover:text-white transition-colors text-sm block"
              >
                Esqueceu sua senha?
              </Link>
              <p className="text-white/70 text-sm">
                Não tem uma conta?{' '}
                <Link
                  to="/register"
                  className="text-orange-400 hover:text-orange-300 font-semibold transition-colors"
                  onMouseEnter={() => narrate('Link para criar conta')}
                >
                  Criar conta
                </Link>
              </p>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-8 text-center text-white/50 text-sm">
            <p>Laboratório de Comunicação Celular (LCC)</p>
            <p className="mt-1">IOC/Fiocruz</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;