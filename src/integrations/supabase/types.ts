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
      admin_email_attachments: {
        Row: {
          content_type: string | null
          created_at: string
          file_name: string
          id: string
          message_id: string
          size_bytes: number
          storage_path: string
          updated_at: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          file_name: string
          id?: string
          message_id: string
          size_bytes?: number
          storage_path: string
          updated_at?: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          file_name?: string
          id?: string
          message_id?: string
          size_bytes?: number
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_email_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "admin_email_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_email_messages: {
        Row: {
          bcc_addresses: string[]
          body_html: string
          body_text: string
          cc_addresses: string[]
          created_at: string
          direction: string
          display_name: string
          error_text: string | null
          id: string
          provider_message_id: string | null
          sent_at: string | null
          sent_by: string | null
          sent_by_email: string | null
          status: string
          subject: string
          template_id: string | null
          thread_id: string
          to_addresses: string[]
          updated_at: string
        }
        Insert: {
          bcc_addresses?: string[]
          body_html?: string
          body_text?: string
          cc_addresses?: string[]
          created_at?: string
          direction?: string
          display_name?: string
          error_text?: string | null
          id?: string
          provider_message_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          sent_by_email?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          thread_id?: string
          to_addresses?: string[]
          updated_at?: string
        }
        Update: {
          bcc_addresses?: string[]
          body_html?: string
          body_text?: string
          cc_addresses?: string[]
          created_at?: string
          direction?: string
          display_name?: string
          error_text?: string | null
          id?: string
          provider_message_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          sent_by_email?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          thread_id?: string
          to_addresses?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_email_messages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "admin_email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_email_signatures: {
        Row: {
          body_html: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body_html?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body_html?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_email_templates: {
        Row: {
          body_html: string
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          body_html?: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          subject?: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      app_user_connections: {
        Row: {
          connection_key_ciphertext: string
          connector_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_key_ciphertext: string
          connector_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_key_ciphertext?: string
          connector_id?: string
          created_at?: string
          id?: string
          updated_at?: string
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
          service: string | null
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
          service?: string | null
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
          service?: string | null
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
      custom_project_upload_slots: {
        Row: {
          created_at: string
          folder: string
        }
        Insert: {
          created_at?: string
          folder?: string
        }
        Update: {
          created_at?: string
          folder?: string
        }
        Relationships: []
      }
      dot_issue_templates: {
        Row: {
          content: Json
          created_at: string
          id: string
          name: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      dot_issues: {
        Row: {
          closing_thought: string | null
          content_format: string
          cover_image_url: string | null
          created_at: string
          editors_note: string | null
          emailed_at: string | null
          emailed_count: number
          id: string
          issue_month: string | null
          issue_number: number
          product_update: string | null
          published_at: string | null
          resource_links: Json
          short_stories: Json
          slug: string
          status: string
          story_body: string | null
          story_title: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          closing_thought?: string | null
          content_format?: string
          cover_image_url?: string | null
          created_at?: string
          editors_note?: string | null
          emailed_at?: string | null
          emailed_count?: number
          id?: string
          issue_month?: string | null
          issue_number: number
          product_update?: string | null
          published_at?: string | null
          resource_links?: Json
          short_stories?: Json
          slug: string
          status?: string
          story_body?: string | null
          story_title?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          closing_thought?: string | null
          content_format?: string
          cover_image_url?: string | null
          created_at?: string
          editors_note?: string | null
          emailed_at?: string | null
          emailed_count?: number
          id?: string
          issue_month?: string | null
          issue_number?: number
          product_update?: string | null
          published_at?: string | null
          resource_links?: Json
          short_stories?: Json
          slug?: string
          status?: string
          story_body?: string | null
          story_title?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_provider_prices: {
        Row: {
          active: boolean
          billing_note: string
          checked_on: string
          key: string
          monthly_available: boolean
          monthly_cents: number
          per_user: boolean
          plan_name: string
          provider: string
          sort: number
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          billing_note?: string
          checked_on?: string
          key: string
          monthly_available?: boolean
          monthly_cents: number
          per_user?: boolean
          plan_name: string
          provider: string
          sort?: number
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          billing_note?: string
          checked_on?: string
          key?: string
          monthly_available?: boolean
          monthly_cents?: number
          per_user?: boolean
          plan_name?: string
          provider?: string
          sort?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_setup_adjustments: {
        Row: {
          amount_cents: number
          change_set_id: string
          created_at: string
          created_by: string | null
          customer_note: string | null
          id: string
          kind: string
          label: string
          quantity: number
          reason: string
          request_id: string
          unit_cents: number
        }
        Insert: {
          amount_cents: number
          change_set_id: string
          created_at?: string
          created_by?: string | null
          customer_note?: string | null
          id?: string
          kind: string
          label: string
          quantity?: number
          reason: string
          request_id: string
          unit_cents: number
        }
        Update: {
          amount_cents?: number
          change_set_id?: string
          created_at?: string
          created_by?: string | null
          customer_note?: string | null
          id?: string
          kind?: string
          label?: string
          quantity?: number
          reason?: string
          request_id?: string
          unit_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "email_setup_adjustments_change_set_id_fkey"
            columns: ["change_set_id"]
            isOneToOne: false
            referencedRelation: "email_setup_change_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_setup_adjustments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "email_setup_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      email_setup_change_sets: {
        Row: {
          amount_due_cents: number
          canceled_at: string | null
          created_at: string
          created_by: string | null
          credit_cents: number
          customer_reason: string
          decided_at: string | null
          devices_to: number | null
          id: string
          internal_note: string | null
          mailboxes_to: number | null
          package_from: string
          package_to: string
          paid_at: string | null
          paid_before_cents: number
          request_id: string
          sent_count: number
          status: string
          stripe_session_id: string | null
          third_party_delta_cents: number
          total_after_cents: number
          total_before_cents: number
        }
        Insert: {
          amount_due_cents: number
          canceled_at?: string | null
          created_at?: string
          created_by?: string | null
          credit_cents?: number
          customer_reason: string
          decided_at?: string | null
          devices_to?: number | null
          id?: string
          internal_note?: string | null
          mailboxes_to?: number | null
          package_from: string
          package_to: string
          paid_at?: string | null
          paid_before_cents: number
          request_id: string
          sent_count?: number
          status?: string
          stripe_session_id?: string | null
          third_party_delta_cents?: number
          total_after_cents: number
          total_before_cents: number
        }
        Update: {
          amount_due_cents?: number
          canceled_at?: string | null
          created_at?: string
          created_by?: string | null
          credit_cents?: number
          customer_reason?: string
          decided_at?: string | null
          devices_to?: number | null
          id?: string
          internal_note?: string | null
          mailboxes_to?: number | null
          package_from?: string
          package_to?: string
          paid_at?: string | null
          paid_before_cents?: number
          request_id?: string
          sent_count?: number
          status?: string
          stripe_session_id?: string | null
          third_party_delta_cents?: number
          total_after_cents?: number
          total_before_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "email_setup_change_sets_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "email_setup_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      email_setup_events: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          kind: string
          request_id: string
          visible_to_customer: boolean
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          kind: string
          request_id: string
          visible_to_customer?: boolean
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          kind?: string
          request_id?: string
          visible_to_customer?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "email_setup_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "email_setup_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      email_setup_mgmt_checks: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kind: string
          notes: string | null
          request_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          notes?: string | null
          request_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          notes?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_setup_mgmt_checks_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "email_setup_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      email_setup_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          request_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          request_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_setup_notes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "email_setup_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      email_setup_notifications: {
        Row: {
          kind: string
          request_id: string
          sent_at: string
        }
        Insert: {
          kind: string
          request_id: string
          sent_at?: string
        }
        Update: {
          kind?: string
          request_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_setup_notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "email_setup_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      email_setup_payments: {
        Row: {
          amount_cents: number
          change_set_id: string | null
          created_at: string
          id: string
          kind: string
          request_id: string
          stripe_payment_intent_id: string | null
          stripe_ref: string
        }
        Insert: {
          amount_cents: number
          change_set_id?: string | null
          created_at?: string
          id?: string
          kind: string
          request_id: string
          stripe_payment_intent_id?: string | null
          stripe_ref: string
        }
        Update: {
          amount_cents?: number
          change_set_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          request_id?: string
          stripe_payment_intent_id?: string | null
          stripe_ref?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_setup_payments_change_set_id_fkey"
            columns: ["change_set_id"]
            isOneToOne: false
            referencedRelation: "email_setup_change_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_setup_payments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "email_setup_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      email_setup_purchases: {
        Row: {
          amount_cents: number
          commitment: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          kind: string
          purchased_on: string
          reference: string | null
          renews_on: string | null
          request_id: string
          vendor: string
        }
        Insert: {
          amount_cents: number
          commitment?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          kind: string
          purchased_on: string
          reference?: string | null
          renews_on?: string | null
          request_id: string
          vendor: string
        }
        Update: {
          amount_cents?: number
          commitment?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          kind?: string
          purchased_on?: string
          reference?: string | null
          renews_on?: string | null
          request_id?: string
          vendor?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_setup_purchases_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "email_setup_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      email_setup_requests: {
        Row: {
          access_token_hash: string
          business_name: string
          checklist: Json
          completed_at: string | null
          completion_record: Json | null
          contact_email: string
          created_at: string
          customer_action_message: string | null
          extra_devices: number
          fulfillment_stage: string
          full_name: string
          handoff: Json
          handoff_customer_actions: string | null
          handoff_manual_review: boolean
          id: string
          intake: Json
          mailboxes: number
          management_consent_at: string | null
          management_plan: string | null
          management_status: string
          management_subscription_id: string | null
          needs_review: boolean
          package: string
          paid_at: string | null
          paid_cents: number | null
          payment_status: string
          phone: string | null
          price_lines: Json
          primary_address: string | null
          provider: string
          provider_plan: string | null
          purchase_auth: Json | null
          purchase_auth_at: string | null
          purchase_mode: string
          quote_cents: number | null
          quote_note: string | null
          request_number: string
          review_reasons: string[]
          service_status: string
          standalone_domain: boolean
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          third_party_ack_at: string | null
          third_party_budget_cents: number
          third_party_lines: Json
          third_party_snapshot: Json | null
          total_cents: number
          updated_at: string
        }
        Insert: {
          access_token_hash: string
          business_name: string
          checklist?: Json
          completed_at?: string | null
          completion_record?: Json | null
          contact_email: string
          created_at?: string
          customer_action_message?: string | null
          extra_devices?: number
          fulfillment_stage?: string
          full_name: string
          handoff?: Json
          handoff_customer_actions?: string | null
          handoff_manual_review?: boolean
          id?: string
          intake?: Json
          mailboxes?: number
          management_consent_at?: string | null
          management_plan?: string | null
          management_status?: string
          management_subscription_id?: string | null
          needs_review?: boolean
          package: string
          paid_at?: string | null
          paid_cents?: number | null
          payment_status?: string
          phone?: string | null
          price_lines?: Json
          primary_address?: string | null
          provider: string
          provider_plan?: string | null
          purchase_auth?: Json | null
          purchase_auth_at?: string | null
          purchase_mode?: string
          quote_cents?: number | null
          quote_note?: string | null
          request_number?: string
          review_reasons?: string[]
          service_status?: string
          standalone_domain?: boolean
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          third_party_ack_at?: string | null
          third_party_budget_cents?: number
          third_party_lines?: Json
          third_party_snapshot?: Json | null
          total_cents?: number
          updated_at?: string
        }
        Update: {
          access_token_hash?: string
          business_name?: string
          checklist?: Json
          completed_at?: string | null
          completion_record?: Json | null
          contact_email?: string
          created_at?: string
          customer_action_message?: string | null
          extra_devices?: number
          fulfillment_stage?: string
          full_name?: string
          handoff?: Json
          handoff_customer_actions?: string | null
          handoff_manual_review?: boolean
          id?: string
          intake?: Json
          mailboxes?: number
          management_consent_at?: string | null
          management_plan?: string | null
          management_status?: string
          management_subscription_id?: string | null
          needs_review?: boolean
          package?: string
          paid_at?: string | null
          paid_cents?: number | null
          payment_status?: string
          phone?: string | null
          price_lines?: Json
          primary_address?: string | null
          provider?: string
          provider_plan?: string | null
          purchase_auth?: Json | null
          purchase_auth_at?: string | null
          purchase_mode?: string
          quote_cents?: number | null
          quote_note?: string | null
          request_number?: string
          review_reasons?: string[]
          service_status?: string
          standalone_domain?: boolean
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          third_party_ack_at?: string | null
          third_party_budget_cents?: number
          third_party_lines?: Json
          third_party_snapshot?: Json | null
          total_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
          canonical_url: string | null
          created_at: string
          document_url: string | null
          focus_keyword: string | null
          hero_image_url: string | null
          id: string
          is_featured: boolean
          noindex: boolean
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
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
          canonical_url?: string | null
          created_at?: string
          document_url?: string | null
          focus_keyword?: string | null
          hero_image_url?: string | null
          id?: string
          is_featured?: boolean
          noindex?: boolean
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
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
          canonical_url?: string | null
          created_at?: string
          document_url?: string | null
          focus_keyword?: string | null
          hero_image_url?: string | null
          id?: string
          is_featured?: boolean
          noindex?: boolean
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
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
      local_candidates: {
        Row: {
          affiliation_note: string | null
          batch_id: string | null
          business_name: string | null
          category: string | null
          city: string | null
          created_at: string
          created_by: string | null
          cuisines: string[]
          description: string | null
          dup_decision: string | null
          hours_text: string | null
          id: string
          idempotency_key: string | null
          is_sample: boolean
          market_id: string | null
          match_candidate_id: string | null
          match_kind: string | null
          match_profile_id: string | null
          name_key: string | null
          observed_at: string | null
          offers_delivery: boolean | null
          offers_pickup: boolean | null
          phone_norm: string | null
          postal_code: string | null
          public_email: string | null
          public_phone: string | null
          published_profile_id: string | null
          region: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_area: string | null
          social_links: Json
          source_type: string | null
          source_url: string | null
          status: string
          submitter_affiliation: string | null
          submitter_email: string | null
          submitter_name: string | null
          updated_at: string
          website_domain: string | null
          website_url: string | null
        }
        Insert: {
          affiliation_note?: string | null
          batch_id?: string | null
          business_name?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          cuisines?: string[]
          description?: string | null
          dup_decision?: string | null
          hours_text?: string | null
          id?: string
          idempotency_key?: string | null
          is_sample?: boolean
          market_id?: string | null
          match_candidate_id?: string | null
          match_kind?: string | null
          match_profile_id?: string | null
          name_key?: string | null
          observed_at?: string | null
          offers_delivery?: boolean | null
          offers_pickup?: boolean | null
          phone_norm?: string | null
          postal_code?: string | null
          public_email?: string | null
          public_phone?: string | null
          published_profile_id?: string | null
          region?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_area?: string | null
          social_links?: Json
          source_type?: string | null
          source_url?: string | null
          status?: string
          submitter_affiliation?: string | null
          submitter_email?: string | null
          submitter_name?: string | null
          updated_at?: string
          website_domain?: string | null
          website_url?: string | null
        }
        Update: {
          affiliation_note?: string | null
          batch_id?: string | null
          business_name?: string | null
          category?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          cuisines?: string[]
          description?: string | null
          dup_decision?: string | null
          hours_text?: string | null
          id?: string
          idempotency_key?: string | null
          is_sample?: boolean
          market_id?: string | null
          match_candidate_id?: string | null
          match_kind?: string | null
          match_profile_id?: string | null
          name_key?: string | null
          observed_at?: string | null
          offers_delivery?: boolean | null
          offers_pickup?: boolean | null
          phone_norm?: string | null
          postal_code?: string | null
          public_email?: string | null
          public_phone?: string | null
          published_profile_id?: string | null
          region?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_area?: string | null
          social_links?: Json
          source_type?: string | null
          source_url?: string | null
          status?: string
          submitter_affiliation?: string | null
          submitter_email?: string | null
          submitter_name?: string | null
          updated_at?: string
          website_domain?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "local_candidates_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "local_import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_candidates_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "local_markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_candidates_match_candidate_id_fkey"
            columns: ["match_candidate_id"]
            isOneToOne: false
            referencedRelation: "local_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_candidates_match_profile_id_fkey"
            columns: ["match_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_local_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_candidates_published_profile_id_fkey"
            columns: ["published_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_local_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      local_claims: {
        Row: {
          contact_name: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_notes: string | null
          evidence: string | null
          id: string
          profile_id: string
          role: string | null
          status: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          contact_name: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          evidence?: string | null
          id?: string
          profile_id: string
          role?: string | null
          status?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          contact_name?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          evidence?: string | null
          id?: string
          profile_id?: string
          role?: string | null
          status?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "local_claims_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_local_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      local_field_evidence: {
        Row: {
          candidate_id: string
          created_at: string
          excerpt: string | null
          expires_at: string | null
          field: string
          id: string
          method: string
          quality: string
          retrieved_at: string
          source_url: string | null
          value: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string
          excerpt?: string | null
          expires_at?: string | null
          field: string
          id?: string
          method?: string
          quality?: string
          retrieved_at?: string
          source_url?: string | null
          value?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string
          excerpt?: string | null
          expires_at?: string | null
          field?: string
          id?: string
          method?: string
          quality?: string
          retrieved_at?: string
          source_url?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "local_field_evidence_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "local_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      local_import_batches: {
        Row: {
          created_at: string
          created_by: string | null
          file_hash: string | null
          filename: string | null
          id: string
          kind: string
          market_id: string | null
          row_count: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_hash?: string | null
          filename?: string | null
          id?: string
          kind: string
          market_id?: string | null
          row_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_hash?: string | null
          filename?: string | null
          id?: string
          kind?: string
          market_id?: string | null
          row_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "local_import_batches_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "local_markets"
            referencedColumns: ["id"]
          },
        ]
      }
      local_importer_settings: {
        Row: {
          credits_used_week: number
          csv_max_rows: number
          daily_page_limit: number
          dispatch_paused: boolean
          evidence_retention_days: number
          freshness_days: number
          freshness_enabled: boolean
          id: number
          kill_switch: boolean
          max_domains_per_batch: number
          max_pages_per_domain: number
          min_delay_seconds: number
          pages_used_today: number
          provider_retention_days: number
          recrawl_cooldown_days: number
          updated_at: string
          usage_date: string
          usage_week: string | null
          weekly_credit_limit: number
        }
        Insert: {
          credits_used_week?: number
          csv_max_rows?: number
          daily_page_limit?: number
          dispatch_paused?: boolean
          evidence_retention_days?: number
          freshness_days?: number
          freshness_enabled?: boolean
          id?: number
          kill_switch?: boolean
          max_domains_per_batch?: number
          max_pages_per_domain?: number
          min_delay_seconds?: number
          pages_used_today?: number
          provider_retention_days?: number
          recrawl_cooldown_days?: number
          updated_at?: string
          usage_date?: string
          usage_week?: string | null
          weekly_credit_limit?: number
        }
        Update: {
          credits_used_week?: number
          csv_max_rows?: number
          daily_page_limit?: number
          dispatch_paused?: boolean
          evidence_retention_days?: number
          freshness_days?: number
          freshness_enabled?: boolean
          id?: number
          kill_switch?: boolean
          max_domains_per_batch?: number
          max_pages_per_domain?: number
          min_delay_seconds?: number
          pages_used_today?: number
          provider_retention_days?: number
          recrawl_cooldown_days?: number
          updated_at?: string
          usage_date?: string
          usage_week?: string | null
          weekly_credit_limit?: number
        }
        Relationships: []
      }
      local_jobs: {
        Row: {
          attempts: number
          batch_id: string | null
          candidate_id: string | null
          created_at: string
          id: string
          idempotency_key: string | null
          kind: string
          last_error: string | null
          lease_until: string | null
          max_pages: number
          next_attempt_at: string
          state: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          batch_id?: string | null
          candidate_id?: string | null
          created_at?: string
          id?: string
          idempotency_key?: string | null
          kind?: string
          last_error?: string | null
          lease_until?: string | null
          max_pages?: number
          next_attempt_at?: string
          state?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          batch_id?: string | null
          candidate_id?: string | null
          created_at?: string
          id?: string
          idempotency_key?: string | null
          kind?: string
          last_error?: string | null
          lease_until?: string | null
          max_pages?: number
          next_attempt_at?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "local_jobs_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "local_import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "local_jobs_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "local_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      local_markets: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          state: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          state?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          state?: string
        }
        Relationships: []
      }
      local_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_notes: string | null
          email: string
          id: string
          kind: string
          message: string
          name: string | null
          profile_id: string | null
          profile_slug: string | null
          status: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          email: string
          id?: string
          kind: string
          message: string
          name?: string | null
          profile_id?: string | null
          profile_slug?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          email?: string
          id?: string
          kind?: string
          message?: string
          name?: string | null
          profile_id?: string | null
          profile_slug?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "local_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_local_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      local_sources: {
        Row: {
          allowed_paths: string[]
          created_at: string
          domain: string
          excluded_paths: string[]
          id: string
          min_delay_seconds: number
          notes: string | null
          permitted_fields: string[]
          reviewed_at: string | null
          reviewed_by: string | null
          source_type: string
          status: string
          updated_at: string
          usage_evidence: string | null
        }
        Insert: {
          allowed_paths?: string[]
          created_at?: string
          domain: string
          excluded_paths?: string[]
          id?: string
          min_delay_seconds?: number
          notes?: string | null
          permitted_fields?: string[]
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_type?: string
          status?: string
          updated_at?: string
          usage_evidence?: string | null
        }
        Update: {
          allowed_paths?: string[]
          created_at?: string
          domain?: string
          excluded_paths?: string[]
          id?: string
          min_delay_seconds?: number
          notes?: string | null
          permitted_fields?: string[]
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_type?: string
          status?: string
          updated_at?: string
          usage_evidence?: string | null
        }
        Relationships: []
      }
      local_suppressions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          key: string
          kind: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          key: string
          kind: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          key?: string
          kind?: string
          reason?: string | null
        }
        Relationships: []
      }
      merchant_agreements: {
        Row: {
          accepted_at: string
          created_at: string
          document: string
          id: string
          merchant_id: string | null
          user_id: string
          version: string
        }
        Insert: {
          accepted_at?: string
          created_at?: string
          document: string
          id?: string
          merchant_id?: string | null
          user_id: string
          version: string
        }
        Update: {
          accepted_at?: string
          created_at?: string
          document?: string
          id?: string
          merchant_id?: string | null
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_agreements_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_calendar_links: {
        Row: {
          account_email: string | null
          calendar_id: string | null
          calendar_name: string | null
          created_at: string
          id: string
          merchant_id: string
          provider: string
          reconnect_required: boolean
          updated_at: string
        }
        Insert: {
          account_email?: string | null
          calendar_id?: string | null
          calendar_name?: string | null
          created_at?: string
          id?: string
          merchant_id: string
          provider: string
          reconnect_required?: boolean
          updated_at?: string
        }
        Update: {
          account_email?: string | null
          calendar_id?: string | null
          calendar_name?: string | null
          created_at?: string
          id?: string
          merchant_id?: string
          provider?: string
          reconnect_required?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_calendar_links_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          merchant_id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          merchant_id: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          merchant_id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_customers_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_invoices: {
        Row: {
          amount_cents: number
          created_at: string
          due_at: string | null
          fee_breakdown: Json | null
          fee_refunded_cents: number
          fee_schedule_id: string | null
          fee_volume_start_cents: number | null
          id: string
          job_id: string | null
          kind: string
          merchant_id: string
          paid_at: string | null
          platform_fee_bps: number | null
          platform_fee_cents: number | null
          public_token: string
          quote_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          due_at?: string | null
          fee_breakdown?: Json | null
          fee_refunded_cents?: number
          fee_schedule_id?: string | null
          fee_volume_start_cents?: number | null
          id?: string
          job_id?: string | null
          kind?: string
          merchant_id: string
          paid_at?: string | null
          platform_fee_bps?: number | null
          platform_fee_cents?: number | null
          public_token?: string
          quote_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          due_at?: string | null
          fee_breakdown?: Json | null
          fee_refunded_cents?: number
          fee_schedule_id?: string | null
          fee_volume_start_cents?: number | null
          id?: string
          job_id?: string | null
          kind?: string
          merchant_id?: string
          paid_at?: string | null
          platform_fee_bps?: number | null
          platform_fee_cents?: number | null
          public_token?: string
          quote_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "merchant_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_invoices_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "merchant_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_job_calendar_events: {
        Row: {
          attempts: number
          external_event_id: string | null
          id: string
          job_id: string
          last_error: string | null
          merchant_id: string
          provider: string
          sync_status: string
          synced_at: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          external_event_id?: string | null
          id?: string
          job_id: string
          last_error?: string | null
          merchant_id: string
          provider: string
          sync_status?: string
          synced_at?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          external_event_id?: string | null
          id?: string
          job_id?: string
          last_error?: string | null
          merchant_id?: string
          provider?: string
          sync_status?: string
          synced_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_job_calendar_events_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "merchant_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_job_calendar_events_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_jobs: {
        Row: {
          attachment_paths: string[]
          created_at: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_notes: string | null
          customer_phone: string | null
          id: string
          internal_notes: string | null
          merchant_id: string
          problem_description: string | null
          reference: string | null
          scheduled_for: string | null
          scheduled_window: string | null
          service_address: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          total_cents: number | null
          updated_at: string
        }
        Insert: {
          attachment_paths?: string[]
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_notes?: string | null
          customer_phone?: string | null
          id?: string
          internal_notes?: string | null
          merchant_id: string
          problem_description?: string | null
          reference?: string | null
          scheduled_for?: string | null
          scheduled_window?: string | null
          service_address?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          total_cents?: number | null
          updated_at?: string
        }
        Update: {
          attachment_paths?: string[]
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_notes?: string | null
          customer_phone?: string | null
          id?: string
          internal_notes?: string | null
          merchant_id?: string
          problem_description?: string | null
          reference?: string | null
          scheduled_for?: string | null
          scheduled_window?: string | null
          service_address?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          total_cents?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "merchant_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_jobs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_jobs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "merchant_services"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_local_profiles: {
        Row: {
          category: string | null
          city: string | null
          created_at: string
          cuisines: string[]
          display_name: string | null
          featured_image_url: string | null
          featured_rank: number
          gallery_urls: string[]
          hours_text: string | null
          id: string
          is_featured: boolean
          is_listed: boolean
          is_sample: boolean
          last_checked_at: string | null
          logo_url: string | null
          merchant_id: string | null
          name_key: string | null
          offers_delivery: boolean | null
          offers_pickup: boolean | null
          ownership_status: string
          phone_norm: string | null
          postal_code: string | null
          public_email: string | null
          public_phone: string | null
          region: string | null
          service_area_label: string | null
          slug: string | null
          social_links: Json
          source_kind: string
          tagline: string | null
          updated_at: string
          website_domain: string | null
          website_url: string | null
        }
        Insert: {
          category?: string | null
          city?: string | null
          created_at?: string
          cuisines?: string[]
          display_name?: string | null
          featured_image_url?: string | null
          featured_rank?: number
          gallery_urls?: string[]
          hours_text?: string | null
          id?: string
          is_featured?: boolean
          is_listed?: boolean
          is_sample?: boolean
          last_checked_at?: string | null
          logo_url?: string | null
          merchant_id?: string | null
          name_key?: string | null
          offers_delivery?: boolean | null
          offers_pickup?: boolean | null
          ownership_status?: string
          phone_norm?: string | null
          postal_code?: string | null
          public_email?: string | null
          public_phone?: string | null
          region?: string | null
          service_area_label?: string | null
          slug?: string | null
          social_links?: Json
          source_kind?: string
          tagline?: string | null
          updated_at?: string
          website_domain?: string | null
          website_url?: string | null
        }
        Update: {
          category?: string | null
          city?: string | null
          created_at?: string
          cuisines?: string[]
          display_name?: string | null
          featured_image_url?: string | null
          featured_rank?: number
          gallery_urls?: string[]
          hours_text?: string | null
          id?: string
          is_featured?: boolean
          is_listed?: boolean
          is_sample?: boolean
          last_checked_at?: string | null
          logo_url?: string | null
          merchant_id?: string | null
          name_key?: string | null
          offers_delivery?: boolean | null
          offers_pickup?: boolean | null
          ownership_status?: string
          phone_norm?: string | null
          postal_code?: string | null
          public_email?: string | null
          public_phone?: string | null
          region?: string | null
          service_area_label?: string | null
          slug?: string | null
          social_links?: Json
          source_kind?: string
          tagline?: string | null
          updated_at?: string
          website_domain?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_local_profiles_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_products: {
        Row: {
          availability: string
          category: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          merchant_id: string
          name: string
          price_cents: number
          storefront_id: string
          tax_code: string
          updated_at: string
        }
        Insert: {
          availability?: string
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          merchant_id: string
          name: string
          price_cents?: number
          storefront_id: string
          tax_code?: string
          updated_at?: string
        }
        Update: {
          availability?: string
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          merchant_id?: string
          name?: string
          price_cents?: number
          storefront_id?: string
          tax_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_products_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_products_storefront_id_fkey"
            columns: ["storefront_id"]
            isOneToOne: false
            referencedRelation: "merchant_storefronts"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_promotions: {
        Row: {
          activated_at: string | null
          created_at: string
          duration_days: number
          eligible_volume_cents: number
          ended_reason: string | null
          expires_at: string | null
          fees_waived_cents: number
          id: string
          merchant_id: string
          normal_fee_bps: number
          promo_fee_bps: number
          promotion_id: string
          qualified_at: string
          start_trigger: string
          status: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          duration_days: number
          eligible_volume_cents?: number
          ended_reason?: string | null
          expires_at?: string | null
          fees_waived_cents?: number
          id?: string
          merchant_id: string
          normal_fee_bps: number
          promo_fee_bps: number
          promotion_id: string
          qualified_at?: string
          start_trigger: string
          status?: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          duration_days?: number
          eligible_volume_cents?: number
          ended_reason?: string | null
          expires_at?: string | null
          fees_waived_cents?: number
          id?: string
          merchant_id?: string
          normal_fee_bps?: number
          promo_fee_bps?: number
          promotion_id?: string
          qualified_at?: string
          start_trigger?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_promotions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_promotions_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "orders_promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_quotes: {
        Row: {
          approved_at: string | null
          created_at: string
          declined_at: string | null
          deposit_cents: number
          expires_at: string | null
          id: string
          job_id: string | null
          line_items: Json
          merchant_id: string
          message: string | null
          public_token: string
          sent_at: string | null
          status: Database["public"]["Enums"]["quote_status"]
          subtotal_cents: number
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          declined_at?: string | null
          deposit_cents?: number
          expires_at?: string | null
          id?: string
          job_id?: string | null
          line_items?: Json
          merchant_id: string
          message?: string | null
          public_token?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal_cents?: number
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          declined_at?: string | null
          deposit_cents?: number
          expires_at?: string | null
          id?: string
          job_id?: string | null
          line_items?: Json
          merchant_id?: string
          message?: string | null
          public_token?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal_cents?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_quotes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "merchant_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_quotes_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_services: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          kind: string
          merchant_id: string
          name: string
          price_cents: number | null
          price_is_starting: boolean
          unit: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          kind?: string
          merchant_id: string
          name: string
          price_cents?: number | null
          price_is_starting?: boolean
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          kind?: string
          merchant_id?: string
          name?: string
          price_cents?: number | null
          price_is_starting?: boolean
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_services_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_storefronts: {
        Row: {
          created_at: string
          currency: string
          customer_fee_share_bps: number
          delivery_enabled: boolean
          delivery_fee_cents: number
          delivery_minimum_cents: number
          delivery_radius_miles: number | null
          delivery_tiers: Json
          description: string | null
          hero_image_url: string | null
          hours: string | null
          id: string
          is_published: boolean
          location: string | null
          logo_url: string | null
          merchant_id: string
          monogram: string | null
          name: string
          pickup_enabled: boolean
          pickup_info: string | null
          service_fee_cents: number
          service_fee_label: string
          slug: string
          status: Database["public"]["Enums"]["storefront_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_fee_share_bps?: number
          delivery_enabled?: boolean
          delivery_fee_cents?: number
          delivery_minimum_cents?: number
          delivery_radius_miles?: number | null
          delivery_tiers?: Json
          description?: string | null
          hero_image_url?: string | null
          hours?: string | null
          id?: string
          is_published?: boolean
          location?: string | null
          logo_url?: string | null
          merchant_id: string
          monogram?: string | null
          name: string
          pickup_enabled?: boolean
          pickup_info?: string | null
          service_fee_cents?: number
          service_fee_label?: string
          slug: string
          status?: Database["public"]["Enums"]["storefront_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_fee_share_bps?: number
          delivery_enabled?: boolean
          delivery_fee_cents?: number
          delivery_minimum_cents?: number
          delivery_radius_miles?: number | null
          delivery_tiers?: Json
          description?: string | null
          hero_image_url?: string | null
          hours?: string | null
          id?: string
          is_published?: boolean
          location?: string | null
          logo_url?: string | null
          merchant_id?: string
          monogram?: string | null
          name?: string
          pickup_enabled?: boolean
          pickup_info?: string | null
          service_fee_cents?: number
          service_fee_label?: string
          slug?: string
          status?: Database["public"]["Enums"]["storefront_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_storefronts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
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
      merchant_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          interval: string
          livemode: boolean
          merchant_id: string
          plan_slug: string
          platform_fee_bps: number | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          interval?: string
          livemode?: boolean
          merchant_id: string
          plan_slug: string
          platform_fee_bps?: number | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          interval?: string
          livemode?: boolean
          merchant_id?: string
          plan_slug?: string
          platform_fee_bps?: number | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_subscriptions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_welcome_emails: {
        Row: {
          kind: string
          merchant_id: string
          sent_at: string
        }
        Insert: {
          kind?: string
          merchant_id: string
          sent_at?: string
        }
        Update: {
          kind?: string
          merchant_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_welcome_emails_merchant_id_fkey"
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
          address_line1: string | null
          address_line2: string | null
          business_name: string
          business_type: string | null
          city: string | null
          contact_email: string
          contact_name: string | null
          country: string
          created_at: string
          fee_share_override_bps: number | null
          id: string
          industry_slug: string
          owner_id: string
          phone: string | null
          plan_slug: string
          postal_code: string | null
          purchase_models: string[]
          region: string | null
          relationship: string | null
          updated_at: string
        }
        Insert: {
          accepting_orders?: boolean
          address_line1?: string | null
          address_line2?: string | null
          business_name: string
          business_type?: string | null
          city?: string | null
          contact_email: string
          contact_name?: string | null
          country?: string
          created_at?: string
          fee_share_override_bps?: number | null
          id?: string
          industry_slug?: string
          owner_id: string
          phone?: string | null
          plan_slug?: string
          postal_code?: string | null
          purchase_models?: string[]
          region?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Update: {
          accepting_orders?: boolean
          address_line1?: string | null
          address_line2?: string | null
          business_name?: string
          business_type?: string | null
          city?: string | null
          contact_email?: string
          contact_name?: string | null
          country?: string
          created_at?: string
          fee_share_override_bps?: number | null
          id?: string
          industry_slug?: string
          owner_id?: string
          phone?: string | null
          plan_slug?: string
          postal_code?: string | null
          purchase_models?: string[]
          region?: string | null
          relationship?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          interests: string[]
          source: string | null
          status: string
          unsubscribe_token: string
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          interests?: string[]
          source?: string | null
          status?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          interests?: string[]
          source?: string | null
          status?: string
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ops_alerts: {
        Row: {
          affected_system: string | null
          category: string
          created_at: string
          detail: string | null
          detected_at: string
          id: string
          link_path: string | null
          notified_at: string | null
          payload: Json
          recommended_action: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["ops_alert_severity"]
          title: string
          updated_at: string
        }
        Insert: {
          affected_system?: string | null
          category: string
          created_at?: string
          detail?: string | null
          detected_at?: string
          id?: string
          link_path?: string | null
          notified_at?: string | null
          payload?: Json
          recommended_action?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["ops_alert_severity"]
          title: string
          updated_at?: string
        }
        Update: {
          affected_system?: string | null
          category?: string
          created_at?: string
          detail?: string | null
          detected_at?: string
          id?: string
          link_path?: string | null
          notified_at?: string | null
          payload?: Json
          recommended_action?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["ops_alert_severity"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ops_brief_deliveries: {
        Row: {
          attempts: number
          created_at: string
          error: string | null
          id: string
          queued_at: string | null
          recipient: string
          report_id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["ops_delivery_status"]
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error?: string | null
          id?: string
          queued_at?: string | null
          recipient: string
          report_id: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["ops_delivery_status"]
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error?: string | null
          id?: string
          queued_at?: string | null
          recipient?: string
          report_id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["ops_delivery_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ops_brief_deliveries_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "ops_brief_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_brief_reports: {
        Row: {
          action_count: number
          created_at: string
          critical_count: number
          generated_by: string
          html: string | null
          id: string
          important_count: number
          is_test: boolean
          recipients: string[]
          report_date: string
          snapshot: Json
          subject: string
          summary: string | null
          window_end: string
          window_label: string
          window_start: string
        }
        Insert: {
          action_count?: number
          created_at?: string
          critical_count?: number
          generated_by?: string
          html?: string | null
          id?: string
          important_count?: number
          is_test?: boolean
          recipients?: string[]
          report_date: string
          snapshot?: Json
          subject: string
          summary?: string | null
          window_end: string
          window_label?: string
          window_start: string
        }
        Update: {
          action_count?: number
          created_at?: string
          critical_count?: number
          generated_by?: string
          html?: string | null
          id?: string
          important_count?: number
          is_test?: boolean
          recipients?: string[]
          report_date?: string
          snapshot?: Json
          subject?: string
          summary?: string | null
          window_end?: string
          window_label?: string
          window_start?: string
        }
        Relationships: []
      }
      ops_brief_settings: {
        Row: {
          created_at: string
          custom_window_hours: number
          delivery_hour: number
          delivery_minute: number
          enabled: boolean
          id: string
          immediate_alerts: Json
          modules: Json
          recipients: string[]
          reporting_window: string
          sections: Json
          singleton: boolean
          thresholds: Json
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_window_hours?: number
          delivery_hour?: number
          delivery_minute?: number
          enabled?: boolean
          id?: string
          immediate_alerts?: Json
          modules?: Json
          recipients?: string[]
          reporting_window?: string
          sections?: Json
          singleton?: boolean
          thresholds?: Json
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_window_hours?: number
          delivery_hour?: number
          delivery_minute?: number
          enabled?: boolean
          id?: string
          immediate_alerts?: Json
          modules?: Json
          recipients?: string[]
          reporting_window?: string
          sections?: Json
          singleton?: boolean
          thresholds?: Json
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      ops_job_runs: {
        Row: {
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          job: string
          lease_until: string | null
          metadata: Json
          started_at: string
          status: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          job: string
          lease_until?: string | null
          metadata?: Json
          started_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          job?: string
          lease_until?: string | null
          metadata?: Json
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      order_conversations: {
        Row: {
          created_at: string
          customer_unread_count: number
          id: string
          last_message_at: string | null
          locked_at: string | null
          merchant_id: string
          merchant_unread_count: number
          order_id: string
          storefront_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_unread_count?: number
          id?: string
          last_message_at?: string | null
          locked_at?: string | null
          merchant_id: string
          merchant_unread_count?: number
          order_id: string
          storefront_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_unread_count?: number
          id?: string
          last_message_at?: string | null
          locked_at?: string | null
          merchant_id?: string
          merchant_unread_count?: number
          order_id?: string
          storefront_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_conversations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_conversations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_conversations_storefront_id_fkey"
            columns: ["storefront_id"]
            isOneToOne: false
            referencedRelation: "merchant_storefronts"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total_cents: number
          name: string
          order_id: string
          product_id: string | null
          quantity: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total_cents: number
          name: string
          order_id: string
          product_id?: string | null
          quantity: number
          unit_price_cents: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total_cents?: number
          name?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "merchant_products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          event_type: string | null
          id: string
          merchant_id: string
          read_at: string | null
          sender: string
          sender_user_id: string | null
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          event_type?: string | null
          id?: string
          merchant_id: string
          read_at?: string | null
          sender: string
          sender_user_id?: string | null
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          event_type?: string | null
          id?: string
          merchant_id?: string
          read_at?: string | null
          sender?: string
          sender_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "order_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_messages_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_email: string
          customer_fee_cents: number
          customer_name: string
          customer_notes: string | null
          customer_phone: string | null
          customer_user_id: string | null
          delivery_address: string | null
          delivery_fee_cents: number
          failure_reason: string | null
          fee_breakdown: Json | null
          fee_refunded_cents: number
          fee_schedule_id: string | null
          fee_volume_start_cents: number | null
          fulfilment: Database["public"]["Enums"]["fulfilment_type"]
          id: string
          livemode: boolean
          merchant_fee_cents: number
          merchant_id: string
          merchant_promotion_id: string | null
          paid_at: string | null
          platform_fee_bps: number
          platform_fee_cents: number
          promo_waived_cents: number
          public_token: string
          reference: string | null
          service_fee_cents: number
          status: Database["public"]["Enums"]["order_status"]
          storefront_id: string
          stripe_account_id: string | null
          stripe_checkout_session_id: string | null
          stripe_fee_cents: number | null
          stripe_payment_intent_id: string | null
          subtotal_cents: number
          tax_cents: number
          tip_cents: number
          tip_paid_at: string | null
          tip_stripe_checkout_session_id: string | null
          tip_stripe_payment_intent_id: string | null
          total_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email: string
          customer_fee_cents?: number
          customer_name: string
          customer_notes?: string | null
          customer_phone?: string | null
          customer_user_id?: string | null
          delivery_address?: string | null
          delivery_fee_cents?: number
          failure_reason?: string | null
          fee_breakdown?: Json | null
          fee_refunded_cents?: number
          fee_schedule_id?: string | null
          fee_volume_start_cents?: number | null
          fulfilment?: Database["public"]["Enums"]["fulfilment_type"]
          id?: string
          livemode?: boolean
          merchant_fee_cents?: number
          merchant_id: string
          merchant_promotion_id?: string | null
          paid_at?: string | null
          platform_fee_bps?: number
          platform_fee_cents?: number
          promo_waived_cents?: number
          public_token?: string
          reference?: string | null
          service_fee_cents?: number
          status?: Database["public"]["Enums"]["order_status"]
          storefront_id: string
          stripe_account_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_fee_cents?: number | null
          stripe_payment_intent_id?: string | null
          subtotal_cents?: number
          tax_cents?: number
          tip_cents?: number
          tip_paid_at?: string | null
          tip_stripe_checkout_session_id?: string | null
          tip_stripe_payment_intent_id?: string | null
          total_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string
          customer_fee_cents?: number
          customer_name?: string
          customer_notes?: string | null
          customer_phone?: string | null
          customer_user_id?: string | null
          delivery_address?: string | null
          delivery_fee_cents?: number
          failure_reason?: string | null
          fee_breakdown?: Json | null
          fee_refunded_cents?: number
          fee_schedule_id?: string | null
          fee_volume_start_cents?: number | null
          fulfilment?: Database["public"]["Enums"]["fulfilment_type"]
          id?: string
          livemode?: boolean
          merchant_fee_cents?: number
          merchant_id?: string
          merchant_promotion_id?: string | null
          paid_at?: string | null
          platform_fee_bps?: number
          platform_fee_cents?: number
          promo_waived_cents?: number
          public_token?: string
          reference?: string | null
          service_fee_cents?: number
          status?: Database["public"]["Enums"]["order_status"]
          storefront_id?: string
          stripe_account_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_fee_cents?: number | null
          stripe_payment_intent_id?: string | null
          subtotal_cents?: number
          tax_cents?: number
          tip_cents?: number
          tip_paid_at?: string | null
          tip_stripe_checkout_session_id?: string | null
          tip_stripe_payment_intent_id?: string | null
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_merchant_promotion_id_fkey"
            columns: ["merchant_promotion_id"]
            isOneToOne: false
            referencedRelation: "merchant_promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_storefront_id_fkey"
            columns: ["storefront_id"]
            isOneToOne: false
            referencedRelation: "merchant_storefronts"
            referencedColumns: ["id"]
          },
        ]
      }
      orders_fee_reservations: {
        Row: {
          cents: number
          created_at: string
          id: string
          merchant_id: string
        }
        Insert: {
          cents: number
          created_at?: string
          id?: string
          merchant_id: string
        }
        Update: {
          cents?: number
          created_at?: string
          id?: string
          merchant_id?: string
        }
        Relationships: []
      }
      orders_fee_schedules: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          created_at: string
          created_by: string | null
          effective_at: string | null
          id: string
          notes: string | null
          status: string
          tiers: Json
          updated_at: string
          version: number
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          created_at?: string
          created_by?: string | null
          effective_at?: string | null
          id?: string
          notes?: string | null
          status?: string
          tiers: Json
          updated_at?: string
          version?: number
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          created_at?: string
          created_by?: string | null
          effective_at?: string | null
          id?: string
          notes?: string | null
          status?: string
          tiers?: Json
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      orders_industries: {
        Row: {
          created_at: string
          default_purchase_models: string[]
          description: string | null
          display_order: number
          group_label: string
          icon: string
          id: string
          is_active: boolean
          is_food: boolean
          modules: Json
          name: string
          slug: string
          terminology: Json
          updated_at: string
          workflow: Json
        }
        Insert: {
          created_at?: string
          default_purchase_models?: string[]
          description?: string | null
          display_order?: number
          group_label?: string
          icon?: string
          id?: string
          is_active?: boolean
          is_food?: boolean
          modules?: Json
          name: string
          slug: string
          terminology?: Json
          updated_at?: string
          workflow?: Json
        }
        Update: {
          created_at?: string
          default_purchase_models?: string[]
          description?: string | null
          display_order?: number
          group_label?: string
          icon?: string
          id?: string
          is_active?: boolean
          is_food?: boolean
          modules?: Json
          name?: string
          slug?: string
          terminology?: Json
          updated_at?: string
          workflow?: Json
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
      orders_promotions: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          duration_days: number
          eligibility: string
          fee_bps: number
          id: string
          message: string
          name: string
          selected_merchant_ids: string[]
          show_builder: boolean
          show_homepage: boolean
          show_onboarding: boolean
          signup_deadline: string | null
          start_trigger: string
          starts_at: string
          status: string
          terms: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          duration_days?: number
          eligibility?: string
          fee_bps?: number
          id?: string
          message?: string
          name: string
          selected_merchant_ids?: string[]
          show_builder?: boolean
          show_homepage?: boolean
          show_onboarding?: boolean
          signup_deadline?: string | null
          start_trigger?: string
          starts_at?: string
          status?: string
          terms?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          duration_days?: number
          eligibility?: string
          fee_bps?: number
          id?: string
          message?: string
          name?: string
          selected_merchant_ids?: string[]
          show_builder?: boolean
          show_homepage?: boolean
          show_onboarding?: boolean
          signup_deadline?: string | null
          start_trigger?: string
          starts_at?: string
          status?: string
          terms?: string
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
      site_page_views: {
        Row: {
          created_at: string
          device: string
          id: number
          path: string
          referrer_source: string
          session_id: string
        }
        Insert: {
          created_at?: string
          device?: string
          id?: number
          path: string
          referrer_source?: string
          session_id: string
        }
        Update: {
          created_at?: string
          device?: string
          id?: number
          path?: string
          referrer_source?: string
          session_id?: string
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
      support_access_grants: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_by: string | null
          id: string
          merchant_id: string
          requested_by: string | null
          revoked_at: string | null
          revoked_by: string | null
          scopes: string[]
          status: string
          ticket_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          merchant_id: string
          requested_by?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          scopes: string[]
          status?: string
          ticket_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          merchant_id?: string
          requested_by?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          scopes?: string[]
          status?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_access_grants_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_access_grants_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_staff: {
        Row: {
          added_by: string | null
          created_at: string
          email: string
          level: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          email: string
          level: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          email?: string
          level?: string
          user_id?: string
        }
        Relationships: []
      }
      support_ticket_messages: {
        Row: {
          author_id: string
          author_kind: string
          body: string
          created_at: string
          id: string
          ticket_id: string
        }
        Insert: {
          author_id: string
          author_kind: string
          body: string
          created_at?: string
          id?: string
          ticket_id: string
        }
        Update: {
          author_id?: string
          author_kind?: string
          body?: string
          created_at?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assignee_id: string | null
          created_at: string
          id: string
          merchant_id: string
          opened_by: string
          status: string
          subject: string
          topic: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          id?: string
          merchant_id: string
          opened_by: string
          status?: string
          subject: string
          topic: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          id?: string
          merchant_id?: string
          opened_by?: string
          status?: string
          subject?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      zip_centroids: {
        Row: {
          lat: number
          lng: number
          zip: string
        }
        Insert: {
          lat: number
          lng: number
          zip: string
        }
        Update: {
          lat?: number
          lng?: number
          zip?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      active_fee_schedule: {
        Args: never
        Returns: {
          activated_at: string | null
          activated_by: string | null
          created_at: string
          created_by: string | null
          effective_at: string | null
          id: string
          notes: string | null
          status: string
          tiers: Json
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "orders_fee_schedules"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_fee_summary: { Args: never; Returns: Json }
      admin_merchant_directory: { Args: never; Returns: Json }
      check_and_increment_rate_limit: {
        Args: { _key: string; _max_count: number; _window_seconds: number }
        Returns: boolean
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      create_custom_project_upload_slot: { Args: never; Returns: string }
      decide_local_claim: {
        Args: { _approve: boolean; _claim_id: string; _notes?: string }
        Returns: undefined
      }
      decide_local_request: {
        Args: { _approve: boolean; _notes?: string; _request_id: string }
        Returns: undefined
      }
      email_setup_status: { Args: { _token: string }; Returns: Json }
      ensure_order_conversation: {
        Args: { _order_id: string }
        Returns: string
      }
      expire_merchant_promotions: { Args: never; Returns: number }
      fee_period_start: { Args: { _at?: string }; Returns: string }
      get_active_promotion: { Args: { _surface: string }; Returns: Json }
      get_email_provider_prices: { Args: never; Returns: Json }
      get_fee_schedule: { Args: never; Returns: Json }
      get_invoice_by_token: { Args: { _token: string }; Returns: Json }
      get_local_business: {
        Args: { _slug: string }
        Returns: {
          accepting: boolean
          area: string
          category: string
          cuisines: string[]
          delivery: boolean
          description: string
          gallery_urls: string[]
          hours_text: string
          image_url: string
          last_checked_at: string
          logo_url: string
          name: string
          ownership_status: string
          pickup: boolean
          public_email: string
          public_phone: string
          slug: string
          social_links: Json
          store_slug: string
          website_url: string
        }[]
      }
      get_order_by_token: { Args: { _token: string }; Returns: Json }
      get_order_conversation: { Args: { _token: string }; Returns: Json }
      get_order_tip_context: { Args: { _token: string }; Returns: Json }
      get_public_store_context: {
        Args: { _storefront_id: string }
        Returns: Json
      }
      get_quote_by_token: { Args: { _token: string }; Returns: Json }
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
      is_valid_custom_project_upload_path: {
        Args: { object_name: string }
        Returns: boolean
      }
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
      local_name_key: {
        Args: { _city: string; _name: string }
        Returns: string
      }
      local_norm_domain: { Args: { _url: string }; Returns: string }
      local_norm_phone: { Args: { _p: string }; Returns: string }
      merchant_decide_access: {
        Args: { _approve: boolean; _grant: string; _hours: number }
        Returns: undefined
      }
      merchant_fee_paid_volume: {
        Args: { _from: string; _merchant_id: string }
        Returns: number
      }
      merchant_fee_progress: { Args: never; Returns: Json }
      merchant_mark_conversation_read: {
        Args: { _conversation_id: string }
        Returns: undefined
      }
      merchant_messaging_enabled: {
        Args: { _merchant_id: string }
        Returns: boolean
      }
      merchant_open_ticket: {
        Args: {
          _body: string
          _grant_hours: number
          _subject: string
          _topic: string
        }
        Returns: string
      }
      merchant_send_order_message: {
        Args: { _body: string; _order_id: string }
        Returns: Json
      }
      merchant_support_activity: {
        Args: never
        Returns: {
          action: string
          by_merchant: boolean
          created_at: string
          new_value: Json
          old_value: Json
          reason: string
        }[]
      }
      newsletter_set_interests: {
        Args: { _email: string; _interests: string[] }
        Returns: boolean
      }
      newsletter_subscribe: {
        Args: { _email: string; _source: string }
        Returns: Json
      }
      newsletter_unsubscribe: { Args: { _token: string }; Returns: boolean }
      ops_acquire_job_lease: {
        Args: { _job: string; _lease_seconds?: number }
        Returns: string
      }
      order_conversation_lock_at: {
        Args: { _order: Database["public"]["Tables"]["orders"]["Row"] }
        Returns: string
      }
      owns_merchant_media_path: {
        Args: { object_name: string }
        Returns: boolean
      }
      promo_qualify: {
        Args: { _event: string; _merchant_id: string }
        Returns: undefined
      }
      publish_local_candidate: {
        Args: { _id: string; _notes?: string }
        Returns: string
      }
      record_page_view: {
        Args: {
          _device: string
          _path: string
          _referrer: string
          _session: string
        }
        Returns: undefined
      }
      reserve_fee_volume: {
        Args: { _cents: number; _merchant_id: string }
        Returns: Json
      }
      respond_to_quote: {
        Args: { _approve: boolean; _token: string }
        Returns: Json
      }
      revoke_support_access: { Args: { _grant: string }; Returns: undefined }
      search_local_businesses: {
        Args: {
          _accepting?: boolean
          _category?: string
          _delivery?: boolean
          _featured_only?: boolean
          _limit?: number
          _pickup?: boolean
          _place?: string
          _q?: string
          _radius_miles?: number
        }
        Returns: {
          accepting: boolean
          area: string
          category: string
          cuisines: string[]
          delivery: boolean
          description: string
          distance_miles: number
          image_url: string
          is_featured: boolean
          logo_url: string
          name: string
          ownership_status: string
          pickup: boolean
          slug: string
          store_slug: string
        }[]
      }
      send_order_message: {
        Args: { _body: string; _token: string }
        Returns: Json
      }
      storefront_can_publish: {
        Args: { _storefront_id: string }
        Returns: boolean
      }
      submit_local_claim: {
        Args: {
          _contact_name: string
          _evidence: string
          _role: string
          _slug: string
        }
        Returns: string
      }
      submit_local_listing: {
        Args: {
          _affiliation: string
          _affiliation_note: string
          _business_name: string
          _category: string
          _city: string
          _cuisines: string[]
          _description: string
          _offers_delivery: boolean
          _offers_pickup: boolean
          _postal_code: string
          _public_email: string
          _public_phone: string
          _region: string
          _service_area: string
          _social_links: Json
          _submitter_email: string
          _submitter_name: string
          _trap: string
          _website_url: string
        }
        Returns: undefined
      }
      submit_local_request: {
        Args: {
          _email: string
          _kind: string
          _message: string
          _name: string
          _slug: string
        }
        Returns: undefined
      }
      support_apply_change: {
        Args: {
          _merchant: string
          _patch: Json
          _reason: string
          _scope: string
          _target: string
        }
        Returns: undefined
      }
      support_audit: {
        Args: {
          _action: string
          _merchant: string
          _meta: Json
          _new: Json
          _old: Json
          _reason: string
        }
        Returns: undefined
      }
      support_level: { Args: { _uid: string }; Returns: number }
      support_merchant_overview: {
        Args: { _merchant: string; _view_as?: boolean }
        Returns: Json
      }
      support_reply: {
        Args: { _body: string; _ticket: string }
        Returns: undefined
      }
      support_request_access: {
        Args: { _merchant: string; _scopes: string[]; _ticket: string }
        Returns: string
      }
      support_set_staff: {
        Args: { _email: string; _level: string }
        Returns: undefined
      }
      support_ticket_set_status: {
        Args: { _assign_self: boolean; _status: string; _ticket: string }
        Returns: undefined
      }
      suppress_local_profile: {
        Args: { _profile_id: string; _reason?: string }
        Returns: undefined
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
      fulfilment_type: "pickup" | "delivery"
      invoice_status: "draft" | "sent" | "paid" | "void"
      job_status:
        | "request"
        | "estimate"
        | "approved"
        | "deposit"
        | "scheduled"
        | "in_progress"
        | "invoiced"
        | "completed"
        | "cancelled"
      kc_article_status: "draft" | "published" | "archived"
      ops_alert_severity: "critical" | "important" | "review" | "normal"
      ops_delivery_status:
        | "generated"
        | "queued"
        | "sent"
        | "failed"
        | "retrying"
      order_status:
        | "pending"
        | "paid"
        | "failed"
        | "cancelled"
        | "preparing"
        | "ready"
        | "out_for_delivery"
        | "completed"
        | "refunded"
      payout_status:
        | "not_started"
        | "onboarding"
        | "pending_verification"
        | "restricted"
        | "payout_enabled"
        | "disabled"
      quote_status: "draft" | "sent" | "approved" | "declined" | "expired"
      storefront_status:
        | "setup"
        | "ready"
        | "published"
        | "paused"
        | "restricted"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      fulfilment_type: ["pickup", "delivery"],
      invoice_status: ["draft", "sent", "paid", "void"],
      job_status: [
        "request",
        "estimate",
        "approved",
        "deposit",
        "scheduled",
        "in_progress",
        "invoiced",
        "completed",
        "cancelled",
      ],
      kc_article_status: ["draft", "published", "archived"],
      ops_alert_severity: ["critical", "important", "review", "normal"],
      ops_delivery_status: [
        "generated",
        "queued",
        "sent",
        "failed",
        "retrying",
      ],
      order_status: [
        "pending",
        "paid",
        "failed",
        "cancelled",
        "preparing",
        "ready",
        "out_for_delivery",
        "completed",
        "refunded",
      ],
      payout_status: [
        "not_started",
        "onboarding",
        "pending_verification",
        "restricted",
        "payout_enabled",
        "disabled",
      ],
      quote_status: ["draft", "sent", "approved", "declined", "expired"],
      storefront_status: [
        "setup",
        "ready",
        "published",
        "paused",
        "restricted",
      ],
      submission_status: ["new", "read", "responded", "archived"],
    },
  },
} as const
