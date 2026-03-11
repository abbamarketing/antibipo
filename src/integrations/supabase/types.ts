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
    PostgrestVersion: "14.1"
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
        }
        Insert: {
          acao: string
          contexto?: string | null
          criado_em?: string
          detalhes?: Json | null
          id?: string
        }
        Update: {
          acao?: string
          contexto?: string | null
          criado_em?: string
          detalhes?: Json | null
          id?: string
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
          valor_mensal: number | null
        }
        Insert: {
          contato?: string | null
          criado_em?: string
          data_renovacao?: string | null
          id?: string
          nome: string
          status?: string
          valor_mensal?: number | null
        }
        Update: {
          contato?: string | null
          criado_em?: string
          data_renovacao?: string | null
          id?: string
          nome?: string
          status?: string
          valor_mensal?: number | null
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
      tasks: {
        Row: {
          cliente_id: string | null
          criado_em: string
          dono: Database["public"]["Enums"]["task_owner"]
          estado_ideal: Database["public"]["Enums"]["estado_ideal_type"]
          feito_em: string | null
          id: string
          impacto: number
          modulo: Database["public"]["Enums"]["task_modulo"]
          status: Database["public"]["Enums"]["task_status"]
          tempo_min: number
          tipo: Database["public"]["Enums"]["task_tipo"]
          titulo: string
          urgencia: number
        }
        Insert: {
          cliente_id?: string | null
          criado_em?: string
          dono?: Database["public"]["Enums"]["task_owner"]
          estado_ideal?: Database["public"]["Enums"]["estado_ideal_type"]
          feito_em?: string | null
          id?: string
          impacto?: number
          modulo?: Database["public"]["Enums"]["task_modulo"]
          status?: Database["public"]["Enums"]["task_status"]
          tempo_min?: number
          tipo?: Database["public"]["Enums"]["task_tipo"]
          titulo: string
          urgencia?: number
        }
        Update: {
          cliente_id?: string | null
          criado_em?: string
          dono?: Database["public"]["Enums"]["task_owner"]
          estado_ideal?: Database["public"]["Enums"]["estado_ideal_type"]
          feito_em?: string | null
          id?: string
          impacto?: number
          modulo?: Database["public"]["Enums"]["task_modulo"]
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
