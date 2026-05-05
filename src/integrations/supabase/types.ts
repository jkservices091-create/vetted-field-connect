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
      admin_notes: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          note: string
          target_id: string
          target_type: Database["public"]["Enums"]["admin_target_type"]
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          note: string
          target_id: string
          target_type: Database["public"]["Enums"]["admin_target_type"]
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          note?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["admin_target_type"]
        }
        Relationships: []
      }
      hiring_party_profiles: {
        Row: {
          about: string | null
          company_name: string
          company_type: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          payment_method_ref: string | null
          phone: string | null
          service_area: string | null
          suspended: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          about?: string | null
          company_name: string
          company_type?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          payment_method_ref?: string | null
          phone?: string | null
          service_area?: string | null
          suspended?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          about?: string | null
          company_name?: string
          company_type?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          payment_method_ref?: string | null
          phone?: string | null
          service_area?: string | null
          suspended?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          availability_confirmed: boolean
          created_at: string
          id: string
          job_id: string
          message: string | null
          proposed_amount: number
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          worker_profile_id: string
        }
        Insert: {
          availability_confirmed?: boolean
          created_at?: string
          id?: string
          job_id: string
          message?: string | null
          proposed_amount: number
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          worker_profile_id: string
        }
        Update: {
          availability_confirmed?: boolean
          created_at?: string
          id?: string
          job_id?: string
          message?: string | null
          proposed_amount?: number
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          worker_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_worker_profile_id_fkey"
            columns: ["worker_profile_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          accepted_worker_id: string | null
          address: string | null
          budget_amount: number
          budget_type: Database["public"]["Enums"]["budget_type"]
          category: string | null
          city: string | null
          created_at: string
          date_needed: string | null
          description: string | null
          estimated_duration_hours: number | null
          hiring_party_id: string
          id: string
          photos: string[] | null
          required_skills: string[] | null
          start_time: string | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
          workers_needed: number
        }
        Insert: {
          accepted_worker_id?: string | null
          address?: string | null
          budget_amount: number
          budget_type?: Database["public"]["Enums"]["budget_type"]
          category?: string | null
          city?: string | null
          created_at?: string
          date_needed?: string | null
          description?: string | null
          estimated_duration_hours?: number | null
          hiring_party_id: string
          id?: string
          photos?: string[] | null
          required_skills?: string[] | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
          workers_needed?: number
        }
        Update: {
          accepted_worker_id?: string | null
          address?: string | null
          budget_amount?: number
          budget_type?: Database["public"]["Enums"]["budget_type"]
          category?: string | null
          city?: string | null
          created_at?: string
          date_needed?: string | null
          description?: string | null
          estimated_duration_hours?: number | null
          hiring_party_id?: string
          id?: string
          photos?: string[] | null
          required_skills?: string[] | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
          workers_needed?: number
        }
        Relationships: [
          {
            foreignKeyName: "jobs_accepted_worker_id_fkey"
            columns: ["accepted_worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_hiring_party_id_fkey"
            columns: ["hiring_party_id"]
            isOneToOne: false
            referencedRelation: "hiring_party_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          created_at: string
          hiring_party_id: string
          id: string
          job_id: string
          last_message_at: string
          worker_profile_id: string
        }
        Insert: {
          created_at?: string
          hiring_party_id: string
          id?: string
          job_id: string
          last_message_at?: string
          worker_profile_id: string
        }
        Update: {
          created_at?: string
          hiring_party_id?: string
          id?: string
          job_id?: string
          last_message_at?: string
          worker_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_hiring_party_id_fkey"
            columns: ["hiring_party_id"]
            isOneToOne: false
            referencedRelation: "hiring_party_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_worker_profile_id_fkey"
            columns: ["worker_profile_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          created_at: string
          id: string
          passed: boolean | null
          quiz_id: string
          quiz_version: number
          score: number | null
          started_at: string
          submitted_at: string | null
          worker_profile_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          passed?: boolean | null
          quiz_id: string
          quiz_version: number
          score?: number | null
          started_at?: string
          submitted_at?: string | null
          worker_profile_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          passed?: boolean | null
          quiz_id?: string
          quiz_version?: number
          score?: number | null
          started_at?: string
          submitted_at?: string | null
          worker_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_worker_profile_id_fkey"
            columns: ["worker_profile_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          choice_a: string
          choice_b: string
          choice_c: string
          choice_d: string
          correct_choice: string
          created_at: string
          explanation: string | null
          id: string
          position: number
          prompt: string
          quiz_id: string
        }
        Insert: {
          choice_a: string
          choice_b: string
          choice_c: string
          choice_d: string
          correct_choice: string
          created_at?: string
          explanation?: string | null
          id?: string
          position: number
          prompt: string
          quiz_id: string
        }
        Update: {
          choice_a?: string
          choice_b?: string
          choice_c?: string
          choice_d?: string
          correct_choice?: string
          created_at?: string
          explanation?: string | null
          id?: string
          position?: number
          prompt?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          passing_score: number
          time_limit_minutes: number
          title: string
          total_questions: number
          trade_slug: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          passing_score?: number
          time_limit_minutes?: number
          title: string
          total_questions?: number
          trade_slug: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          passing_score?: number
          time_limit_minutes?: number
          title?: string
          total_questions?: number
          trade_slug?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      reviews: {
        Row: {
          communication_score: number | null
          created_at: string
          id: string
          job_id: string
          professionalism_score: number | null
          rating: number
          reliability_score: number | null
          reviewee_id: string
          reviewer_id: string
          reviewer_role: Database["public"]["Enums"]["reviewer_role"]
          text: string | null
        }
        Insert: {
          communication_score?: number | null
          created_at?: string
          id?: string
          job_id: string
          professionalism_score?: number | null
          rating: number
          reliability_score?: number | null
          reviewee_id: string
          reviewer_id: string
          reviewer_role: Database["public"]["Enums"]["reviewer_role"]
          text?: string | null
        }
        Update: {
          communication_score?: number | null
          created_at?: string
          id?: string
          job_id?: string
          professionalism_score?: number | null
          rating?: number
          reliability_score?: number | null
          reviewee_id?: string
          reviewer_id?: string
          reviewer_role?: Database["public"]["Enums"]["reviewer_role"]
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      verification_submissions: {
        Row: {
          admin_feedback: string | null
          background_check_consent: boolean
          created_at: string
          decision: Database["public"]["Enums"]["verification_decision"]
          id: string
          id_doc_url: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          situational_test_responses: Json | null
          submitted_at: string
          terms_accepted: boolean
          updated_at: string
          worker_profile_id: string
        }
        Insert: {
          admin_feedback?: string | null
          background_check_consent?: boolean
          created_at?: string
          decision?: Database["public"]["Enums"]["verification_decision"]
          id?: string
          id_doc_url?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          situational_test_responses?: Json | null
          submitted_at?: string
          terms_accepted?: boolean
          updated_at?: string
          worker_profile_id: string
        }
        Update: {
          admin_feedback?: string | null
          background_check_consent?: boolean
          created_at?: string
          decision?: Database["public"]["Enums"]["verification_decision"]
          id?: string
          id_doc_url?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          situational_test_responses?: Json | null
          submitted_at?: string
          terms_accepted?: boolean
          updated_at?: string
          worker_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_submissions_worker_profile_id_fkey"
            columns: ["worker_profile_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_profiles: {
        Row: {
          availability: Json | null
          bio: string | null
          city: string | null
          created_at: string
          id: string
          profile_photo_url: string | null
          service_radius_miles: number | null
          skills: string[] | null
          suspended: boolean
          transportation:
            | Database["public"]["Enums"]["transportation_type"]
            | null
          updated_at: string
          user_id: string
          vetting_status: Database["public"]["Enums"]["vetting_status"]
          work_history: Json | null
        }
        Insert: {
          availability?: Json | null
          bio?: string | null
          city?: string | null
          created_at?: string
          id?: string
          profile_photo_url?: string | null
          service_radius_miles?: number | null
          skills?: string[] | null
          suspended?: boolean
          transportation?:
            | Database["public"]["Enums"]["transportation_type"]
            | null
          updated_at?: string
          user_id: string
          vetting_status?: Database["public"]["Enums"]["vetting_status"]
          work_history?: Json | null
        }
        Update: {
          availability?: Json | null
          bio?: string | null
          city?: string | null
          created_at?: string
          id?: string
          profile_photo_url?: string | null
          service_radius_miles?: number | null
          skills?: string[] | null
          suspended?: boolean
          transportation?:
            | Database["public"]["Enums"]["transportation_type"]
            | null
          updated_at?: string
          user_id?: string
          vetting_status?: Database["public"]["Enums"]["vetting_status"]
          work_history?: Json | null
        }
        Relationships: []
      }
      worker_references: {
        Row: {
          company: string | null
          created_at: string
          id: string
          name: string
          phone: string
          relationship: string | null
          worker_profile_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          id?: string
          name: string
          phone: string
          relationship?: string | null
          worker_profile_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string
          relationship?: string | null
          worker_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_references_worker_profile_id_fkey"
            columns: ["worker_profile_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_trade_qualifications: {
        Row: {
          id: string
          passed_at: string
          quiz_version: number
          score: number
          trade_slug: string
          worker_profile_id: string
        }
        Insert: {
          id?: string
          passed_at?: string
          quiz_version: number
          score: number
          trade_slug: string
          worker_profile_id: string
        }
        Update: {
          id?: string
          passed_at?: string
          quiz_version?: number
          score?: number
          trade_slug?: string
          worker_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_trade_qualifications_worker_profile_id_fkey"
            columns: ["worker_profile_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      quiz_questions_public: {
        Row: {
          choice_a: string | null
          choice_b: string | null
          choice_c: string | null
          choice_d: string | null
          id: string | null
          position: number | null
          prompt: string | null
          quiz_id: string | null
        }
        Insert: {
          choice_a?: string | null
          choice_b?: string | null
          choice_c?: string | null
          choice_d?: string | null
          id?: string | null
          position?: number | null
          prompt?: string | null
          quiz_id?: string | null
        }
        Update: {
          choice_a?: string | null
          choice_b?: string | null
          choice_c?: string | null
          choice_d?: string | null
          id?: string | null
          position?: number | null
          prompt?: string | null
          quiz_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      admin_target_type: "worker" | "hiring_party" | "job"
      app_role: "hiring_party" | "worker" | "admin"
      application_status: "submitted" | "accepted" | "declined" | "withdrawn"
      budget_type: "hourly" | "flat"
      job_status: "draft" | "open" | "in_progress" | "completed" | "canceled"
      reviewer_role: "hiring_party" | "worker"
      transportation_type: "own_vehicle" | "public_transit" | "none"
      verification_decision:
        | "pending"
        | "approved"
        | "rejected"
        | "needs_more_info"
      vetting_status:
        | "applicant"
        | "pending_review"
        | "verified"
        | "verified_pro"
        | "rejected"
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
      admin_target_type: ["worker", "hiring_party", "job"],
      app_role: ["hiring_party", "worker", "admin"],
      application_status: ["submitted", "accepted", "declined", "withdrawn"],
      budget_type: ["hourly", "flat"],
      job_status: ["draft", "open", "in_progress", "completed", "canceled"],
      reviewer_role: ["hiring_party", "worker"],
      transportation_type: ["own_vehicle", "public_transit", "none"],
      verification_decision: [
        "pending",
        "approved",
        "rejected",
        "needs_more_info",
      ],
      vetting_status: [
        "applicant",
        "pending_review",
        "verified",
        "verified_pro",
        "rejected",
      ],
    },
  },
} as const
