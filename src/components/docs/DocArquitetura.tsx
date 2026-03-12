import { DocCard } from "./shared";
import { Server, Cpu, Layers, Brain, Shield, Smartphone } from "lucide-react";

export function DocArquitetura() {
  return (
    <div>
      <h1 className="font-mono text-base font-bold tracking-wider mb-4">2. Arquitetura do Sistema</h1>

      <DocCard icon={Server} title="Visão Geral">
        <p>O sistema utiliza uma arquitetura de <strong>Índice Unificado</strong> onde o UnifiedKanban e um dashboard centralizado consolidam a visualização de tarefas e métricas de todos os módulos. Os módulos satélites atuam como provedores de contexto específico.</p>
        <div className="bg-secondary/50 rounded-md p-3 font-mono text-[8px] text-muted-foreground mt-2 whitespace-pre leading-relaxed">
{`┌────────────────── FRONTEND ──────────────────┐
│  React 18 + TypeScript + Vite + Tailwind     │
│                                               │
│  Index.tsx (Hub) ← Módulos Satélite           │
│       ↓                                       │
│  Stores (lib/*.ts) — Estado centralizado      │
│       ↓                                       │
│  Supabase Client (auto-generated)             │
└──────────────────┬────────────────────────────┘
                   │ HTTPS / WSS
┌──────────────────┴────────────────────────────┐
│               BACKEND (Cloud)                  │
│  PostgreSQL + RLS │ Edge Functions │ Auth      │
└───────────────────────────────────────────────┘`}
        </div>
      </DocCard>

      <DocCard icon={Cpu} title="Stack Frontend">
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { name: "React 18", desc: "UI com hooks e componentes funcionais" },
            { name: "TypeScript 5", desc: "Tipagem estática" },
            { name: "Vite 6", desc: "Build tool ultra-rápido" },
            { name: "Tailwind CSS 3", desc: "Estilos utility-first" },
            { name: "React Router 6", desc: "Navegação SPA protegida" },
            { name: "TanStack Query 5", desc: "Cache e estado de servidor" },
            { name: "Recharts 2", desc: "Gráficos e visualizações" },
            { name: "Lucide React", desc: "Ícones consistentes" },
            { name: "shadcn/ui", desc: "Componentes acessíveis" },
            { name: "Framer Motion", desc: "Animações fluidas" },
          ].map(t => (
            <div key={t.name} className="bg-secondary/50 rounded-md p-2">
              <p className="font-mono text-[10px] font-bold text-foreground">{t.name}</p>
              <p className="text-[9px] text-muted-foreground">{t.desc}</p>
            </div>
          ))}
        </div>
      </DocCard>

      <DocCard icon={Layers} title="Stack Backend (Lovable Cloud)">
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { name: "PostgreSQL", desc: "25+ tabelas relacionais" },
            { name: "Edge Functions", desc: "7 funções serverless (Deno)" },
            { name: "Row Level Security", desc: "Isolamento por usuário" },
            { name: "Realtime", desc: "Atualizações via WebSocket" },
            { name: "Auth", desc: "Email/senha + confirmação" },
            { name: "Storage", desc: "Armazenamento de arquivos" },
          ].map(t => (
            <div key={t.name} className="bg-secondary/50 rounded-md p-2">
              <p className="font-mono text-[10px] font-bold text-foreground">{t.name}</p>
              <p className="text-[9px] text-muted-foreground">{t.desc}</p>
            </div>
          ))}
        </div>
      </DocCard>

      <DocCard icon={Server} title="Edge Functions">
        <div className="space-y-1.5">
          {[
            { name: "analyze-day", desc: "Análise diária com IA: resumo e sugestões" },
            { name: "classify-task", desc: "Classificação automática de novas tarefas" },
            { name: "consolidate-logs", desc: "Consolida lotes de 100 logs em resumos" },
            { name: "daily-nudge", desc: "Gera nudges personalizados" },
            { name: "parse-command", desc: "Interpreta comandos de texto livre" },
            { name: "send-push", desc: "Envia notificações push" },
            { name: "vapid-public-key", desc: "Retorna chave pública VAPID" },
          ].map(f => (
            <div key={f.name} className="flex items-start gap-2 bg-secondary/50 rounded-md p-2">
              <code className="font-mono text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0">{f.name}</code>
              <p className="text-[10px] text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </DocCard>

      <DocCard icon={Brain} title="Inteligência Artificial">
        <p><strong>Modelo:</strong> Configurável via chave de API nas Configurações.</p>
        <p className="mt-1"><strong>Usos principais:</strong></p>
        <ul className="list-disc pl-4 space-y-0.5 mt-1">
          <li>Classificação automática de tarefas</li>
          <li>Análise diária com resumo e sugestões</li>
          <li>Nudges personalizados baseados no contexto</li>
          <li>Consolidação de logs em resumos de memória</li>
          <li>Geração de insights semanais</li>
        </ul>
        <p className="mt-2"><strong>Privacidade:</strong> Todos os dados processados em funções backend seguras. Nenhum dado compartilhado com terceiros.</p>
      </DocCard>

      <DocCard icon={Smartphone} title="PWA (Progressive Web App)">
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Instalável:</strong> Adicionável à tela inicial em iOS e Android</li>
          <li><strong>Offline:</strong> Dados em cache para visualização sem internet</li>
          <li><strong>Push:</strong> Notificações via Web Push API com service worker (sw-push.js)</li>
          <li><strong>Cache:</strong> Workbox com NetworkFirst para API e cache para assets</li>
        </ul>
      </DocCard>

      <DocCard icon={Shield} title="Segurança">
        <div className="space-y-1.5">
          {[
            { layer: "Autenticação", desc: "Login com email/senha + confirmação de email obrigatória" },
            { layer: "Autorização", desc: "Row Level Security (RLS) em todas as tabelas" },
            { layer: "Isolamento", desc: "Cada usuário só acessa seus próprios dados" },
            { layer: "Secrets", desc: "Chaves de API armazenadas no servidor, nunca expostas" },
            { layer: "HTTPS", desc: "Comunicação criptografada ponta a ponta" },
          ].map(s => (
            <div key={s.layer} className="bg-secondary/50 rounded-md p-2">
              <p className="font-mono text-[10px] font-bold text-foreground">{s.layer}</p>
              <p className="text-[10px] text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </DocCard>
    </div>
  );
}
