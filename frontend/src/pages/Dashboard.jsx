import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WebcamDetection from "@/components/WebcamDetection";
import UploadDetection from "@/components/UploadDetection";
import DetectionHistory from "@/components/DetectionHistory";
import AlertsManager from "@/components/AlertsManager";
import { Camera, Upload, History, Bell } from "lucide-react";

const Dashboard = () => {
  return (
    <div data-testid="dashboard-container" className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8" data-testid="dashboard-header">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-600 bg-clip-text text-transparent mb-3">
            Sistema de Detecção em Tempo Real
          </h1>
          <p className="text-base text-slate-600">
            Detecte pessoas, objetos e ambientes com IA avançada
          </p>
        </header>

        <Tabs defaultValue="webcam" className="w-full" data-testid="main-tabs">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8 bg-white/80 backdrop-blur-sm shadow-lg border border-slate-200">
            <TabsTrigger value="webcam" className="flex items-center gap-2" data-testid="webcam-tab">
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Webcam</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2" data-testid="upload-tab">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2" data-testid="history-tab">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2" data-testid="alerts-tab">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Alertas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="webcam" data-testid="webcam-content">
            <WebcamDetection />
          </TabsContent>

          <TabsContent value="upload" data-testid="upload-content">
            <UploadDetection />
          </TabsContent>

          <TabsContent value="history" data-testid="history-content">
            <DetectionHistory />
          </TabsContent>

          <TabsContent value="alerts" data-testid="alerts-content">
            <AlertsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;