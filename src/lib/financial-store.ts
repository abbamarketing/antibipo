import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";
import { daysInMonth, isValidDay } from "./currency";

export interface Lancamento {
  id: string;
  ano: number;
  mes: number;
  dia: number;
  entrada: number;
  saida: number;
  diario: string | null;
  saldo: number | null;
  created_at: string;
}

export interface Consolidacao {
  id: string;
  ano: number;
  mes: number;
  total_entradas: number;
  total_saidas: number;
  performance: number;
  saldo_inicial: number;
  saldo_final: number;
}

export interface FcTag {
  id: string;
  nome: string;
  emoji: string | null;
  cor: string;
}

export interface LancamentoTag {
  lancamento_id: string;
  tag_id: string;
  valor: number | null;
}

export function useFinancialStore(ano: number, mes: number) {
  const qc = useQueryClient();

  const { data: lancamentos = [] } = useQuery<Lancamento[]>({
    queryKey: ["fc_lancamentos", ano, mes],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fc_lancamentos")
        .select("*")
        .eq("ano", ano)
        .eq("mes", mes)
        .order("dia");
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        entrada: Number(d.entrada),
        saida: Number(d.saida),
        saldo: d.saldo != null ? Number(d.saldo) : null,
      }));
    },
  });

  const { data: consolidacao } = useQuery<Consolidacao | null>({
    queryKey: ["fc_consolidacao", ano, mes],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fc_consolidacao")
        .select("*")
        .eq("ano", ano)
        .eq("mes", mes)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        total_entradas: Number(data.total_entradas),
        total_saidas: Number(data.total_saidas),
        performance: Number(data.performance),
        saldo_inicial: Number(data.saldo_inicial),
        saldo_final: Number(data.saldo_final),
      } as Consolidacao;
    },
  });

  const { data: tags = [] } = useQuery<FcTag[]>({
    queryKey: ["fc_tags"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fc_tags").select("*").order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: lancamentoTags = [] } = useQuery<LancamentoTag[]>({
    queryKey: ["fc_lancamento_tags", ano, mes],
    queryFn: async () => {
      const lancIds = lancamentos.map((l) => l.id);
      if (lancIds.length === 0) return [];
      const { data, error } = await supabase
        .from("fc_lancamento_tags")
        .select("*")
        .in("lancamento_id", lancIds);
      if (error) throw error;
      return (data || []).map((d: any) => ({ ...d, valor: d.valor != null ? Number(d.valor) : null }));
    },
    enabled: lancamentos.length > 0,
  });

  // Recalculate balances from a given day
  const recalcularSaldos = useCallback(async (fromDay: number = 1) => {
    // Get previous month's final balance
    let prevSaldo = 0;
    const prevMes = mes === 1 ? 12 : mes - 1;
    const prevAno = mes === 1 ? ano - 1 : ano;
    const { data: prevConsolidacao } = await supabase
      .from("fc_consolidacao")
      .select("saldo_final")
      .eq("ano", prevAno)
      .eq("mes", prevMes)
      .maybeSingle();
    if (prevConsolidacao) prevSaldo = Number(prevConsolidacao.saldo_final);

    // Get all lancamentos for this month
    const { data: allLancs } = await supabase
      .from("fc_lancamentos")
      .select("*")
      .eq("ano", ano)
      .eq("mes", mes)
      .order("dia");

    if (!allLancs) return;

    let runSaldo = prevSaldo;
    let totalEntradas = 0;
    let totalSaidas = 0;

    // Build map
    const lancMap = new Map<number, any>();
    allLancs.forEach((l: any) => lancMap.set(l.dia, l));

    const days = daysInMonth(ano, mes);
    for (let d = 1; d <= days; d++) {
      if (!isValidDay(ano, mes, d)) continue;
      const lanc = lancMap.get(d);
      if (lanc) {
        const entrada = Number(lanc.entrada);
        const saida = Number(lanc.saida);
        runSaldo = runSaldo + entrada - saida;
        totalEntradas += entrada;
        totalSaidas += saida;
        if (d >= fromDay) {
          await supabase.from("fc_lancamentos").update({ saldo: runSaldo }).eq("id", lanc.id);
        }
      }
    }

    // Update consolidacao
    const perf = totalEntradas - totalSaidas;
    await supabase.from("fc_consolidacao").upsert({
      ano,
      mes,
      total_entradas: totalEntradas,
      total_saidas: totalSaidas,
      performance: perf,
      saldo_inicial: prevSaldo,
      saldo_final: runSaldo,
    }, { onConflict: "ano,mes" });

    qc.invalidateQueries({ queryKey: ["fc_lancamentos", ano, mes] });
    qc.invalidateQueries({ queryKey: ["fc_consolidacao", ano, mes] });
  }, [ano, mes, qc]);

  const upsertLancamento = useMutation({
    mutationFn: async (params: { dia: number; entrada: number; saida: number; diario?: string; tagId?: string; tagValor?: number }) => {
      if (!isValidDay(ano, mes, params.dia)) throw new Error("Dia inválido");

      const { data, error } = await supabase
        .from("fc_lancamentos")
        .upsert({
          ano,
          mes,
          dia: params.dia,
          entrada: params.entrada,
          saida: params.saida,
          diario: params.diario || null,
        }, { onConflict: "ano,mes,dia" })
        .select()
        .single();
      if (error) throw error;

      // Handle tag
      if (params.tagId && data) {
        await supabase.from("fc_lancamento_tags").upsert({
          lancamento_id: data.id,
          tag_id: params.tagId,
          valor: params.tagValor || (params.entrada > 0 ? params.entrada : params.saida),
        }, { onConflict: "lancamento_id,tag_id" });
      }

      return data;
    },
    onSuccess: async (_, vars) => {
      await recalcularSaldos(vars.dia);
      qc.invalidateQueries({ queryKey: ["fc_lancamento_tags"] });
    },
  });

  const createTag = useMutation({
    mutationFn: async (tag: { nome: string; emoji?: string; cor?: string }) => {
      const { error } = await supabase.from("fc_tags").insert(tag);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fc_tags"] }),
  });

  const updateTag = useMutation({
    mutationFn: async ({ id, ...changes }: { id: string; nome?: string; emoji?: string; cor?: string }) => {
      const { error } = await supabase.from("fc_tags").update(changes).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fc_tags"] }),
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fc_tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fc_tags"] }),
  });

  // Build daily list for saldos view
  const dailyList = useCallback(() => {
    const days = daysInMonth(ano, mes);
    const lancMap = new Map<number, Lancamento>();
    lancamentos.forEach((l) => lancMap.set(l.dia, l));

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === ano && today.getMonth() + 1 === mes;
    const todayDay = today.getDate();
    const isMonthPast = ano < today.getFullYear() || (ano === today.getFullYear() && mes < today.getMonth() + 1);

    const result = [];
    for (let d = 1; d <= days; d++) {
      if (!isValidDay(ano, mes, d)) continue;
      const lanc = lancMap.get(d);
      const isPast = isCurrentMonth ? d < todayDay : isMonthPast;
      const isToday = isCurrentMonth && d === todayDay;
      // Only show saldo for days up to today (past months show all, future months show none)
      const isFutureDay = isCurrentMonth ? d > todayDay : !isMonthPast;
      result.push({
        dia: d,
        entrada: lanc?.entrada || 0,
        saida: lanc?.saida || 0,
        saldo: isFutureDay ? null : (lanc?.saldo ?? null),
        diario: lanc?.diario || null,
        hasData: !!lanc && (lanc.entrada > 0 || lanc.saida > 0),
        isPast,
        isToday,
        confirmed: isPast && !!lanc,
        lancamentoId: lanc?.id,
      });
    }
    return result;
  }, [ano, mes, lancamentos]);

  return {
    lancamentos,
    consolidacao,
    tags,
    lancamentoTags,
    dailyList,
    upsertLancamento,
    recalcularSaldos,
    createTag,
    updateTag,
    deleteTag,
  };
}
