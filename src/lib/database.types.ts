// Hand-written to match supabase/migrations/0001_init.sql.
// Regenerate with `supabase gen types typescript` once a live project exists.

export type PracticePlan = "pilot" | "practice" | "multi_site";
export type BillingStatus = "active" | "grace_period" | "suspended";
export type UserRole = "clinic_user" | "clinic_admin" | "super_admin";
export type RequestStatus = "draft" | "reviewed" | "submitted" | "approved" | "denied";

export interface Database {
  public: {
    Tables: {
      practices: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          npi: string | null;
          specialty: string | null;
          primary_payers: string[];
          staff_count: number | null;
          plan: PracticePlan;
          billing_status: BillingStatus;
          letters_included: number;
          letters_used_this_period: number;
          billing_period_start: string;
          paddle_customer_id: string | null;
          paddle_subscription_id: string | null;
          baa_accepted_at: string | null;
          baa_accepted_by: string | null;
          retention_months: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["practices"]["Row"]> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["practices"]["Row"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          practice_id: string | null;
          full_name: string | null;
          role: UserRole;
          flagged: boolean;
          flagged_reason: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "profiles_practice_id_fkey";
            columns: ["practice_id"];
            isOneToOne: false;
            referencedRelation: "practices";
            referencedColumns: ["id"];
          }
        ];
      };
      pa_requests: {
        Row: {
          id: string;
          practice_id: string;
          created_by: string;
          patient_reference: string;
          procedure_type: string;
          payer: string;
          icd10_codes: string[];
          symptom_duration: string | null;
          case_fields: Record<string, unknown>;
          red_flags: string[];
          intended_use: string | null;
          ordering_physician_name: string;
          ordering_physician_credentials: string | null;
          status: RequestStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["pa_requests"]["Row"]> & {
          practice_id: string;
          created_by: string;
          patient_reference: string;
          procedure_type: string;
          payer: string;
          ordering_physician_name: string;
        };
        Update: Partial<Database["public"]["Tables"]["pa_requests"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "pa_requests_practice_id_fkey";
            columns: ["practice_id"];
            isOneToOne: false;
            referencedRelation: "practices";
            referencedColumns: ["id"];
          }
        ];
      };
      letters: {
        Row: {
          id: string;
          pa_request_id: string;
          content: string;
          version: number;
          model: string | null;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["letters"]["Row"]> & {
          pa_request_id: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["letters"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "letters_pa_request_id_fkey";
            columns: ["pa_request_id"];
            isOneToOne: false;
            referencedRelation: "pa_requests";
            referencedColumns: ["id"];
          }
        ];
      };
      access_log: {
        Row: {
          id: number;
          user_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["access_log"]["Row"]> & {
          action: string;
          resource_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["access_log"]["Row"]>;
        Relationships: [];
      };
      billing_events: {
        Row: {
          id: number;
          practice_id: string | null;
          event_type: string;
          payload: Record<string, unknown>;
          occurred_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["billing_events"]["Row"]> & {
          event_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["billing_events"]["Row"]>;
        Relationships: [];
      };
      criteria: {
        Row: {
          id: string;
          key: string;
          label: string;
          required_fields: unknown;
          red_flags: unknown;
          aetna: string;
          evicore: string;
          sources: string;
          prompt_notes: string;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["criteria"]["Row"]> & {
          key: string;
          label: string;
        };
        Update: Partial<Database["public"]["Tables"]["criteria"]["Row"]>;
        Relationships: [];
      };
      procedure_payer_toggles: {
        Row: {
          procedure_key: string;
          payer_key: string;
          enabled: boolean;
        };
        Insert: Database["public"]["Tables"]["procedure_payer_toggles"]["Row"];
        Update: Partial<Database["public"]["Tables"]["procedure_payer_toggles"]["Row"]>;
        Relationships: [];
      };
      prompt_templates: {
        Row: {
          id: string;
          content: string;
          version: number;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["prompt_templates"]["Row"]> & {
          content: string;
          version: number;
        };
        Update: Partial<Database["public"]["Tables"]["prompt_templates"]["Row"]>;
        Relationships: [];
      };
      site_content: {
        Row: {
          key: string;
          value: string;
          visible: boolean;
          updated_at: string;
        };
        Insert: Database["public"]["Tables"]["site_content"]["Row"];
        Update: Partial<Database["public"]["Tables"]["site_content"]["Row"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          message: string;
          link: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          user_id: string;
          type: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
