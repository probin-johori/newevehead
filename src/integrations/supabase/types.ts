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
      activities: {
        Row: {
          created_at: string
          description: string
          event_id: string
          id: string
          link_text: string | null
          target: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          event_id: string
          id?: string
          link_text?: string | null
          target?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          event_id?: string
          id?: string
          link_text?: string | null
          target?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_event_access: {
        Row: {
          admin_id: string
          created_at: string
          event_id: string
          id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          event_id: string
          id?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          event_id?: string
          id?: string
        }
        Relationships: []
      }
      bill_edit_logs: {
        Row: {
          bill_id: string
          created_at: string
          field: string
          id: string
          new_value: string
          old_value: string
          user_id: string | null
        }
        Insert: {
          bill_id: string
          created_at?: string
          field: string
          id?: string
          new_value?: string
          old_value?: string
          user_id?: string | null
        }
        Update: {
          bill_id?: string
          created_at?: string
          field?: string
          id?: string
          new_value?: string
          old_value?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_edit_logs_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          advance_amount: number
          advance_status: string
          amount: number
          bill_file_url: string | null
          ca_approved_at: string | null
          ca_approved_by: string | null
          category: string | null
          dept_id: string | null
          dept_verified_at: string | null
          dept_verified_by: string | null
          description: string
          due_date: string | null
          event_id: string
          id: string
          invoice_file: string | null
          invoice_files: string[] | null
          invoice_number: string | null
          paid_date: string | null
          settled_at: string | null
          settled_by: string | null
          status: string
          submitted_at: string
          submitted_by: string | null
          vendor_name: string
        }
        Insert: {
          advance_amount?: number
          advance_status?: string
          amount?: number
          bill_file_url?: string | null
          ca_approved_at?: string | null
          ca_approved_by?: string | null
          category?: string | null
          dept_id?: string | null
          dept_verified_at?: string | null
          dept_verified_by?: string | null
          description?: string
          due_date?: string | null
          event_id: string
          id?: string
          invoice_file?: string | null
          invoice_files?: string[] | null
          invoice_number?: string | null
          paid_date?: string | null
          settled_at?: string | null
          settled_by?: string | null
          status?: string
          submitted_at?: string
          submitted_by?: string | null
          vendor_name?: string
        }
        Update: {
          advance_amount?: number
          advance_status?: string
          amount?: number
          bill_file_url?: string | null
          ca_approved_at?: string | null
          ca_approved_by?: string | null
          category?: string | null
          dept_id?: string | null
          dept_verified_at?: string | null
          dept_verified_by?: string | null
          description?: string
          due_date?: string | null
          event_id?: string
          id?: string
          invoice_file?: string | null
          invoice_files?: string[] | null
          invoice_number?: string | null
          paid_date?: string | null
          settled_at?: string | null
          settled_by?: string | null
          status?: string
          submitted_at?: string
          submitted_by?: string | null
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_dept_id_fkey"
            columns: ["dept_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          allocated_budget: number
          created_at: string
          event_id: string
          head_id: string | null
          id: string
          member_ids: string[] | null
          name: string
          notes: string
          spent: number
        }
        Insert: {
          allocated_budget?: number
          created_at?: string
          event_id: string
          head_id?: string | null
          id?: string
          member_ids?: string[] | null
          name: string
          notes?: string
          spent?: number
        }
        Update: {
          allocated_budget?: number
          created_at?: string
          event_id?: string
          head_id?: string | null
          id?: string
          member_ids?: string[] | null
          name?: string
          notes?: string
          spent?: number
        }
        Relationships: [
          {
            foreignKeyName: "departments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          dept_id: string | null
          description: string | null
          event_id: string
          file_size: string
          file_url: string
          folder: string
          id: string
          name: string
          uploaded_at: string
          uploaded_by: string | null
          visibility: string | null
        }
        Insert: {
          dept_id?: string | null
          description?: string | null
          event_id: string
          file_size?: string
          file_url?: string
          folder?: string
          id?: string
          name: string
          uploaded_at?: string
          uploaded_by?: string | null
          visibility?: string | null
        }
        Update: {
          dept_id?: string | null
          description?: string | null
          event_id?: string
          file_size?: string
          file_url?: string
          folder?: string
          id?: string
          name?: string
          uploaded_at?: string
          uploaded_by?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_dept_id_fkey"
            columns: ["dept_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string
          estimated_budget: number
          id: string
          image_url: string | null
          location: string
          name: string
          org_id: string
          poc_id: string | null
          setup_date: string | null
          start_date: string
          status: string
          teardown_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date?: string
          estimated_budget?: number
          id?: string
          image_url?: string | null
          location?: string
          name: string
          org_id: string
          poc_id?: string | null
          setup_date?: string | null
          start_date?: string
          status?: string
          teardown_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string
          estimated_budget?: number
          id?: string
          image_url?: string | null
          location?: string
          name?: string
          org_id?: string
          poc_id?: string | null
          setup_date?: string | null
          start_date?: string
          status?: string
          teardown_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link_to: string | null
          message: string
          read: boolean
          related_event_id: string | null
          related_task_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_to?: string | null
          message: string
          read?: boolean
          related_event_id?: string | null
          related_task_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link_to?: string | null
          message?: string
          read?: boolean
          related_event_id?: string | null
          related_task_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          id: string
          logo: string | null
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          logo?: string | null
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          logo?: string | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_color: string | null
          created_at: string | null
          dept_name: string | null
          email: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          avatar_color?: string | null
          created_at?: string | null
          dept_name?: string | null
          email?: string
          id: string
          name?: string
          phone?: string | null
        }
        Update: {
          avatar_color?: string | null
          created_at?: string | null
          dept_name?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      subtasks: {
        Row: {
          assignee_id: string | null
          completed: boolean
          created_at: string
          id: string
          priority: string | null
          status: string | null
          task_id: string
          title: string
        }
        Insert: {
          assignee_id?: string | null
          completed?: boolean
          created_at?: string
          id?: string
          priority?: string | null
          status?: string | null
          task_id: string
          title: string
        }
        Update: {
          assignee_id?: string | null
          completed?: boolean
          created_at?: string
          id?: string
          priority?: string | null
          status?: string | null
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          dept_id: string | null
          description: string
          event_id: string
          id: string
          labels: string[] | null
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          dept_id?: string | null
          description?: string
          event_id: string
          id?: string
          labels?: string[] | null
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          dept_id?: string | null
          description?: string
          event_id?: string
          id?: string
          labels?: string[] | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_dept_id_fkey"
            columns: ["dept_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          org_id?: string
          role?: string
          user_id?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      get_user_org_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
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
      app_role: "sa" | "org" | "dept_head" | "dept_member"
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
      app_role: ["sa", "org", "dept_head", "dept_member"],
    },
  },
} as const
