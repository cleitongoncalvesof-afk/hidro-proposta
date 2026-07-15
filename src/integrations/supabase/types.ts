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
      clientes: {
        Row: {
          bairro: string | null
          cep: string | null
          cnpj_cpf: string | null
          contato: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          inscricao_estadual: string | null
          municipio_uf: string | null
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cnpj_cpf?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          inscricao_estadual?: string | null
          municipio_uf?: string | null
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cnpj_cpf?: string | null
          contato?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          inscricao_estadual?: string | null
          municipio_uf?: string | null
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      empresa_config: {
        Row: {
          aliquota_padrao: number
          cidade_assinatura: string
          cnpj: string
          created_at: string
          dados_bancarios: string
          email: string
          endereco: string
          logo_url: string | null
          margem_padrao: number
          nome_fantasia: string
          proximo_numero_proposta: number
          razao_social: string
          responsavel: string
          site: string
          telefone: string
          texto_clausulas_cobranca: string
          texto_condicoes_pagamento_padrao: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aliquota_padrao?: number
          cidade_assinatura?: string
          cnpj?: string
          created_at?: string
          dados_bancarios?: string
          email?: string
          endereco?: string
          logo_url?: string | null
          margem_padrao?: number
          nome_fantasia?: string
          proximo_numero_proposta?: number
          razao_social?: string
          responsavel?: string
          site?: string
          telefone?: string
          texto_clausulas_cobranca?: string
          texto_condicoes_pagamento_padrao?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aliquota_padrao?: number
          cidade_assinatura?: string
          cnpj?: string
          created_at?: string
          dados_bancarios?: string
          email?: string
          endereco?: string
          logo_url?: string | null
          margem_padrao?: number
          nome_fantasia?: string
          proximo_numero_proposta?: number
          razao_social?: string
          responsavel?: string
          site?: string
          telefone?: string
          texto_clausulas_cobranca?: string
          texto_condicoes_pagamento_padrao?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orcamento_itens: {
        Row: {
          created_at: string
          custo_insumo_m2: number
          descricao: string
          id: string
          orcamento_id: string
          ordem: number
          quantidade_m2: number
          tipo_aplicacao_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          custo_insumo_m2?: number
          descricao: string
          id?: string
          orcamento_id: string
          ordem?: number
          quantidade_m2?: number
          tipo_aplicacao_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          custo_insumo_m2?: number
          descricao?: string
          id?: string
          orcamento_id?: string
          ordem?: number
          quantidade_m2?: number
          tipo_aplicacao_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_itens_tipo_aplicacao_id_fkey"
            columns: ["tipo_aplicacao_id"]
            isOneToOne: false
            referencedRelation: "tipos_aplicacao"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          alimentacao_diaria: number
          alimentacao_dias: number
          aliquota: number
          cliente_id: string | null
          combustivel_distancia_km: number
          combustivel_equipamento: number
          combustivel_equipamento_modo: string
          combustivel_km_l: number
          combustivel_modo: string
          combustivel_r_l: number
          condicoes_pagamento_customizadas: string | null
          created_at: string
          frete: number
          hospedagem_diaria: number
          hospedagem_qtd: number
          id: string
          mao_obra_diaria: number
          mao_obra_dias: number
          margem: number
          mobilizacoes_extras: number
          numero: number
          obra_descricao: string | null
          outras_despesas: number
          pdf_url: string | null
          proposta_tipo: Database["public"]["Enums"]["proposta_tipo"]
          status: Database["public"]["Enums"]["orcamento_status"]
          updated_at: string
          user_id: string
          valor_mobilizacao_adicional: number
        }
        Insert: {
          alimentacao_diaria?: number
          alimentacao_dias?: number
          aliquota?: number
          cliente_id?: string | null
          combustivel_distancia_km?: number
          combustivel_equipamento?: number
          combustivel_equipamento_modo?: string
          combustivel_km_l?: number
          combustivel_modo?: string
          combustivel_r_l?: number
          condicoes_pagamento_customizadas?: string | null
          created_at?: string
          frete?: number
          hospedagem_diaria?: number
          hospedagem_qtd?: number
          id?: string
          mao_obra_diaria?: number
          mao_obra_dias?: number
          margem?: number
          mobilizacoes_extras?: number
          numero: number
          obra_descricao?: string | null
          outras_despesas?: number
          pdf_url?: string | null
          proposta_tipo: Database["public"]["Enums"]["proposta_tipo"]
          status?: Database["public"]["Enums"]["orcamento_status"]
          updated_at?: string
          user_id: string
          valor_mobilizacao_adicional?: number
        }
        Update: {
          alimentacao_diaria?: number
          alimentacao_dias?: number
          aliquota?: number
          cliente_id?: string | null
          combustivel_distancia_km?: number
          combustivel_equipamento?: number
          combustivel_equipamento_modo?: string
          combustivel_km_l?: number
          combustivel_modo?: string
          combustivel_r_l?: number
          condicoes_pagamento_customizadas?: string | null
          created_at?: string
          frete?: number
          hospedagem_diaria?: number
          hospedagem_qtd?: number
          id?: string
          mao_obra_diaria?: number
          mao_obra_dias?: number
          margem?: number
          mobilizacoes_extras?: number
          numero?: number
          obra_descricao?: string | null
          outras_despesas?: number
          pdf_url?: string | null
          proposta_tipo?: Database["public"]["Enums"]["proposta_tipo"]
          status?: Database["public"]["Enums"]["orcamento_status"]
          updated_at?: string
          user_id?: string
          valor_mobilizacao_adicional?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      proposta_templates: {
        Row: {
          created_at: string
          despedida: string
          id: string
          texto_abertura: string
          texto_garantia: string
          texto_responsabilidade_contratante: string
          texto_termos: string
          tipo: Database["public"]["Enums"]["proposta_tipo"]
          updated_at: string
          usa_campo_obra: boolean
          usa_mobilizacao: boolean
          user_id: string
          validade_dias: number
          valor_mobilizacao_adicional_padrao: number
        }
        Insert: {
          created_at?: string
          despedida?: string
          id?: string
          texto_abertura: string
          texto_garantia: string
          texto_responsabilidade_contratante: string
          texto_termos: string
          tipo: Database["public"]["Enums"]["proposta_tipo"]
          updated_at?: string
          usa_campo_obra?: boolean
          usa_mobilizacao?: boolean
          user_id: string
          validade_dias?: number
          valor_mobilizacao_adicional_padrao?: number
        }
        Update: {
          created_at?: string
          despedida?: string
          id?: string
          texto_abertura?: string
          texto_garantia?: string
          texto_responsabilidade_contratante?: string
          texto_termos?: string
          tipo?: Database["public"]["Enums"]["proposta_tipo"]
          updated_at?: string
          usa_campo_obra?: boolean
          usa_mobilizacao?: boolean
          user_id?: string
          validade_dias?: number
          valor_mobilizacao_adicional_padrao?: number
        }
        Relationships: []
      }
      tipos_aplicacao: {
        Row: {
          created_at: string
          custo_padrao_m2: number
          descricao: string | null
          id: string
          litros_por_tanque: number
          nome: string
          preco_por_litro: number
          proposta_tipo: Database["public"]["Enums"]["proposta_tipo"]
          rendimento_medio_m2: number
          user_id: string
        }
        Insert: {
          created_at?: string
          custo_padrao_m2?: number
          descricao?: string | null
          id?: string
          litros_por_tanque?: number
          nome: string
          preco_por_litro?: number
          proposta_tipo: Database["public"]["Enums"]["proposta_tipo"]
          rendimento_medio_m2?: number
          user_id: string
        }
        Update: {
          created_at?: string
          custo_padrao_m2?: number
          descricao?: string | null
          id?: string
          litros_por_tanque?: number
          nome?: string
          preco_por_litro?: number
          proposta_tipo?: Database["public"]["Enums"]["proposta_tipo"]
          rendimento_medio_m2?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      next_orcamento_numero: { Args: { p_user_id: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "user"
      orcamento_status: "rascunho" | "enviado" | "aprovado" | "recusado"
      proposta_tipo: "grama_liquida" | "mix_sementes"
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
      app_role: ["admin", "user"],
      orcamento_status: ["rascunho", "enviado", "aprovado", "recusado"],
      proposta_tipo: ["grama_liquida", "mix_sementes"],
    },
  },
} as const
