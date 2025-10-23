import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import "@/App.css";
import "@/i18n/config";
import { SettingsProvider } from "@/context/SettingsContext";
import { AuthProvider } from "@/context/AuthContext";
import Dashboard from "@/pages/Dashboard";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import { Toaster } from "sonner";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  useEffect(() => {
    // Set page title
    document.title = "ARUANÃ - Visão Assistiva";
  }, []);

  return (
    <SettingsProvider>
      <div className="App">
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
        <Toaster position="top-right" expand={true} richColors />
      </div>
    </SettingsProvider>
  );
}

export default App;