import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import "@/App.css";
import "@/i18n/config";
import { SettingsProvider } from "@/context/SettingsContext";
import { AuthProvider } from "@/context/AuthContext";
import Dashboard from "@/pages/Dashboard";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ProfilePage from "@/pages/ProfilePage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import SharedDetectionView from "@/pages/SharedDetectionView";
import { Toaster } from "sonner";

function App() {
  useEffect(() => {
    // Set page title
    document.title = "Aruanã – Sistema de IA para Inclusão e Acessibilidade | UNIG / IOC-FIOCRUZ";
  }, []);

  return (
    <SettingsProvider>
      <div className="App">
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/share/:shareToken" element={<SharedDetectionView />} />
              <Route path="/" element={<Dashboard />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
        <Toaster position="top-right" expand={true} richColors />
      </div>
    </SettingsProvider>
  );
}

export default App;