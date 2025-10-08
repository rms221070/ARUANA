import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import "@/App.css";
import "@/i18n/config";
import { SettingsProvider } from "@/context/SettingsContext";
import Dashboard from "@/pages/Dashboard";
import { Toaster } from "sonner";

function App() {
  useEffect(() => {
    // Set page title
    document.title = "ARUANÃ - Visão Assistiva";
  }, []);

  return (
    <SettingsProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" expand={true} richColors />
      </div>
    </SettingsProvider>
  );
}

export default App;