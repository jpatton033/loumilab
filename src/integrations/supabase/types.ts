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
      admin_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["admin_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["admin_role"]
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_role: string | null
          created_at: string
          id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          reason: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          reason?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          reason?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          budget: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: Database["public"]["Enums"]["submission_status"]
          updated_at: string
        }
        Insert: {
          budget?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: Database["public"]["Enums"]["submission_status"]
          updated_at?: string
        }
        Update: {
          budget?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: Database["public"]["Enums"]["submission_status"]
          updated_at?: string
        }
        Relationships: []
      }
      custom_project_leads: {
        Row: {
          additional_notes: string | null
          attachment_paths: string[]
          budget_range: string | null
          build_goal: string
          business_name: string
          business_type: string | null
          contact_name: string
          created_at: string
          desired_features: string | null
          email: string
          existing_software: string | null
          existing_website: string | null
          id: string
          integrations_required: string | null
          internal_notes: string | null
          launch_timeframe: string | null
          location_count: string | null
          monthly_order_volume: string | null
          orders_account_email: string | null
          phone: string | null
          project_description: string
          status: Database["public"]["Enums"]["custom_lead_status"]
          storefront_url: string | null
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          attachment_paths?: string[]
          budget_range?: string | null
          build_goal: string
          business_name: string
          business_type?: string | null
          contact_name: string
          created_at?: string
          desired_features?: string | null
          email: string
          existing_software?: string | null
          existing_website?: string | null
          id?: string
          integrations_required?: string | null
          internal_notes?: string | null
          launch_timeframe?: string | null
          location_count?: string | null
          monthly_order_volume?: string | null
          orders_account_email?: string | null
          phone?: string | null
          project_description: string
          status?: Database["public"]["Enums"]["custom_lead_status"]
          storefront_url?: string | null
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          attachment_paths?: string[]
          budget_range?: string | null
          build_goal?: string
          business_name?: string
          business_type?: string | null
          contact_name?: string
          created_at?: string
          desired_features?: string | null
          email?: string
          existing_software?: string | null
          existing_website?: string | null
          id?: string
          integrations_required?: string | null
          internal_notes?: string | null
          launch_timeframe?: string | null
          location_count?: string | null
          monthly_order_volume?: string | null
          orders_account_email?: string | null
          phone?: string | null
          project_description?: string
          status?: Database["public"]["Enums"]["custom_lead_status"]
          storefront_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      hero_products: {
        Row: {
          accent_hsl: string
          attribution: string | null
          category: string | null
          created_at: string
          cta_primary_href: string | null
          cta_primary_label: string | null
          cta_secondary_href: string | null
          cta_secondary_label: string | null
          description: string
          desktop_image_url: string | null
          display_order: number
          eyebrow: string
          headline: string
          id: string
          is_active: boolean
          is_featured: boolean
          layout: string
          logo_text: string | null
          media_video_url: string | null
          mobile_image_url: string | null
          name: string
          nav_label: string
          slug: string
          treatment: string
          updated_at: string
        }
        Insert: {
          accent_hsl?: string
          attribution?: string | null
          category?: string | null
          created_at?: string
          cta_primary_href?: string | null
          cta_primary_label?: string | null
          cta_secondary_href?: string | null
          cta_secondary_label?: string | null
          description?: string
          desktop_image_url?: string | null
          display_order?: number
          eyebrow: string
          headline: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          layout?: string
          logo_text?: string | null
          media_video_url?: string | null
          mobile_image_url?: string | null
          name: string
          nav_label: string
          slug: string
          treatment?: string
          updated_at?: string
        }
        Update: {
          accent_hsl?: string
          attribution?: string | null
          category?: string | null
          created_at?: string
          cta_primary_href?: string | null
          cta_primary_label?: string | null
          cta_secondary_href?: string | null
          cta_secondary_label?: string | null
          description?: string
          desktop_image_url?: string | null
          display_order?: number
          eyebrow?: string
          headline?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          layout?: string
          logo_text?: string | null
          media_video_url?: string | null
          mobile_image_url?: string | null
          name?: string
          nav_label?: string
          slug?: string
          treatment?: string
          updated_at?: string
        }
        Relationships: []
      }
      kc_article_tags: {
        Row: {
          article_id: string
          tag_id: string
        }
        Insert: {
          article_id: string
          tag_id: string
        }
        Update: {
          article_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kc_article_tags_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "kc_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kc_article_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "kc_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      kc_article_views: {
        Row: {
          article_id: string
          created_at: string
          id: string
          viewer_hash: string | null
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          viewer_hash?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          viewer_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kc_article_views_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "kc_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      kc_articles: {
        Row: {
          author: string | null
          body: string
          created_at: string
          document_url: string | null
          hero_image_url: string | null
          id: string
          is_featured: boolean
          published_at: string | null
          read_minutes: number
          related_link_href: string | null
          related_link_label: string | null
          section_id: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["kc_article_status"]
          summary: string | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author?: string | null
          body?: string
          created_at?: string
          document_url?: string | null
          hero_image_url?: string | null
          id?: string
          is_featured?: boolean
          published_at?: string | null
          read_minutes?: number
          related_link_href?: string | null
          related_link_label?: string | null
          section_id: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["kc_article_status"]
          summary?: string | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author?: string | null
          body?: string
          created_at?: string
          document_url?: string | null
          hero_image_url?: string | null
          id?: string
          is_featured?: boolean
          published_at?: string | null
          read_minutes?: number
          related_link_href?: string | null
          related_link_label?: string | null
          section_id?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["kc_article_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "kc_articles_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "kc_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      kc_attachments: {
        Row: {
          article_id: string
          created_at: string
          file_type: string | null
          file_url: string
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          article_id: string
          created_at?: string
          file_type?: string | null
          file_url: string
          id?: string
          label: string
          sort_order?: number
        }
        Update: {
          article_id?: string
          created_at?: string
          file_type?: string | null
          file_url?: string
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "kc_attachments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "kc_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      kc_sections: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_visible: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_visible?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_visible?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      kc_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      merchant_stripe_accounts: {
        Row: {
          charges_enabled: boolean
          created_at: string
          details_submitted: boolean
          id: string
          last_synced_at: string | null
          livemode: boolean
          merchant_id: string
          payout_status: Database["public"]["Enums"]["payout_status"]
          payouts_enabled: boolean
          requirements_disabled_reason: string | null
          requirements_due: Json
          stripe_account_id: string
          updated_at: string
        }
        Insert: {
          charges_enabled?: boolean
          created_at?: string
          details_submitted?: boolean
          id?: string
          last_synced_at?: string | null
          livemode?: boolean
          merchant_id: string
          payout_status?: Database["public"]["Enums"]["payout_status"]
          payouts_enabled?: boolean
          requirements_disabled_reason?: string | null
          requirements_due?: Json
          stripe_account_id: string
          updated_at?: string
        }
        Update: {
          charges_enabled?: boolean
          created_at?: string
          details_submitted?: boolean
          id?: string
          last_synced_at?: string | null
          livemode?: boolean
          merchant_id?: string
          payout_status?: Database["public"]["Enums"]["payout_status"]
          payouts_enabled?: boolean
          requirements_disabled_reason?: string | null
          requirements_due?: Json
          stripe_account_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_stripe_accounts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          accepting_orders: boolean
          business_name: string
          business_type: string | null
          contact_email: string
          country: string
          created_at: string
          id: string
          owner_id: string
          phone: string | null
          plan_slug: string
          updated_at: string
        }
        Insert: {
          accepting_orders?: boolean
          business_name: string
          business_type?: string | null
          contact_email: string
          country?: string
          created_at?: string
          id?: string
          owner_id: string
          phone?: string | null
          plan_slug?: string
          updated_at?: string
        }
        Update: {
          accepting_orders?: boolean
          business_name?: string
          business_type?: string | null
          contact_email?: string
          country?: string
          created_at?: string
          id?: string
          owner_id?: string
          phone?: string | null
          plan_slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      orders_plan_fee_changes: {
        Row: {
          created_at: string
          created_by: string | null
          effective_from: string
          id: string
          new_fee_bps: number
          old_fee_bps: number | null
          plan_id: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          effective_from?: string
          id?: string
          new_fee_bps: number
          old_fee_bps?: number | null
          plan_id: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          effective_from?: string
          id?: string
          new_fee_bps?: number
          old_fee_bps?: number | null
          plan_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_plan_fee_changes_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "orders_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      orders_plans: {
        Row: {
          annual_billing_active: boolean
          annual_note: string | null
          annual_price_cents: number | null
          badge: string | null
          created_at: string
          cta_href: string | null
          cta_label: string
          cta_secondary_href: string | null
          cta_secondary_label: string | null
          description: string
          display_order: number
          effective_from: string
          entitlements: Json
          features: string[]
          fee_label: string | null
          id: string
          is_active: boolean
          is_public: boolean
          monthly_price_cents: number | null
          name: string
          platform_fee_bps: number | null
          positioning: string
          price_label: string | null
          requires_subscription: boolean
          slug: string
          stripe_price_annual_id: string | null
          stripe_price_monthly_id: string | null
          stripe_product_id: string | null
          updated_at: string
        }
        Insert: {
          annual_billing_active?: boolean
          annual_note?: string | null
          annual_price_cents?: number | null
          badge?: string | null
          created_at?: string
          cta_href?: string | null
          cta_label?: string
          cta_secondary_href?: string | null
          cta_secondary_label?: string | null
          description?: string
          display_order?: number
          effective_from?: string
          entitlements?: Json
          features?: string[]
          fee_label?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          monthly_price_cents?: number | null
          name: string
          platform_fee_bps?: number | null
          positioning?: string
          price_label?: string | null
          requires_subscription?: boolean
          slug: string
          stripe_price_annual_id?: string | null
          stripe_price_monthly_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Update: {
          annual_billing_active?: boolean
          annual_note?: string | null
          annual_price_cents?: number | null
          badge?: string | null
          created_at?: string
          cta_href?: string | null
          cta_label?: string
          cta_secondary_href?: string | null
          cta_secondary_label?: string | null
          description?: string
          display_order?: number
          effective_from?: string
          entitlements?: Json
          features?: string[]
          fee_label?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          monthly_price_cents?: number | null
          name?: string
          platform_fee_bps?: number | null
          positioning?: string
          price_label?: string | null
          requires_subscription?: boolean
          slug?: string
          stripe_price_annual_id?: string | null
          stripe_price_monthly_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          id: string
          key: string
          request_count: number
          window_start: string
        }
        Insert: {
          id?: string
          key: string
          request_count?: number
          window_start?: string
        }
        Update: {
          id?: string
          key?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          account_id: string | null
          created_at: string
          error: string | null
          id: string
          livemode: boolean
          payload: Json | null
          processed_at: string | null
          stripe_event_id: string
          type: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          livemode?: boolean
          payload?: Json | null
          processed_at?: string | null
          stripe_event_id: string
          type: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          livemode?: boolean
          payload?: Json | null
          processed_at?: string | null
          stripe_event_id?: string
          type?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_increment_rate_limit: {
        Args: { _key: string; _max_count: number; _window_seconds: number }
        Returns: boolean
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      has_admin_role: {
        Args: {
          _role: Database["public"]["Enums"]["admin_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_finance_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      kc_increment_view: {
        Args: { _slug: string; _viewer_hash: string }
        Returns: undefined
      }
      kc_section_counts: {
        Args: never
        Returns: {
          published_count: number
          section_slug: string
        }[]
      }
      newsletter_subscribe: {
        Args: { _email: string; _source: string }
        Returns: boolean
      }
    }
    Enums: {
      admin_role:
        | "super_admin"
        | "finance_admin"
        | "merchant_support"
        | "operations"
        | "analyst"
      app_role: "admin" | "moderator" | "user"
      custom_lead_status:
        | "new"
        | "contacted"
        | "discovery"
        | "proposal"
        | "approved"
        | "in_development"
        | "completed"
        | "declined"
      kc_article_status: "draft" | "published" | "archived"
      payout_status:
        | "not_started"
        | "onboarding"
        | "pending_verification"
        | "restricted"
        | "payout_enabled"
        | "disabled"
      submission_status: "new" | "read" | "responded" | "archived"
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
      admin_role: [
        "super_admin",
        "finance_admin",
        "merchant_support",
        "operations",
        "analyst",
      ],
      app_role: ["admin", "moderator", "user"],
      custom_lead_status: [
        "new",
        "contacted",
        "discovery",
        "proposal",
        "approved",
        "in_development",
        "completed",
        "declined",
      ],
      kc_article_status: ["draft", "published", "archived"],
      payout_status: [
        "not_started",
        "onboarding",
        "pending_verification",
        "restricted",
        "payout_enabled",
        "disabled",
      ],
      submission_status: ["new", "read", "responded", "archived"],
    },
  },
} as const
