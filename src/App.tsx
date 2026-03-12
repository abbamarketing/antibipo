import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthGuard } from "@/components/AuthGuard";
import Index from "./pages/Index.tsx";
import ActivityLogPage from "./pages/ActivityLog.tsx";
import Financeiro from "./pages/Financeiro.tsx";
import Calendario from "./pages/Calendario.tsx";
import Configuracoes from "./pages/Configuracoes.tsx";
import Documentacao from "./pages/Documentacao.tsx";
import AuthPage from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";
import AjudaCRM from "./pages/AjudaCRM.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<AuthGuard><Index /></AuthGuard>} />
          <Route path="/log" element={<AuthGuard><ActivityLogPage /></AuthGuard>} />
          <Route path="/financeiro" element={<AuthGuard><Financeiro /></AuthGuard>} />
          <Route path="/calendario" element={<AuthGuard><Calendario /></AuthGuard>} />
          <Route path="/config" element={<AuthGuard><Configuracoes /></AuthGuard>} />
          <Route path="/docs" element={<AuthGuard><Documentacao /></AuthGuard>} />
          <Route path="/ajuda-crm" element={<AjudaCRM />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
