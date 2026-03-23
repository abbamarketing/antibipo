import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthGuard } from "@/components/AuthGuard";
import Index from "./pages/Index.tsx";
import AuthPage from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";

const ActivityLogPage = lazy(() => import("./pages/ActivityLog.tsx"));
const Financeiro = lazy(() => import("./pages/Financeiro.tsx"));
const Calendario = lazy(() => import("./pages/Calendario.tsx"));
const Configuracoes = lazy(() => import("./pages/Configuracoes.tsx"));
const Documentacao = lazy(() => import("./pages/Documentacao.tsx"));
const AgentsDashboard = lazy(() => import("./pages/AgentsDashboard.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={
          <div className="flex h-screen items-center justify-center text-muted-foreground text-sm">
            Carregando...
          </div>
        }>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
            <Route path="/log" element={<AuthGuard><ActivityLogPage /></AuthGuard>} />
            <Route path="/financeiro" element={<AuthGuard><Financeiro /></AuthGuard>} />
            <Route path="/calendario" element={<AuthGuard><Calendario /></AuthGuard>} />
            <Route path="/config" element={<AuthGuard><Configuracoes /></AuthGuard>} />
            <Route path="/docs" element={<AuthGuard><Documentacao /></AuthGuard>} />
            <Route path="/agentes" element={<AuthGuard><AgentsDashboard /></AuthGuard>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
