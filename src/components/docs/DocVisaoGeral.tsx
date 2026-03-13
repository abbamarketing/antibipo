import { DocCard, Step } from "./shared";
import { Eye, Smartphone, Heart, Briefcase, Home, DollarSign, Target, Calendar, Settings } from "lucide-react";

export function DocVisaoGeral() {
  return (
    <div>
      <h1 className="font-mono text-base font-bold tracking-wider mb-4">1. Visão Geral do Aplicativo</h1>

      <DocCard icon={Eye} title="Propósito">
        <p>O AntiBipolaridade é um sistema pessoal integrado que combina <strong>produtividade</strong>, <strong>saúde</strong>, <strong>bem-estar</strong> e <strong>finanças</strong> em uma única plataforma. Foi projetado especificamente para pessoas que vivem com transtorno bipolar ou que precisam de uma estrutura adaptativa que se ajuste ao seu estado emocional e energético ao longo do dia.</p>
      </DocCard>

      <DocCard icon={Eye} title="Problema que Resolve">
        <p>Pessoas com transtorno bipolar enfrentam oscilações significativas de energia, humor e capacidade de concentração. Aplicativos tradicionais de produtividade não consideram essas variações. O AntiBipolaridade resolve isso com:</p>
        <ul className="list-disc pl-4 space-y-1 mt-2">
          <li><strong>Revelação progressiva</strong> de tarefas baseada no humor e energia atual</li>
          <li><strong>Monitoramento contínuo</strong> de indicadores de saúde (humor, sono, medicamentos, exercícios)</li>
          <li><strong>IA adaptativa</strong> que aprende padrões e ajusta sugestões automaticamente</li>
          <li><strong>Estrutura sem rigidez</strong> — o sistema se adapta ao usuário, não o contrário</li>
        </ul>
      </DocCard>

      <DocCard icon={Eye} title="Público-Alvo">
        <ul className="list-disc pl-4 space-y-1">
          <li>Pessoas diagnosticadas com transtorno bipolar (tipo I ou II)</li>
          <li>Pessoas com TDAH ou outros transtornos que afetam produtividade</li>
          <li>Qualquer pessoa que precise de um sistema adaptativo de organização pessoal</li>
        </ul>
      </DocCard>

      <DocCard icon={Eye} title="Princípios de Design">
        <div className="space-y-2">
          {[
            { name: "Adaptatividade", desc: "O sistema se ajusta ao estado do usuário, não o contrário" },
            { name: "Não-julgamento", desc: "Dias de baixa energia são válidos; o app nunca penaliza" },
            { name: "Revelação Progressiva", desc: "Informações e tarefas aparecem gradualmente para evitar sobrecarga" },
            { name: "Memória Institucional", desc: "A IA mantém contexto de longo prazo sobre padrões do usuário" },
            { name: "Privacidade Absoluta", desc: "Dados de saúde mental nunca são compartilhados com terceiros" },
          ].map(p => (
            <div key={p.name} className="bg-secondary/50 rounded-md p-2">
              <p className="font-mono text-[10px] font-bold text-foreground">{p.name}</p>
              <p className="text-[10px] text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </DocCard>

      <DocCard icon={Eye} title="Módulos do Sistema">
        <p className="mb-2"><strong>5 módulos principais:</strong></p>
        <div className="space-y-1.5">
          {[
            { icon: Home, name: "Meu Dia (Home)", desc: "Painel central unificado com Kanban, dashboard e eventos" },
            { icon: Heart, name: "Saúde (Bem-Estar)", desc: "Medicamentos, humor, sono, exercícios, refeições, peso" },
            { icon: Briefcase, name: "Trabalho", desc: "Tarefas profissionais, clientes, Pomodoro, classificação IA" },
            { icon: Home, name: "Casa", desc: "Tarefas domésticas por cômodo, lista de compras" },
            { icon: DollarSign, name: "Financeiro", desc: "Lançamentos, tags, consolidação mensal, carteira digital" },
          ].map(m => (
            <div key={m.name} className="flex items-start gap-2 bg-secondary/50 rounded-md p-2">
              <m.icon className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-mono text-[10px] font-bold text-foreground">{m.name}</p>
                <p className="text-[10px] text-muted-foreground">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 mb-1"><strong>Módulos auxiliares:</strong></p>
        <div className="space-y-1.5">
          {[
            { icon: Target, name: "Metas Pessoais", desc: "Objetivos de curto, médio e longo prazo" },
            { icon: Calendar, name: "Calendário", desc: "Reuniões e eventos com lembretes" },
            { icon: Settings, name: "Configurações", desc: "Perfil, preferências, dados" },
          ].map(m => (
            <div key={m.name} className="flex items-start gap-2 bg-secondary/50 rounded-md p-2">
              <m.icon className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-mono text-[10px] font-bold text-foreground">{m.name}</p>
                <p className="text-[10px] text-muted-foreground">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </DocCard>

      <DocCard icon={Smartphone} title="Requisitos do Sistema">
        <p className="font-mono text-[10px] font-bold text-foreground mb-1">Navegadores Suportados</p>
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {[
            { name: "Chrome 90+", push: "Sim" },
            { name: "Firefox 88+", push: "Sim" },
            { name: "Safari 15+", push: "Sim (iOS 16.4+)" },
            { name: "Edge 90+", push: "Sim" },
          ].map(b => (
            <div key={b.name} className="bg-secondary/50 rounded-md p-1.5 text-[10px]">
              <span className="font-medium">{b.name}</span> <span className="text-muted-foreground">Push: {b.push}</span>
            </div>
          ))}
        </div>

        <p className="font-mono text-[10px] font-bold text-foreground mb-1">Dispositivos</p>
        <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
          <li><strong>Desktop:</strong> Qualquer computador com navegador moderno</li>
          <li><strong>Mobile:</strong> iPhone (iOS 15+), Android (Chrome 90+)</li>
          <li><strong>Tablet:</strong> iPad, tablets Android</li>
        </ul>

        <p className="font-mono text-[10px] font-bold text-foreground mt-3 mb-1">Instalação como PWA</p>
        <Step n={1} title="Abra o app" desc="Acesse pelo navegador do dispositivo" />
        <Step n={2} title="Chrome" desc='Menu (⋮) → "Adicionar à tela inicial"' />
        <Step n={3} title="Safari (iOS)" desc='Compartilhar (↑) → "Adicionar à Tela de Início"' />
        <Step n={4} title="Pronto" desc="O app aparecerá como ícone na tela inicial" />
      </DocCard>
    </div>
  );
}
