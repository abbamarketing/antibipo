import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";

export type Profile = {
  id: string;
  user_id: string;
  nome: string | null;
  data_nascimento: string | null;
  peso_kg: number | null;
  altura_cm: number | null;
  objetivo_saude: string | null;
  trabalho_tipo: string | null;
  trabalho_horas_dia: number | null;
  trabalho_desafio: string | null;
  trabalho_clientes_ativos: number | null;
  trabalho_equipe: string | null;
  casa_moradores: number | null;
  casa_comodos: number | null;
  casa_pets: boolean | null;
  casa_frequencia_ideal: string | null;
  casa_desafio: string | null;
  financeiro_faixa_renda: string | null;
  financeiro_objetivo: string | null;
  financeiro_controla_gastos: string | null;
  financeiro_principal_gasto: string | null;
  financeiro_reserva: string | null;
  onboarding_saude: boolean | null;
  onboarding_trabalho: boolean | null;
  onboarding_casa: boolean | null;
  onboarding_financeiro: boolean | null;
  onboarding_saude_at: string | null;
  onboarding_trabalho_at: string | null;
  onboarding_casa_at: string | null;
  onboarding_financeiro_at: string | null;
};

export type RegistroPeso = {
  id: string;
  user_id: string;
  peso_kg: number;
  data: string;
  notas: string | null;
  created_at: string | null;
};

export function useProfileStore() {
  const qc = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery<Profile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Profile | null;
    },
  });

  const { data: pesoHistory = [] } = useQuery<RegistroPeso[]>({
    queryKey: ["registros_peso"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("registros_peso" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("data", { ascending: false })
        .limit(90);
      if (error) throw error;
      return (data || []) as unknown as RegistroPeso[];
    },
  });

  const updateProfileMut = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles" as any)
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });

  const addPesoMut = useMutation({
    mutationFn: async (entry: { peso_kg: number; notas?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("registros_peso" as any)
        .insert({ ...entry, user_id: user.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["registros_peso"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const ADAPTIVE_MODULES: string[] = ["trabalho", "saude"];

  const isOnboardingDone = useCallback(
    (modulo: "saude" | "trabalho" | "casa" | "financeiro") => {
      if (!profile) return false;
      const done = !!profile[`onboarding_${modulo}` as keyof Profile];
      if (!done) return false;

      // For adaptive modules, check if 30 days have passed
      if (ADAPTIVE_MODULES.includes(modulo)) {
        const lastAt = profile[`onboarding_${modulo}_at` as keyof Profile] as string | null;
        if (lastAt) {
          const elapsed = Date.now() - new Date(lastAt).getTime();
          if (elapsed > THIRTY_DAYS_MS) return false; // Time for refresh
        }
      }
      return true;
    },
    [profile]
  );

  const pesoAtual = profile?.peso_kg ?? pesoHistory[0]?.peso_kg ?? null;
  const ultimoPeso = pesoHistory[0] ?? null;

  const idade = profile?.data_nascimento
    ? Math.floor((Date.now() - new Date(profile.data_nascimento).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const imc = profile?.peso_kg && profile?.altura_cm
    ? +(profile.peso_kg / Math.pow(profile.altura_cm / 100, 2)).toFixed(1)
    : null;

  const imcCategoria = imc
    ? imc < 18.5 ? "abaixo" : imc < 25 ? "normal" : imc < 30 ? "sobrepeso" : "obesidade"
    : null;

  return {
    profile,
    profileLoading,
    pesoHistory,
    pesoAtual,
    ultimoPeso,
    idade,
    imc,
    imcCategoria,
    isOnboardingDone,
    updateProfile: updateProfileMut.mutate,
    addPeso: addPesoMut.mutate,
  };
}
