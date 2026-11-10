export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      analyses: {
        Row: {
          commit_sha: string | null;
          coverage: Json | null;
          created_at: string;
          created_by: string | null;
          error_message: string | null;
          error_stage: string | null;
          finished_at: string | null;
          id: string;
          organization_id: string;
          project_id: string;
          stage: string | null;
          stage_message: string | null;
          started_at: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          commit_sha?: string | null;
          coverage?: Json | null;
          created_at?: string;
          created_by?: string | null;
          error_message?: string | null;
          error_stage?: string | null;
          finished_at?: string | null;
          id?: string;
          organization_id: string;
          project_id: string;
          stage?: string | null;
          stage_message?: string | null;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          commit_sha?: string | null;
          coverage?: Json | null;
          created_at?: string;
          created_by?: string | null;
          error_message?: string | null;
          error_stage?: string | null;
          finished_at?: string | null;
          id?: string;
          organization_id?: string;
          project_id?: string;
          stage?: string | null;
          stage_message?: string | null;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "analyses_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analyses_project_id_organization_id_fkey";
            columns: ["project_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      edges: {
        Row: {
          analysis_id: string;
          created_at: string;
          from_file_id: string;
          id: string;
          is_type_only: boolean;
          kind: string;
          organization_id: string;
          specifier: string;
          to_file_id: string;
        };
        Insert: {
          analysis_id: string;
          created_at?: string;
          from_file_id: string;
          id?: string;
          is_type_only?: boolean;
          kind: string;
          organization_id: string;
          specifier?: string;
          to_file_id: string;
        };
        Update: {
          analysis_id?: string;
          created_at?: string;
          from_file_id?: string;
          id?: string;
          is_type_only?: boolean;
          kind?: string;
          organization_id?: string;
          specifier?: string;
          to_file_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "edges_analysis_id_organization_id_fkey";
            columns: ["analysis_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "analyses";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "edges_from_file_id_organization_id_fkey";
            columns: ["from_file_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "files";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "edges_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "edges_to_file_id_organization_id_fkey";
            columns: ["to_file_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "files";
            referencedColumns: ["id", "organization_id"];
          },
        ];
      };
      explanations: {
        Row: {
          analysis_id: string;
          cache_key: string;
          content: string;
          content_hash: string | null;
          created_at: string;
          file_id: string | null;
          id: string;
          model: string | null;
          organization_id: string;
          prompt_version: string | null;
          target_kind: string;
          target_path: string;
          updated_at: string;
        };
        Insert: {
          analysis_id: string;
          cache_key: string;
          content: string;
          content_hash?: string | null;
          created_at?: string;
          file_id?: string | null;
          id?: string;
          model?: string | null;
          organization_id: string;
          prompt_version?: string | null;
          target_kind: string;
          target_path: string;
          updated_at?: string;
        };
        Update: {
          analysis_id?: string;
          cache_key?: string;
          content?: string;
          content_hash?: string | null;
          created_at?: string;
          file_id?: string | null;
          id?: string;
          model?: string | null;
          organization_id?: string;
          prompt_version?: string | null;
          target_kind?: string;
          target_path?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "explanations_analysis_id_organization_id_fkey";
            columns: ["analysis_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "analyses";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "explanations_file_id_organization_id_fkey";
            columns: ["file_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "files";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "explanations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      file_roles: {
        Row: {
          analysis_id: string;
          created_at: string;
          file_id: string;
          id: string;
          organization_id: string;
          role: string;
          source: string;
        };
        Insert: {
          analysis_id: string;
          created_at?: string;
          file_id: string;
          id?: string;
          organization_id: string;
          role: string;
          source: string;
        };
        Update: {
          analysis_id?: string;
          created_at?: string;
          file_id?: string;
          id?: string;
          organization_id?: string;
          role?: string;
          source?: string;
        };
        Relationships: [
          {
            foreignKeyName: "file_roles_analysis_id_organization_id_fkey";
            columns: ["analysis_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "analyses";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "file_roles_file_id_organization_id_fkey";
            columns: ["file_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "files";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "file_roles_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      files: {
        Row: {
          analysis_id: string;
          content_hash: string | null;
          created_at: string;
          directory: string;
          extension: string | null;
          fan_in: number;
          fan_out: number;
          id: string;
          is_parsed: boolean;
          language: string | null;
          line_count: number;
          organization_id: string;
          path: string;
          skip_reason: string | null;
        };
        Insert: {
          analysis_id: string;
          content_hash?: string | null;
          created_at?: string;
          directory: string;
          extension?: string | null;
          fan_in?: number;
          fan_out?: number;
          id?: string;
          is_parsed?: boolean;
          language?: string | null;
          line_count?: number;
          organization_id: string;
          path: string;
          skip_reason?: string | null;
        };
        Update: {
          analysis_id?: string;
          content_hash?: string | null;
          created_at?: string;
          directory?: string;
          extension?: string | null;
          fan_in?: number;
          fan_out?: number;
          id?: string;
          is_parsed?: boolean;
          language?: string | null;
          line_count?: number;
          organization_id?: string;
          path?: string;
          skip_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "files_analysis_id_organization_id_fkey";
            columns: ["analysis_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "analyses";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "files_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      insights: {
        Row: {
          analysis_id: string;
          created_at: string;
          detail: string | null;
          file_ids: string[];
          id: string;
          kind: string;
          organization_id: string;
          sort_order: number;
          title: string;
        };
        Insert: {
          analysis_id: string;
          created_at?: string;
          detail?: string | null;
          file_ids?: string[];
          id?: string;
          kind: string;
          organization_id: string;
          sort_order?: number;
          title: string;
        };
        Update: {
          analysis_id?: string;
          created_at?: string;
          detail?: string | null;
          file_ids?: string[];
          id?: string;
          kind?: string;
          organization_id?: string;
          sort_order?: number;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "insights_analysis_id_organization_id_fkey";
            columns: ["analysis_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "analyses";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "insights_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          name: string;
          slug?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          created_at: string;
          created_by: string | null;
          default_branch: string | null;
          id: string;
          name: string;
          organization_id: string;
          repo_name: string | null;
          repo_owner: string | null;
          repo_url: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          default_branch?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          repo_name?: string | null;
          repo_owner?: string | null;
          repo_url: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          default_branch?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          repo_name?: string | null;
          repo_owner?: string | null;
          repo_url?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      routes: {
        Row: {
          analysis_id: string;
          created_at: string;
          file_id: string;
          framework: string | null;
          id: string;
          method: string;
          organization_id: string;
          path: string;
        };
        Insert: {
          analysis_id: string;
          created_at?: string;
          file_id: string;
          framework?: string | null;
          id?: string;
          method: string;
          organization_id: string;
          path: string;
        };
        Update: {
          analysis_id?: string;
          created_at?: string;
          file_id?: string;
          framework?: string | null;
          id?: string;
          method?: string;
          organization_id?: string;
          path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "routes_analysis_id_organization_id_fkey";
            columns: ["analysis_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "analyses";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "routes_file_id_organization_id_fkey";
            columns: ["file_id", "organization_id"];
            isOneToOne: false;
            referencedRelation: "files";
            referencedColumns: ["id", "organization_id"];
          },
          {
            foreignKeyName: "routes_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_organization_id: { Args: never; Returns: string };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
