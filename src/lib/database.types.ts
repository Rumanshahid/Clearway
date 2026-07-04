// Hand-written to match supabase/migrations/0001_init.sql.
// Regenerate with `supabase gen types typescript` once a live project exists.

export type PracticePlan = "pilot" | "practice" | "multi_site";
export type PatientStatus = "active" | "inactive" | "deceased";
export type DenialStatus = "open" | "appeal_filed" | "won" | "lost";
export type BillingStatus = "active" | "grace_period" | "suspended";
export type UserRole = "clinic_user" | "clinic_admin" | "super_admin";
export type RequestStatus = "draft" | "reviewed" | "submitted" | "approved" | "denied";
export type AuthoringMode = "doctor" | "patient";
export type LetterApproach = "RED_FLAG" | "CONSERVATIVE_CARE_EXHAUSTED" | "STANDARD";
export type DenialRisk = "LOW" | "MEDIUM" | "HIGH";

export interface LetterMeta {
  approachUsed: LetterApproach;
  redFlagsIdentified: string[];
  softWarnings: string[];
  denialRiskAssessment: DenialRisk;
  denialRiskReason: string;
}

export interface ClaimLetterMeta {
  letterType: string;
  isAdminIssue: boolean;
  softWarnings: string[];
  overturnLikelihood: DenialRisk;
  overturnReason: string;
}

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
          default_authoring_mode: AuthoringMode;
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
          member_id: string | null;
          cpt_code: string | null;
          authoring_mode: AuthoringMode;
          symptom_duration: string | null;
          case_fields: Record<string, unknown>;
          red_flags: string[];
          intended_use: string | null;
          ordering_physician_name: string;
          ordering_physician_credentials: string | null;
          patient_full_name: string | null;
          patient_dob: string | null;
          patient_address: string | null;
          patient_city_state_zip: string | null;
          patient_phone: string | null;
          insurance_group_number: string | null;
          ordering_physician_npi: string | null;
          ordering_physician_direct_phone: string | null;
          ordering_physician_specialty: string | null;
          ordering_physician_fax: string | null;
          plan_type: string | null;
          patient_id: string | null;
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
          sections: Record<string, { label: string; content: string }> | null;
          meta: LetterMeta | null;
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
      physicians: {
        Row: {
          id: string;
          practice_id: string;
          name: string;
          credentials: string | null;
          npi: string;
          direct_phone: string | null;
          specialty: string | null;
          fax: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["physicians"]["Row"]> & {
          practice_id: string;
          name: string;
          npi: string;
        };
        Update: Partial<Database["public"]["Tables"]["physicians"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "physicians_practice_id_fkey";
            columns: ["practice_id"];
            isOneToOne: false;
            referencedRelation: "practices";
            referencedColumns: ["id"];
          }
        ];
      };
      patients: {
        Row: {
          id: string;
          practice_id: string;
          patient_ref_id: string;
          status: PatientStatus;
          first_name: string;
          middle_name: string | null;
          last_name: string;
          dob: string;
          gender: string;
          ssn_last4: string | null;
          preferred_language: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          phone: string | null;
          mobile_phone: string | null;
          email: string | null;
          preferred_contact_method: string | null;
          best_time_to_call: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          emergency_contact_relationship: string | null;
          insurance_company: string | null;
          plan_type: string | null;
          state_of_plan: string | null;
          member_id: string | null;
          group_number: string | null;
          plan_name: string | null;
          effective_date: string | null;
          coverage_end_date: string | null;
          insurance_phone: string | null;
          insurance_pa_fax: string | null;
          has_secondary_insurance: boolean;
          secondary_insurance_company: string | null;
          secondary_plan_type: string | null;
          secondary_member_id: string | null;
          secondary_group_number: string | null;
          cob_order: string | null;
          usual_physician_id: string | null;
          primary_diagnosis_icd10: string | null;
          primary_diagnosis_description: string | null;
          known_drug_allergies: string | null;
          current_medications: string | null;
          consent_obtained: boolean;
          consent_date: string | null;
          consent_method: string | null;
          coordinator_notes: string | null;
          preferred_letter_author_mode: string | null;
          preferred_submission_method: string | null;
          special_handling_flags: string[];
          internal_tags: string[];
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["patients"]["Row"]> & {
          practice_id: string;
          first_name: string;
          last_name: string;
          dob: string;
          gender: string;
        };
        Update: Partial<Database["public"]["Tables"]["patients"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "patients_practice_id_fkey";
            columns: ["practice_id"];
            isOneToOne: false;
            referencedRelation: "practices";
            referencedColumns: ["id"];
          }
        ];
      };
      claim_denials: {
        Row: {
          id: string;
          practice_id: string;
          created_by: string;
          patient_id: string | null;
          pa_request_id: string | null;
          date_of_service: string | null;
          cpt_code: string | null;
          icd10_code: string | null;
          claim_number: string | null;
          amount_billed: number | null;
          amount_denied: number | null;
          amount_recovered: number | null;
          date_submitted: string | null;
          denial_date: string;
          denial_reason_code: string;
          denial_reason_description: string | null;
          payer: string | null;
          payer_claim_reference: string | null;
          pa_obtained: string | null;
          appeal_deadline: string | null;
          appeal_type: string | null;
          assigned_to: string | null;
          priority: string;
          status: DenialStatus;
          new_clinical_evidence: string | null;
          supporting_documentation: string | null;
          p2p_requested: boolean;
          filing_method: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["claim_denials"]["Row"]> & {
          practice_id: string;
          created_by: string;
          denial_date: string;
          denial_reason_code: string;
        };
        Update: Partial<Database["public"]["Tables"]["claim_denials"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "claim_denials_practice_id_fkey";
            columns: ["practice_id"];
            isOneToOne: false;
            referencedRelation: "practices";
            referencedColumns: ["id"];
          }
        ];
      };
      claim_appeal_letters: {
        Row: {
          id: string;
          claim_denial_id: string;
          content: string;
          sections: Record<string, { label: string; content: string }> | null;
          meta: ClaimLetterMeta | null;
          version: number;
          model: string | null;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["claim_appeal_letters"]["Row"]> & {
          claim_denial_id: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["claim_appeal_letters"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "claim_appeal_letters_claim_denial_id_fkey";
            columns: ["claim_denial_id"];
            isOneToOne: false;
            referencedRelation: "claim_denials";
            referencedColumns: ["id"];
          }
        ];
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
