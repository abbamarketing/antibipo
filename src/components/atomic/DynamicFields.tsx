import { DropdownField } from "./DropdownField";
import {
  type TemplateId, type FieldValues,
  TAREFAS_CASA, COMODOS, ATIVIDADES_SAUDE,
} from "./task-form-constants";

interface DynamicFieldsProps {
  template: TemplateId;
  fields: FieldValues;
  setFields: (fields: FieldValues) => void;
}

export function DynamicFields({
  template, fields, setFields,
}: DynamicFieldsProps) {
  switch (template) {
    case "tarefa_geral":
      return <DropdownField label="DESCRIÇÃO" options={["Pesquisar", "Executar", "Revisar", "Finalizar", "Organizar", "Planejar", "Verificar"]} value={fields.descricao} onChange={(v) => setFields({ ...fields, descricao: v })} />;
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
