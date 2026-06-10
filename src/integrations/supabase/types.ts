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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      auditoria: {
        Row: {
          id: string
          user_id: string | null
          user_nome: string | null
          acao: string
          modulo: string
          detalhes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          user_nome?: string | null
          acao: string
          modulo: string
          detalhes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          user_nome?: string | null
          acao?: string
          modulo?: string
          detalhes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      avisos: {
        Row: {
          id: string
          titulo: string
          link: string | null
          observacao: string | null
          publico: string
          ativo: boolean
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          titulo: string
          link?: string | null
          observacao?: string | null
          publico?: string
          ativo?: boolean
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          titulo?: string
          link?: string | null
          observacao?: string | null
          publico?: string
          ativo?: boolean
          created_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          id: string
          one_on_one_id: string | null
          de_user_id: string
          de_user_nome: string
          para_user_id: string
          para_user_nome: string
          tipo: string
          conteudo: string
          created_at: string
        }
        Insert: {
          id?: string
          one_on_one_id?: string | null
          de_user_id: string
          de_user_nome: string
          para_user_id: string
          para_user_nome: string
          tipo?: string
          conteudo: string
          created_at?: string
        }
        Update: {
          id?: string
          one_on_one_id?: string | null
          de_user_id?: string
          de_user_nome?: string
          para_user_id?: string
          para_user_nome?: string
          tipo?: string
          conteudo?: string
          created_at?: string
        }
        Relationships: []
      }
      eventos: {
        Row: {
          id: string
          titulo: string
          descricao: string | null
          data_inicio: string
          data_fim: string | null
          hora_inicio: string | null
          hora_fim: string | null
          dia_todo: boolean
          criado_por: string | null
          created_at: string
        }
        Insert: {
          id?: string
          titulo: string
          descricao?: string | null
          data_inicio: string
          data_fim?: string | null
          hora_inicio?: string | null
          hora_fim?: string | null
          dia_todo?: boolean
          criado_por?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          titulo?: string
          descricao?: string | null
          data_inicio?: string
          data_fim?: string | null
          hora_inicio?: string | null
          hora_fim?: string | null
          dia_todo?: boolean
          criado_por?: string | null
          created_at?: string
        }
        Relationships: []
      }
configuracoes: {
        Row: {
          id: string
          updated_at: string | null
          valor: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          valor?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          valor?: string | null
        }
        Relationships: []
      }
      elogio_reacoes: {
        Row: {
          created_at: string | null
          elogio_id: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          elogio_id: string
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          elogio_id?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "elogio_reacoes_elogio_id_fkey"
            columns: ["elogio_id"]
            isOneToOne: false
            referencedRelation: "elogios"
            referencedColumns: ["id"]
          },
        ]
      }
      elogios: {
        Row: {
          created_at: string
          destinatario_id: string
          destinatario_nome: string
          emoji: string
          id: string
          mensagem: string
          publico: boolean
          remetente_id: string
          remetente_nome: string
        }
        Insert: {
          created_at?: string
          destinatario_id: string
          destinatario_nome: string
          emoji: string
          id?: string
          mensagem: string
          publico?: boolean
          remetente_id: string
          remetente_nome: string
        }
        Update: {
          created_at?: string
          destinatario_id?: string
          destinatario_nome?: string
          emoji?: string
          id?: string
          mensagem?: string
          publico?: boolean
          remetente_id?: string
          remetente_nome?: string
        }
        Relationships: []
      }
      one_on_one: {
        Row: {
          anotacoes: string | null
          created_at: string | null
          data_reuniao: string
          gestor_id: string
          id: string
          liderado_id: string
          liderado_nome: string
          updated_at: string | null
        }
        Insert: {
          anotacoes?: string | null
          created_at?: string | null
          data_reuniao: string
          gestor_id: string
          id?: string
          liderado_id: string
          liderado_nome: string
          updated_at?: string | null
        }
        Update: {
          anotacoes?: string | null
          created_at?: string | null
          data_reuniao?: string
          gestor_id?: string
          id?: string
          liderado_id?: string
          liderado_nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      one_on_one_comentarios: {
        Row: {
          autor_id: string
          autor_nome: string
          created_at: string | null
          id: string
          one_on_one_id: string
          texto: string
          updated_at: string | null
        }
        Insert: {
          autor_id: string
          autor_nome: string
          created_at?: string | null
          id?: string
          one_on_one_id: string
          texto: string
          updated_at?: string | null
        }
        Update: {
          autor_id?: string
          autor_nome?: string
          created_at?: string | null
          id?: string
          one_on_one_id?: string
          texto?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "one_on_one_comentarios_one_on_one_id_fkey"
            columns: ["one_on_one_id"]
            isOneToOne: false
            referencedRelation: "one_on_one"
            referencedColumns: ["id"]
          },
        ]
      }
      one_on_one_todos: {
        Row: {
          concluido: boolean
          concluido_em: string | null
          concluido_por_id: string | null
          concluido_por_nome: string | null
          created_at: string | null
          id: string
          one_on_one_id: string
          responsavel: string | null
          texto: string
        }
        Insert: {
          concluido?: boolean
          concluido_em?: string | null
          concluido_por_id?: string | null
          concluido_por_nome?: string | null
          created_at?: string | null
          id?: string
          one_on_one_id: string
          responsavel?: string | null
          texto: string
        }
        Update: {
          concluido?: boolean
          concluido_em?: string | null
          concluido_por_id?: string | null
          concluido_por_nome?: string | null
          created_at?: string | null
          id?: string
          one_on_one_id?: string
          responsavel?: string | null
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_on_one_todos_one_on_one_id_fkey"
            columns: ["one_on_one_id"]
            isOneToOne: false
            referencedRelation: "one_on_one"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          drive_folder_url: string | null
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          drive_folder_url?: string | null
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          drive_folder_url?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      sugestoes: {
        Row: {
          anonima: boolean
          autor_id: string | null
          autor_nome: string | null
          created_at: string | null
          id: string
          texto: string
          resposta: string | null
          respondido_em: string | null
        }
        Insert: {
          anonima?: boolean
          autor_id?: string | null
          autor_nome?: string | null
          created_at?: string | null
          id?: string
          texto: string
          resposta?: string | null
          respondido_em?: string | null
        }
        Update: {
          anonima?: boolean
          autor_id?: string | null
          autor_nome?: string | null
          created_at?: string | null
          id?: string
          texto?: string
          resposta?: string | null
          respondido_em?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_users_with_emails: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gestor" | "geral"
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
      app_role: ["admin", "gestor", "geral"],
    },
  },
} as const
