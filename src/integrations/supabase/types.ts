export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          acao: string
          contexto: string | null
          criado_em: string
          detalhes: Json | null
          id: string
          user_id: string | null
        }
        Insert: {
          acao: string
          contexto?: string | null
          criado_em?: string
          detalhes?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          acao?: string
          contexto?: string | null
          criado_em?: string
          detalhes?: Json | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bm_analise_semanal: {
        Row: {
          adesao_alimentar_pct: number | null
          classificacao: string | null
          created_at: string | null
          exercicios_semana: number | null
          humor_medio: number | null
          ia_alerta_nivel: string | null
          ia_insights: Json | null
          ia_resumo: string | null
          id: string
          score_medio: number | null
          semana_fim: string
          semana_inicio: string
          sono_medio: number | null
        }
        Insert: {
          adesao_alimentar_pct?: number | null
          classificacao?: string | null
          created_at?: string | null
          exercicios_semana?: number | null
          humor_medio?: number | null
          ia_alerta_nivel?: string | null
          ia_insights?: Json | null
          ia_resumo?: string | null
          id?: string
          score_medio?: number | null
          semana_fim: string
          semana_inicio: string
          sono_medio?: number | null
        }
        Update: {
          adesao_alimentar_pct?: number | null
          classificacao?: string | null
          created_at?: string | null
          exercicios_semana?: number | null
          humor_medio?: number | null
          ia_alerta_nivel?: string | null
          ia_insights?: Json | null
          ia_resumo?: string | null
          id?: string
          score_medio?: number | null
          semana_fim?: string
          semana_inicio?: string
          sono_medio?: number | null
        }
        Relationships: []
      }
      bm_exercicios: {
        Row: {
          como_ficou: number | null
          created_at: string | null
          data: string
          duracao_min: number
          id: string
          intensidade: number
          notas: string | null
          tipo: string
        }
        Insert: {
          como_ficou?: number | null
          created_at?: string | null
          data?: string
          duracao_min: number
          id?: string
          intensidade: number
          notas?: string | null
          tipo: string
        }
        Update: {
          como_ficou?: number | null
          created_at?: string | null
          data?: string
          duracao_min?: number
          id?: string
          intensidade?: number
          notas?: string | null
          tipo?: string
        }
        Relationships: []
      }
      bm_log_estado: {
        Row: {
          created_at: string | null
          data: string
          estado_energia: string | null
          exercicio_feito: boolean | null
          exercicio_intensidade: number | null
          exercicio_min: number | null
          humor: number | null
          ia_alerta: string | null
          ia_score_bem_estar: number | null
          ia_sinais: string[] | null
          id: string
          refeicoes_puladas: number | null
          refeicoes_saudaveis: number | null
          refeicoes_total: number | null
          remedio_tomado: boolean | null
          sono_horas: number | null
          sono_qualidade: number | null
        }
        Insert: {
          created_at?: string | null
          data: string
          estado_energia?: string | null
          exercicio_feito?: boolean | null
          exercicio_intensidade?: number | null
          exercicio_min?: number | null
          humor?: number | null
          ia_alerta?: string | null
          ia_score_bem_estar?: number | null
          ia_sinais?: string[] | null
          id?: string
          refeicoes_puladas?: number | null
          refeicoes_saudaveis?: number | null
          refeicoes_total?: number | null
          remedio_tomado?: boolean | null
          sono_horas?: number | null
          sono_qualidade?: number | null
        }
        Update: {
          created_at?: string | null
          data?: string
          estado_energia?: string | null
          exercicio_feito?: boolean | null
          exercicio_intensidade?: number | null
          exercicio_min?: number | null
          humor?: number | null
          ia_alerta?: string | null
          ia_score_bem_estar?: number | null
          ia_sinais?: string[] | null
          id?: string
          refeicoes_puladas?: number | null
          refeicoes_saudaveis?: number | null
          refeicoes_total?: number | null
          remedio_tomado?: boolean | null
          sono_horas?: number | null
          sono_qualidade?: number | null
        }
        Relationships: []
      }
      bm_metas: {
        Row: {
          ativo: boolean | null
          dias_exercicio_meta: number | null
          duracao_meta_min: number | null
          id: string
          refeicoes_meta_pct: number | null
        }
        Insert: {
          ativo?: boolean | null
          dias_exercicio_meta?: number | null
          duracao_meta_min?: number | null
          id?: string
          refeicoes_meta_pct?: number | null
        }
        Update: {
          ativo?: boolean | null
          dias_exercicio_meta?: number | null
          duracao_meta_min?: number | null
          id?: string
          refeicoes_meta_pct?: number | null
        }
        Relationships: []
      }
      bm_refeicoes: {
        Row: {
          categorias: string[] | null
          created_at: string | null
          data: string
          descricao: string | null
          id: string
          pulou: boolean | null
          qualidade: number
          refeicao: string
        }
        Insert: {
          categorias?: string[] | null
          created_at?: string | null
          data?: string
          descricao?: string | null
          id?: string
          pulou?: boolean | null
          qualidade: number
          refeicao: string
        }
        Update: {
          categorias?: string[] | null
          created_at?: string | null
          data?: string
          descricao?: string | null
          id?: string
          pulou?: boolean | null
          qualidade?: number
          refeicao?: string
        }
        Relationships: []
      }
      carteira_docs: {
        Row: {
          created_at: string | null
          dados: Json | null
          id: string
          notas: string | null
          tipo: string
          titulo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dados?: Json | null
          id?: string
          notas?: string | null
          tipo?: string
          titulo: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dados?: Json | null
          id?: string
          notas?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          contato: string | null
          criado_em: string
          data_renovacao: string | null
          id: string
          nome: string
          status: string
          tipo: string
          valor_mensal: number | null
        }
        Insert: {
          contato?: string | null
          criado_em?: string
          data_renovacao?: string | null
          id?: string
          nome: string
          status?: string
          tipo?: string
          valor_mensal?: number | null
        }
        Update: {
          contato?: string | null
          criado_em?: string
          data_renovacao?: string | null
          id?: string
          nome?: string
          status?: string
          tipo?: string
          valor_mensal?: number | null
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          chave: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
          valor: Json | null
        }
        Insert: {
          chave: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          valor?: Json | null
        }
        Update: {
          chave?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          valor?: Json | null
        }
        Relationships: []
      }
      diario_entradas: {
        Row: {
          created_at: string
          data: string
          fonte: string
          humor_detectado: number | null
          id: string
          impacto_metas: Json | null
          sentimento: string | null
          tags_extraidas: string[] | null
          texto: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: string
          fonte?: string
          humor_detectado?: number | null
          id?: string
          impacto_metas?: Json | null
          sentimento?: string | null
          tags_extraidas?: string[] | null
          texto: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          fonte?: string
          humor_detectado?: number | null
          id?: string
          impacto_metas?: Json | null
          sentimento?: string | null
          tags_extraidas?: string[] | null
          texto?: string
          user_id?: string
        }
        Relationships: []
      }
      fc_consolidacao: {
        Row: {
          ano: number
          id: string
          mes: number
          performance: number | null
          saldo_final: number | null
          saldo_inicial: number | null
          total_entradas: number | null
          total_saidas: number | null
        }
        Insert: {
          ano: number
          id?: string
          mes: number
          performance?: number | null
          saldo_final?: number | null
          saldo_inicial?: number | null
          total_entradas?: number | null
          total_saidas?: number | null
        }
        Update: {
          ano?: number
          id?: string
          mes?: number
          performance?: number | null
          saldo_final?: number | null
          saldo_inicial?: number | null
          total_entradas?: number | null
          total_saidas?: number | null
        }
        Relationships: []
      }
      fc_lancamento_tags: {
        Row: {
          lancamento_id: string
          tag_id: string
          valor: number | null
        }
        Insert: {
          lancamento_id: string
          tag_id: string
          valor?: number | null
        }
        Update: {
          lancamento_id?: string
          tag_id?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fc_lancamento_tags_lancamento_id_fkey"
            columns: ["lancamento_id"]
            isOneToOne: false
            referencedRelation: "fc_lancamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fc_lancamento_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "fc_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      fc_lancamentos: {
        Row: {
          ano: number
          created_at: string | null
          dia: number
          diario: string | null
          entrada: number | null
          id: string
          mes: number
          saida: number | null
          saldo: number | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          dia: number
          diario?: string | null
          entrada?: number | null
          id?: string
          mes: number
          saida?: number | null
          saldo?: number | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          dia?: number
          diario?: string | null
          entrada?: number | null
          id?: string
          mes?: number
          saida?: number | null
          saldo?: number | null
        }
        Relationships: []
      }
      fc_tags: {
        Row: {
          cor: string | null
          emoji: string | null
          id: string
          nome: string
        }
        Insert: {
          cor?: string | null
          emoji?: string | null
          id?: string
          nome: string
        }
        Update: {
          cor?: string | null
          emoji?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      lista_compras: {
        Row: {
          categoria: string | null
          comprado: boolean | null
          created_at: string | null
          id: string
          item: string
          quantidade: string | null
        }
        Insert: {
          categoria?: string | null
          comprado?: boolean | null
          created_at?: string | null
          id?: string
          item: string
          quantidade?: string | null
        }
        Update: {
          categoria?: string | null
          comprado?: boolean | null
          created_at?: string | null
          id?: string
          item?: string
          quantidade?: string | null
        }
        Relationships: []
      }
      log_consolidado: {
        Row: {
          created_at: string | null
          detalhes: Json | null
          id: string
          metricas: Json | null
          periodo_fim: string
          periodo_inicio: string
          resumo: string | null
          tipo: string
        }
        Insert: {
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          metricas?: Json | null
          periodo_fim: string
          periodo_inicio: string
          resumo?: string | null
          tipo: string
        }
        Update: {
          created_at?: string | null
          detalhes?: Json | null
          id?: string
          metricas?: Json | null
          periodo_fim?: string
          periodo_inicio?: string
          resumo?: string | null
          tipo?: string
        }
        Relationships: []
      }
      medicamentos: {
        Row: {
          criado_em: string
          dose: string
          estoque: number
          horarios: string[]
          id: string
          instrucoes: string | null
          nome: string
        }
        Insert: {
          criado_em?: string
          dose?: string
          estoque?: number
          horarios?: string[]
          id?: string
          instrucoes?: string | null
          nome: string
        }
        Update: {
          criado_em?: string
          dose?: string
          estoque?: number
          horarios?: string[]
          id?: string
          instrucoes?: string | null
          nome?: string
        }
        Relationships: []
      }
      metas_pessoais: {
        Row: {
          created_at: string | null
          data_alvo: string
          data_inicio: string
          descricao: string | null
          id: string
          notas_progresso: Json | null
          prazo: string
          progresso: number | null
          status: string | null
          titulo: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_alvo: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          notas_progresso?: Json | null
          prazo: string
          progresso?: number | null
          status?: string | null
          titulo: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_alvo?: string
          data_inicio?: string
          descricao?: string | null
          id?: string
          notas_progresso?: Json | null
          prazo?: string
          progresso?: number | null
          status?: string | null
          titulo?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          altura_cm: number | null
          casa_comodos: number | null
          casa_desafio: string | null
          casa_frequencia_ideal: string | null
          casa_moradores: number | null
          casa_pets: boolean | null
          created_at: string | null
          data_nascimento: string | null
          financeiro_controla_gastos: string | null
          financeiro_faixa_renda: string | null
          financeiro_objetivo: string | null
          financeiro_principal_gasto: string | null
          financeiro_reserva: string | null
          id: string
          nome: string | null
          objetivo_saude: string | null
          onboarding_casa: boolean | null
          onboarding_casa_at: string | null
          onboarding_financeiro: boolean | null
          onboarding_financeiro_at: string | null
          onboarding_saude: boolean | null
          onboarding_saude_at: string | null
          onboarding_trabalho: boolean | null
          onboarding_trabalho_at: string | null
          peso_kg: number | null
          trabalho_clientes_ativos: number | null
          trabalho_desafio: string | null
          trabalho_equipe: string | null
          trabalho_horas_dia: number | null
          trabalho_tipo: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          altura_cm?: number | null
          casa_comodos?: number | null
          casa_desafio?: string | null
          casa_frequencia_ideal?: string | null
          casa_moradores?: number | null
          casa_pets?: boolean | null
          created_at?: string | null
          data_nascimento?: string | null
          financeiro_controla_gastos?: string | null
          financeiro_faixa_renda?: string | null
          financeiro_objetivo?: string | null
          financeiro_principal_gasto?: string | null
          financeiro_reserva?: string | null
          id?: string
          nome?: string | null
          objetivo_saude?: string | null
          onboarding_casa?: boolean | null
          onboarding_casa_at?: string | null
          onboarding_financeiro?: boolean | null
          onboarding_financeiro_at?: string | null
          onboarding_saude?: boolean | null
          onboarding_saude_at?: string | null
          onboarding_trabalho?: boolean | null
          onboarding_trabalho_at?: string | null
          peso_kg?: number | null
          trabalho_clientes_ativos?: number | null
          trabalho_desafio?: string | null
          trabalho_equipe?: string | null
          trabalho_horas_dia?: number | null
          trabalho_tipo?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          altura_cm?: number | null
          casa_comodos?: number | null
          casa_desafio?: string | null
          casa_frequencia_ideal?: string | null
          casa_moradores?: number | null
          casa_pets?: boolean | null
          created_at?: string | null
          data_nascimento?: string | null
          financeiro_controla_gastos?: string | null
          financeiro_faixa_renda?: string | null
          financeiro_objetivo?: string | null
          financeiro_principal_gasto?: string | null
          financeiro_reserva?: string | null
          id?: string
          nome?: string | null
          objetivo_saude?: string | null
          onboarding_casa?: boolean | null
          onboarding_casa_at?: string | null
          onboarding_financeiro?: boolean | null
          onboarding_financeiro_at?: string | null
          onboarding_saude?: boolean | null
          onboarding_saude_at?: string | null
          onboarding_trabalho?: boolean | null
          onboarding_trabalho_at?: string | null
          peso_kg?: number | null
          trabalho_clientes_ativos?: number | null
          trabalho_desafio?: string | null
          trabalho_equipe?: string | null
          trabalho_horas_dia?: number | null
          trabalho_tipo?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      registros_humor: {
        Row: {
          data: string
          id: string
          notas: string | null
          valor: number
        }
        Insert: {
          data?: string
          id?: string
          notas?: string | null
          valor: number
        }
        Update: {
          data?: string
          id?: string
          notas?: string | null
          valor?: number
        }
        Relationships: []
      }
      registros_limpeza: {
        Row: {
          comodo: string
          feito_em: string
          id: string
          notas: string | null
          tarefa: string
          tarefa_casa_id: string | null
        }
        Insert: {
          comodo: string
          feito_em?: string
          id?: string
          notas?: string | null
          tarefa: string
          tarefa_casa_id?: string | null
        }
        Update: {
          comodo?: string
          feito_em?: string
          id?: string
          notas?: string | null
          tarefa?: string
          tarefa_casa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registros_limpeza_tarefa_casa_id_fkey"
            columns: ["tarefa_casa_id"]
            isOneToOne: false
            referencedRelation: "tarefas_casa"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_medicamento: {
        Row: {
          data: string
          horario_previsto: string
          horario_tomado: string | null
          id: string
          medicamento_id: string
          tomado: boolean
        }
        Insert: {
          data?: string
          horario_previsto: string
          horario_tomado?: string | null
          id?: string
          medicamento_id: string
          tomado?: boolean
        }
        Update: {
          data?: string
          horario_previsto?: string
          horario_tomado?: string | null
          id?: string
          medicamento_id?: string
          tomado?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "registros_medicamento_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "medicamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_peso: {
        Row: {
          created_at: string | null
          data: string
          id: string
          notas: string | null
          peso_kg: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: string
          id?: string
          notas?: string | null
          peso_kg: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: string
          id?: string
          notas?: string | null
          peso_kg?: number
          user_id?: string
        }
        Relationships: []
      }
      registros_sono: {
        Row: {
          data: string
          duracao_min: number | null
          horario_acordar: string | null
          horario_dormir: string | null
          id: string
          qualidade: number | null
        }
        Insert: {
          data?: string
          duracao_min?: number | null
          horario_acordar?: string | null
          horario_dormir?: string | null
          id?: string
          qualidade?: number | null
        }
        Update: {
          data?: string
          duracao_min?: number | null
          horario_acordar?: string | null
          horario_dormir?: string | null
          id?: string
          qualidade?: number | null
        }
        Relationships: []
      }
      reports_semanais: {
        Row: {
          created_at: string | null
          destaques: string[] | null
          dificuldades: string[] | null
          id: string
          metas_update: Json | null
          metricas: Json | null
          nota_semana: number | null
          reflexao: string | null
          semana_fim: string
          semana_inicio: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          destaques?: string[] | null
          dificuldades?: string[] | null
          id?: string
          metas_update?: Json | null
          metricas?: Json | null
          nota_semana?: number | null
          reflexao?: string | null
          semana_fim: string
          semana_inicio: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          destaques?: string[] | null
          dificuldades?: string[] | null
          id?: string
          metas_update?: Json | null
          metricas?: Json | null
          nota_semana?: number | null
          reflexao?: string | null
          semana_fim?: string
          semana_inicio?: string
          user_id?: string
        }
        Relationships: []
      }
      reunioes: {
        Row: {
          cor: string | null
          created_at: string | null
          data: string
          descricao: string | null
          hora_fim: string | null
          hora_inicio: string
          id: string
          lembrete_min: number | null
          local: string | null
          participantes: string[] | null
          tipo: string | null
          titulo: string
          user_id: string
        }
        Insert: {
          cor?: string | null
          created_at?: string | null
          data: string
          descricao?: string | null
          hora_fim?: string | null
          hora_inicio: string
          id?: string
          lembrete_min?: number | null
          local?: string | null
          participantes?: string[] | null
          tipo?: string | null
          titulo: string
          user_id: string
        }
        Update: {
          cor?: string | null
          created_at?: string | null
          data?: string
          descricao?: string | null
          hora_fim?: string | null
          hora_inicio?: string
          id?: string
          lembrete_min?: number | null
          local?: string | null
          participantes?: string[] | null
          tipo?: string | null
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      sessoes_energia: {
        Row: {
          data: string
          estado: Database["public"]["Enums"]["energy_state"]
          hora_inicio: string
          id: string
        }
        Insert: {
          data?: string
          estado: Database["public"]["Enums"]["energy_state"]
          hora_inicio?: string
          id?: string
        }
        Update: {
          data?: string
          estado?: Database["public"]["Enums"]["energy_state"]
          hora_inicio?: string
          id?: string
        }
        Relationships: []
      }
      tarefas_casa: {
        Row: {
          ativo: boolean | null
          comodo: string
          created_at: string | null
          frequencia: string
          id: string
          tarefa: string
          tempo_min: number | null
        }
        Insert: {
          ativo?: boolean | null
          comodo: string
          created_at?: string | null
          frequencia?: string
          id?: string
          tarefa: string
          tempo_min?: number | null
        }
        Update: {
          ativo?: boolean | null
          comodo?: string
          created_at?: string | null
          frequencia?: string
          id?: string
          tarefa?: string
          tempo_min?: number | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          cliente_id: string | null
          criado_em: string
          data_limite: string | null
          depende_de: string | null
          dono: Database["public"]["Enums"]["task_owner"]
          estado_ideal: Database["public"]["Enums"]["estado_ideal_type"]
          feito_em: string | null
          frequencia_recorrencia: string | null
          id: string
          impacto: number
          modulo: Database["public"]["Enums"]["task_modulo"]
          notas: string | null
          parent_task_id: string | null
          recorrente: boolean
          status: Database["public"]["Enums"]["task_status"]
          tempo_min: number
          tipo: Database["public"]["Enums"]["task_tipo"]
          titulo: string
          urgencia: number
        }
        Insert: {
          cliente_id?: string | null
          criado_em?: string
          data_limite?: string | null
          depende_de?: string | null
          dono?: Database["public"]["Enums"]["task_owner"]
          estado_ideal?: Database["public"]["Enums"]["estado_ideal_type"]
          feito_em?: string | null
          frequencia_recorrencia?: string | null
          id?: string
          impacto?: number
          modulo?: Database["public"]["Enums"]["task_modulo"]
          notas?: string | null
          parent_task_id?: string | null
          recorrente?: boolean
          status?: Database["public"]["Enums"]["task_status"]
          tempo_min?: number
          tipo?: Database["public"]["Enums"]["task_tipo"]
          titulo: string
          urgencia?: number
        }
        Update: {
          cliente_id?: string | null
          criado_em?: string
          data_limite?: string | null
          depende_de?: string | null
          dono?: Database["public"]["Enums"]["task_owner"]
          estado_ideal?: Database["public"]["Enums"]["estado_ideal_type"]
          feito_em?: string | null
          frequencia_recorrencia?: string | null
          id?: string
          impacto?: number
          modulo?: Database["public"]["Enums"]["task_modulo"]
          notas?: string | null
          parent_task_id?: string | null
          recorrente?: boolean
          status?: Database["public"]["Enums"]["task_status"]
          tempo_min?: number
          tipo?: Database["public"]["Enums"]["task_tipo"]
          titulo?: string
          urgencia?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasks_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      energy_state: "foco_total" | "modo_leve" | "basico"
      estado_ideal_type: "foco_total" | "modo_leve" | "basico" | "qualquer"
      task_modulo: "trabalho" | "casa" | "saude"
      task_owner: "eu" | "socio_medico" | "editor"
      task_status:
        | "backlog"
        | "hoje"
        | "em_andamento"
        | "aguardando"
        | "feito"
        | "descartado"
      task_tipo:
        | "estrategico"
        | "operacional"
        | "delegavel"
        | "administrativo"
        | "domestico"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      energy_state: ["foco_total", "modo_leve", "basico"],
      estado_ideal_type: ["foco_total", "modo_leve", "basico", "qualquer"],
      task_modulo: ["trabalho", "casa", "saude"],
      task_owner: ["eu", "socio_medico", "editor"],
      task_status: [
        "backlog",
        "hoje",
        "em_andamento",
        "aguardando",
        "feito",
        "descartado",
      ],
      task_tipo: [
        "estrategico",
        "operacional",
        "delegavel",
        "administrativo",
        "domestico",
      ],
    },
  },
} as const
