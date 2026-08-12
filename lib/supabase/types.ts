// Hand-written to match supabase/migrations/*.sql. Regenerate with
// `supabase gen types typescript --linked` once the project is linked, and
// diff against this file if you do.

export type AtsType = "greenhouse" | "lever" | "ashby" | "workable" | "manual";
export type RemoteType = "onsite" | "hybrid" | "remote";
export type ProductType = "listing" | "featured";
export type OrderStatus = "pending" | "paid" | "failed" | "refunded";

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          website: string | null;
          logo_url: string | null;
          ats_type: AtsType;
          ats_identifier: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["companies"]["Row"]> & {
          name: string;
          slug: string;
          ats_type: AtsType;
        };
        Update: Partial<Database["public"]["Tables"]["companies"]["Row"]>;
      };
      jobs: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          slug: string;
          description_snippet: string | null;
          source_url: string;
          apply_url: string;
          location_raw: string | null;
          city: string | null;
          region: string | null;
          country: string | null;
          remote_type: RemoteType;
          salary_min: number | null;
          salary_max: number | null;
          salary_currency: string | null;
          salary_period: string | null;
          employment_type: string | null;
          posted_at: string;
          expires_at: string;
          source: string;
          external_id: string;
          is_featured: boolean;
          is_paid: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["jobs"]["Row"]> & {
          company_id: string;
          title: string;
          slug: string;
          source_url: string;
          apply_url: string;
          remote_type: RemoteType;
          source: string;
          external_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["jobs"]["Row"]>;
      };
      subscribers: {
        Row: {
          id: string;
          email: string;
          filters: Record<string, unknown>;
          confirm_token: string | null;
          confirmed_at: string | null;
          unsubscribed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["subscribers"]["Row"]> & {
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscribers"]["Row"]>;
      };
      orders: {
        Row: {
          id: string;
          stripe_session_id: string;
          stripe_payment_intent: string | null;
          job_id: string | null;
          employer_email: string;
          amount_cents: number;
          product: ProductType;
          status: OrderStatus;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]> & {
          stripe_session_id: string;
          employer_email: string;
          amount_cents: number;
          product: ProductType;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
      };
      import_runs: {
        Row: {
          id: string;
          source: string;
          started_at: string;
          finished_at: string | null;
          jobs_seen: number;
          jobs_created: number;
          jobs_updated: number;
          errors: string[];
          status: "running" | "success" | "failed";
        };
        Insert: Partial<Database["public"]["Tables"]["import_runs"]["Row"]> & {
          source: string;
        };
        Update: Partial<Database["public"]["Tables"]["import_runs"]["Row"]>;
      };
    };
  };
}
