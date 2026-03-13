import { DocCard, Step } from "./shared";
import { BookMarked } from "lucide-react";

export function DocPops() {
  return (
    <div>
      <h1 className="font-mono text-base font-bold tracking-wider mb-4">6. Procedimentos Operacionais Padrão (POPs)</h1>

      <DocCard icon={BookMarked} title="POP 1: Início do Dia">
        <Step n={1} title="Abra o aplicativo" desc="Acesse pelo navegador ou PWA instalado" />
        <Step n={2} title="Selecione o Estado de Energia" desc="Foco Total, Modo Leve ou Básico" />
        <Step n={3} title="Revise as tarefas" desc="Veja o Kanban com as tarefas filtradas para o dia" />
        <Step n={4} title="Verifique eventos" desc="Confira os compromissos do calendário" />
        <Step n={5} title="Se segunda-feira" desc="Complete a Revisão de Metas primeiro" />
        <Step n={6} title="Se sexta-feira" desc="Reserve tempo para o Relatório Semanal" />
      </DocCard>

      <DocCard icon={BookMarked} title="POP 2: Adicionar uma Tarefa">
        <Step n={1} title="Use o Quick Capture" desc='Campo de texto na parte superior da tela' />
        <Step n={2} title="Digite em linguagem natural" desc='Ex: "Enviar proposta para cliente X até sexta"' />
        <Step n={3} title="IA classifica automaticamente" desc="Módulo, tipo, urgência, impacto e estado ideal" />
        <Step n={4} title="Revise e ajuste" desc="Corrija a classificação se necessário" />
        <Step n={5} title="Tarefa no Kanban" desc="Aparece na coluna apropriada automaticamente" />
      </DocCard>

      <DocCard icon={BookMarked} title="POP 3: Check-in Emocional">
        <Step n={1} title="Quando sugerido (a cada 3h)" desc="Pare e reflita sobre seu estado atual" />
        <Step n={2} title="Selecione seu humor" desc="Escala de 1 (Muito mal) a 5 (Ótimo)" />
        <Step n={3} title="Adicione uma nota (opcional)" desc="Texto livre para dar contexto" />
        <Step n={4} title="Ajuste automático" desc="O app ajusta tarefas visíveis baseado no humor" />
      </DocCard>

      <DocCard icon={BookMarked} title="POP 4: Controle de Medicamentos">
        <Step n={1} title="Cadastre seus medicamentos" desc="Nome, dose, horários e estoque inicial" />
        <Step n={2} title="Receba notificações" desc="Push nos horários programados" />
        <Step n={3} title="Marque como tomado" desc="Abra o app e confirme a dose" />
        <Step n={4} title="Monitore o estoque" desc="O app alerta quando está baixo (< 7 unidades)" />
      </DocCard>

      <DocCard icon={BookMarked} title="POP 5: Revisão Semanal (Segunda-feira)">
        <Step n={1} title="Abra o app na segunda" desc="O painel de Revisão aparece automaticamente" />
        <Step n={2} title="Revise cada meta ativa" desc="Atualize percentual de progresso" />
        <Step n={3} title="Adicione nota de evolução" desc="O que mudou na semana anterior" />
        <Step n={4} title="Confirme a revisão" desc="Libera acesso completo ao app" />
      </DocCard>

      <DocCard icon={BookMarked} title="POP 6: Relatório Semanal (Sexta-feira)">
        <Step n={1} title="Abra o app na sexta" desc="Formulário aparece automaticamente" />
        <Step n={2} title="Liste destaques" desc="Conquistas e entregas da semana" />
        <Step n={3} title="Liste dificuldades" desc="Desafios enfrentados" />
        <Step n={4} title="Escreva reflexão" desc="Texto livre sobre a semana" />
        <Step n={5} title="Dê nota (1-10)" desc="Avaliação geral da semana" />
        <Step n={6} title="Envie o relatório" desc="Libera acesso completo" />
      </DocCard>

      <DocCard icon={BookMarked} title="POP 7: Tarefas de Casa">
        <Step n={1} title="Tarefas configuradas por cômodo" desc="Com frequência diária/semanal/quinzenal/mensal" />
        <Step n={2} title="Veja as tarefas devidas" desc="O app mostra o que é para hoje" />
        <Step n={3} title="Marque como feita" desc="Ao concluir cada tarefa" />
        <Step n={4} title="Reset automático às 8h" desc="Tarefas diárias resetam, sem acúmulo" />
      </DocCard>

      <DocCard icon={BookMarked} title="POP 8: Lançamentos Financeiros">
        <Step n={1} title="Acesse o módulo Financeiro" desc="Menu principal ou tab de contexto" />
        <Step n={2} title='Clique em "Novo Lançamento"' desc="Informe data, valor e descrição" />
        <Step n={3} title="Adicione tags" desc="Ex: Alimentação, Saúde" />
        <Step n={4} title="Saldo automático" desc="Calculado a partir dos lançamentos" />
        <Step n={5} title="Consolidação mensal" desc="Resumo automático disponível" />
      </DocCard>
    </div>
  );
}
