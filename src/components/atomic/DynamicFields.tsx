import { DropdownField } from "./DropdownField";
import { ClientFieldEnhanced } from "./ClientFieldEnhanced";
import {
  type TemplateId, type FieldValues,
  ACOES, ASSUNTOS, PROJETOS, TAREFAS_CASA, COMODOS, ATIVIDADES_SAUDE,
} from "./task-form-constants";

interface DynamicFieldsProps {
  template: TemplateId;
  fields: FieldValues;
  setFields: (fields: FieldValues) => void;
  clientes: { id: string; nome: string }[];
  showNewClient: boolean;
  setShowNewClient: (v: boolean) => void;
  newClientName: string;
  setNewClientName: (v: string) => void;
  onAddClient: () => void;
  savingClient: boolean;
}

export function DynamicFields({
  template, fields, setFields,
  clientes, showNewClient, setShowNewClient, newClientName, setNewClientName,
  onAddClient, savingClient,
}: DynamicFieldsProps) {
  const clientProps = {
    clients: clientes,
    showNewClient,
    setShowNewClient,
    newClientName,
    setNewClientName,
    onAddClient,
    savingClient,
  };

  switch (template) {
    case "acao_cliente":
      return (
        <>
          <DropdownField label="AÇÃO" options={ACOES} value={fields.acao} onChange={(v) => setFields({ ...fields, acao: v })} />
          <ClientFieldEnhanced
            {...clientProps}
            value={fields.cliente}
            onChange={(nome, id) => setFields({ ...fields, cliente: nome, cliente_id: id })}
          />
        </>
      );
    case "reuniao":
      return (
        <>
          <DropdownField label="ASSUNTO" options={ASSUNTOS} value={fields.assunto} onChange={(v) => setFields({ ...fields, assunto: v })} />
          <ClientFieldEnhanced
            {...clientProps}
            value={fields.participante}
            onChange={(nome) => setFields({ ...fields, participante: nome })}
            label="PARTICIPANTE"
          />
        </>
      );
    case "entrega":
      return (
        <>
          <DropdownField label="PROJETO" options={PROJETOS} value={fields.projeto} onChange={(v) => setFields({ ...fields, projeto: v })} />
          <ClientFieldEnhanced
            {...clientProps}
            value={fields.cliente}
            onChange={(nome, id) => setFields({ ...fields, cliente: nome, cliente_id: id })}
          />
        </>
      );
    case "tarefa_geral":
      return <DropdownField label="DESCRIÇÃO" options={ACOES} value={fields.descricao} onChange={(v) => setFields({ ...fields, descricao: v })} />;
    case "domestico":
      return (
        <>
          <DropdownField label="TAREFA" options={TAREFAS_CASA} value={fields.tarefa_casa} onChange={(v) => setFields({ ...fields, tarefa_casa: v })} />
          <DropdownField label="CÔMODO" options={COMODOS} value={fields.comodo} onChange={(v) => setFields({ ...fields, comodo: v })} />
        </>
      );
    case "saude":
      return <DropdownField label="ATIVIDADE" options={ATIVIDADES_SAUDE} value={fields.atividade} onChange={(v) => setFields({ ...fields, atividade: v })} />;
    default:
      return null;
  }
}
