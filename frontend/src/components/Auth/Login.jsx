import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Mail, Lock, User, Shield, Chrome } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/context/SettingsContext";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Login = ({ onLogin }) => {
  const { t } = useTranslation();
  const { settings, narrate } = useSettings();
  
  // Login states
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Register states
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "user" // "user" or "admin"
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API}/auth/login`, loginData);
      
      if (response.data.success) {
        const user = response.data.user;
        localStorage.setItem('aruanaUser', JSON.stringify(user));
        localStorage.setItem('aruanaToken', response.data.token);
        
        const welcomeMsg = `${t('auth.welcome')} ${user.name}! ${t('auth.loginSuccess')}`;
        toast.success(welcomeMsg);
        narrate(welcomeMsg);
        
        onLogin(user);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || t('auth.loginError');
      toast.error(errorMsg);
      narrate(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      const errorMsg = t('auth.passwordMismatch');
      toast.error(errorMsg);
      narrate(errorMsg);
      return;
    }
    
    if (registerData.password.length < 6) {
      const errorMsg = t('auth.passwordTooShort');
      toast.error(errorMsg);
      narrate(errorMsg);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API}/auth/register`, {
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        userType: registerData.userType
      });
      
      if (response.data.success) {
        const successMsg = t('auth.registerSuccess');
        toast.success(successMsg);
        narrate(successMsg + ' ' + t('auth.pleaseLogin'));
        
        // Clear form
        setRegisterData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          userType: "user"
        });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || t('auth.registerError');
      toast.error(errorMsg);
      narrate(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    narrate(t('auth.redirectingGoogle'));
    // Redirect to Google OAuth
    window.location.href = `${API}/auth/google`;
  };

  const handleMicrosoftLogin = () => {
    narrate(t('auth.redirectingMicrosoft'));
    // Redirect to Microsoft OAuth
    window.location.href = `${API}/auth/microsoft`;
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      settings.highContrast 
        ? 'bg-black' 
        : 'bg-gradient-to-br from-blue-950 via-indigo-900 to-purple-900'
    }`}>
      <Card className={`w-full max-w-md ${
        settings.highContrast 
          ? 'bg-gray-900 border-white border-2' 
          : 'bg-white/95 backdrop-blur-md border-indigo-200 shadow-2xl'
      }`}>
        <CardHeader>
          <CardTitle className={`text-center text-2xl font-bold ${
            settings.highContrast ? 'text-white' : 'text-gray-800'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="w-8 h-8 text-blue-600" />
              ARUANÃ - Acesso
            </div>
          </CardTitle>
          <p className={`text-center text-sm ${
            settings.highContrast ? 'text-gray-300' : 'text-gray-600'
          }`}>
            {t('auth.subtitle')}
          </p>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className={`grid w-full grid-cols-2 mb-6 ${
              settings.highContrast ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
              <TabsTrigger value="register">{t('auth.register')}</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className={settings.highContrast ? 'text-white' : 'text-gray-700'}>
                    {t('auth.email')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      className="pl-10"
                      placeholder={t('auth.emailPlaceholder')}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className={settings.highContrast ? 'text-white' : 'text-gray-700'}>
                    {t('auth.password')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      className="pl-10 pr-10"
                      placeholder={t('auth.passwordPlaceholder')}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={isLoading}
                >
                  {isLoading ? t('auth.loggingIn') : t('auth.loginButton')}
                </Button>
              </form>
              
              <div className="mt-6">
                <div className={`text-center text-sm mb-4 ${settings.highContrast ? 'text-gray-300' : 'text-gray-600'}`}>
                  {t('auth.orLoginWith')}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleGoogleLogin}
                    variant="outline"
                    className="w-full"
                  >
                    <Chrome className="w-4 h-4 mr-2 text-red-500" />
                    Google
                  </Button>
                  <Button
                    onClick={handleMicrosoftLogin}
                    variant="outline"
                    className="w-full"
                  >
                    <Shield className="w-4 h-4 mr-2 text-blue-500" />
                    Microsoft
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className={settings.highContrast ? 'text-white' : 'text-gray-700'}>
                    {t('auth.name')}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                      className="pl-10"
                      placeholder={t('auth.namePlaceholder')}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-email" className={settings.highContrast ? 'text-white' : 'text-gray-700'}>
                    {t('auth.email')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-email"
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      className="pl-10"
                      placeholder={t('auth.emailPlaceholder')}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className={settings.highContrast ? 'text-white' : 'text-gray-700'}>
                    {t('auth.userType')}
                  </Label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="userType"
                        value="user"
                        checked={registerData.userType === "user"}
                        onChange={(e) => setRegisterData({...registerData, userType: e.target.value})}
                        className="mr-2"
                      />
                      <span className={settings.highContrast ? 'text-white' : 'text-gray-700'}>
                        {t('auth.regularUser')}
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="userType"
                        value="admin"
                        checked={registerData.userType === "admin"}
                        onChange={(e) => setRegisterData({...registerData, userType: e.target.value})}
                        className="mr-2"
                      />
                      <span className={settings.highContrast ? 'text-white' : 'text-gray-700'}>
                        {t('auth.admin')}
                      </span>
                    </label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="register-password" className={settings.highContrast ? 'text-white' : 'text-gray-700'}>
                    {t('auth.password')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="register-password"
                      type={showRegisterPassword ? "text" : "password"}
                      value={registerData.password}
                      onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      className="pl-10 pr-10"
                      placeholder={t('auth.passwordPlaceholder')}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    >
                      {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className={settings.highContrast ? 'text-white' : 'text-gray-700'}>
                    {t('auth.confirmPassword')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirm-password"
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                      className="pl-10"
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      required
                    />
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  disabled={isLoading}
                >
                  {isLoading ? t('auth.registering') : t('auth.registerButton')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;