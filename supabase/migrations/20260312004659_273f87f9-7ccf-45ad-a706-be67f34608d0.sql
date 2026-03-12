CREATE OR REPLACE FUNCTION public.reset_user_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Enforce that caller can only reset their own account
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  IF auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Ação não permitida para este usuário';
  END IF;

  -- Delete all user-specific data
  DELETE FROM public.activity_log WHERE user_id = p_user_id;
  DELETE FROM public.configuracoes WHERE user_id = p_user_id;
  DELETE FROM public.tracker_registros WHERE user_id = p_user_id;
  DELETE FROM public.custom_trackers WHERE user_id = p_user_id;
  DELETE FROM public.diario_entradas WHERE user_id = p_user_id;
  DELETE FROM public.metas_pessoais WHERE user_id = p_user_id;
  DELETE FROM public.registros_peso WHERE user_id = p_user_id;
  DELETE FROM public.reports_semanais WHERE user_id = p_user_id;
  DELETE FROM public.reunioes WHERE user_id = p_user_id;
  DELETE FROM public.carteira_docs WHERE user_id = p_user_id;

  -- Shared tables (current app model)
  -- NOTE: explicit WHERE is required in environments with safe-update guards
  DELETE FROM public.tasks WHERE true;
  DELETE FROM public.tarefas_casa WHERE true;
  DELETE FROM public.registros_limpeza WHERE true;
  DELETE FROM public.medicamentos WHERE true;
  DELETE FROM public.registros_medicamento WHERE true;
  DELETE FROM public.registros_humor WHERE true;
  DELETE FROM public.registros_sono WHERE true;
  DELETE FROM public.sessoes_energia WHERE true;
  DELETE FROM public.lista_compras WHERE true;
  DELETE FROM public.bm_exercicios WHERE true;
  DELETE FROM public.bm_refeicoes WHERE true;
  DELETE FROM public.bm_log_estado WHERE true;
  DELETE FROM public.bm_metas WHERE true;
  DELETE FROM public.bm_analise_semanal WHERE true;
  DELETE FROM public.log_consolidado WHERE true;
  DELETE FROM public.fc_lancamento_tags WHERE true;
  DELETE FROM public.fc_lancamentos WHERE true;
  DELETE FROM public.fc_tags WHERE true;
  DELETE FROM public.fc_consolidacao WHERE true;
  DELETE FROM public.clientes WHERE true;

  -- Reset profile to blank
  UPDATE public.profiles SET
    nome = NULL,
    data_nascimento = NULL,
    peso_kg = NULL,
    altura_cm = NULL,
    objetivo_saude = NULL,
    trabalho_tipo = NULL,
    trabalho_horas_dia = NULL,
    trabalho_desafio = NULL,
    trabalho_clientes_ativos = NULL,
    trabalho_equipe = NULL,
    casa_moradores = NULL,
    casa_comodos = NULL,
    casa_pets = false,
    casa_frequencia_ideal = NULL,
    casa_desafio = NULL,
    financeiro_faixa_renda = NULL,
    financeiro_objetivo = NULL,
    financeiro_controla_gastos = NULL,
    financeiro_principal_gasto = NULL,
    financeiro_reserva = NULL,
    onboarding_saude = false,
    onboarding_trabalho = false,
    onboarding_casa = false,
    onboarding_financeiro = false,
    onboarding_saude_at = NULL,
    onboarding_trabalho_at = NULL,
    onboarding_casa_at = NULL,
    onboarding_financeiro_at = NULL,
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$function$;