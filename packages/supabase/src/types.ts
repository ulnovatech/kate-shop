export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_invites: {
        Row: {
          created_at: string;
          created_by: string | null;
          email: string | null;
          expires_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          role_id: string | null;
          token_hash: string;
          used_at: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          expires_at: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          role_id?: string | null;
          token_hash: string;
          used_at?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          email?: string | null;
          expires_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          role_id?: string | null;
          token_hash?: string;
          used_at?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"];
          actor_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          ip_address: string | null;
          payload: Json;
        };
        Insert: {
          action?: Database["public"]["Enums"]["audit_action"];
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          ip_address?: string | null;
          payload?: Json;
        };
        Update: {
          action?: Database["public"]["Enums"]["audit_action"];
          actor_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          ip_address?: string | null;
          payload?: Json;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          cover_full_url: string | null;
          cover_image_url: string | null;
          cover_medium_url: string | null;
          cover_thumbnail_url: string | null;
          created_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          is_hidden: boolean;
          meta_description: string | null;
          meta_title: string | null;
          name: string;
          parent_id: string | null;
          slug: string;
          sort_order: number;
        };
        Insert: {
          cover_full_url?: string | null;
          cover_image_url?: string | null;
          cover_medium_url?: string | null;
          cover_thumbnail_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          is_hidden?: boolean;
          meta_description?: string | null;
          meta_title?: string | null;
          name: string;
          parent_id?: string | null;
          slug: string;
          sort_order?: number;
        };
        Update: {
          cover_full_url?: string | null;
          cover_image_url?: string | null;
          cover_medium_url?: string | null;
          cover_thumbnail_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          is_hidden?: boolean;
          meta_description?: string | null;
          meta_title?: string | null;
          name?: string;
          parent_id?: string | null;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          phone: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          phone: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          phone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      delivery_rules: {
        Row: {
          cod_fee: number;
          currency: string;
          express_delivery_fee: number;
          free_delivery_all_zones_threshold: number;
          free_delivery_zones_1_2_threshold: number;
          id: number;
        };
        Insert: {
          cod_fee?: number;
          currency?: string;
          express_delivery_fee?: number;
          free_delivery_all_zones_threshold?: number;
          free_delivery_zones_1_2_threshold?: number;
          id?: number;
        };
        Update: {
          cod_fee?: number;
          currency?: string;
          express_delivery_fee?: number;
          free_delivery_all_zones_threshold?: number;
          free_delivery_zones_1_2_threshold?: number;
          id?: number;
        };
        Relationships: [];
      };
      delivery_zone_areas: {
        Row: {
          area_name: string;
          id: string;
          sort_order: number;
          zone_id: string;
        };
        Insert: {
          area_name: string;
          id?: string;
          sort_order?: number;
          zone_id: string;
        };
        Update: {
          area_name?: string;
          id?: string;
          sort_order?: number;
          zone_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_zone_areas_zone_id_fkey";
            columns: ["zone_id"];
            isOneToOne: false;
            referencedRelation: "delivery_zones";
            referencedColumns: ["id"];
          },
        ];
      };
      delivery_zones: {
        Row: {
          created_at: string;
          description: string | null;
          estimated_days: string | null;
          fee: number;
          free_delivery_threshold: number | null;
          id: string;
          is_active: boolean;
          name: string;
          sort_order: number;
          zone_number: number;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          estimated_days?: string | null;
          fee?: number;
          free_delivery_threshold?: number | null;
          id?: string;
          is_active?: boolean;
          name: string;
          sort_order?: number;
          zone_number: number;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          estimated_days?: string | null;
          fee?: number;
          free_delivery_threshold?: number | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          sort_order?: number;
          zone_number?: number;
        };
        Relationships: [];
      };
      inventory_events: {
        Row: {
          created_at: string;
          delta_available: number;
          delta_reserved: number;
          id: string;
          order_id: string | null;
          product_id: string | null;
          reason: string;
          variant_id: string | null;
        };
        Insert: {
          created_at?: string;
          delta_available?: number;
          delta_reserved?: number;
          id?: string;
          order_id?: string | null;
          product_id?: string | null;
          reason: string;
          variant_id?: string | null;
        };
        Update: {
          created_at?: string;
          delta_available?: number;
          delta_reserved?: number;
          id?: string;
          order_id?: string | null;
          product_id?: string | null;
          reason?: string;
          variant_id?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          name: string;
          order_id: string;
          price: number;
          product_id: string | null;
          quantity: number;
          variant_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          order_id: string;
          price: number;
          product_id?: string | null;
          quantity?: number;
          variant_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          order_id?: string;
          price?: number;
          product_id?: string | null;
          quantity?: number;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_events: {
        Row: {
          created_at: string;
          created_by: string | null;
          from_status: Database["public"]["Enums"]["order_status"] | null;
          id: string;
          note: string | null;
          order_id: string;
          to_status: Database["public"]["Enums"]["order_status"];
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          from_status?: Database["public"]["Enums"]["order_status"] | null;
          id?: string;
          note?: string | null;
          order_id: string;
          to_status: Database["public"]["Enums"]["order_status"];
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          from_status?: Database["public"]["Enums"]["order_status"] | null;
          id?: string;
          note?: string | null;
          order_id?: string;
          to_status?: Database["public"]["Enums"]["order_status"];
        };
        Relationships: [
          {
            foreignKeyName: "order_status_events_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          address: string | null;
          admin_notes: string | null;
          cash_on_delivery: boolean;
          created_at: string;
          customer_id: string | null;
          customer_name: string;
          delivery_area: string | null;
          delivery_fee: number;
          delivery_zone_id: string | null;
          email: string | null;
          express_delivery: boolean;
          grand_total: number | null;
          id: string;
          inventory_state: string;
          notes: string | null;
          order_reference: string | null;
          order_status: Database["public"]["Enums"]["order_status"] | null;
          payment_status: Database["public"]["Enums"]["payment_status"];
          preferred_payment_provider: Database["public"]["Enums"]["payment_provider"] | null;
          phone: string;
          status: string;
          subtotal: number;
          total: number;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          admin_notes?: string | null;
          cash_on_delivery?: boolean;
          created_at?: string;
          customer_id?: string | null;
          customer_name: string;
          delivery_area?: string | null;
          delivery_fee?: number;
          delivery_zone_id?: string | null;
          email?: string | null;
          express_delivery?: boolean;
          grand_total?: number | null;
          id?: string;
          inventory_state?: string;
          notes?: string | null;
          order_reference?: string | null;
          order_status?: Database["public"]["Enums"]["order_status"] | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          preferred_payment_provider?: Database["public"]["Enums"]["payment_provider"] | null;
          phone: string;
          status?: string;
          subtotal?: number;
          total?: number;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          admin_notes?: string | null;
          cash_on_delivery?: boolean;
          created_at?: string;
          customer_id?: string | null;
          customer_name?: string;
          delivery_area?: string | null;
          delivery_fee?: number;
          delivery_zone_id?: string | null;
          email?: string | null;
          express_delivery?: boolean;
          grand_total?: number | null;
          id?: string;
          inventory_state?: string;
          notes?: string | null;
          order_reference?: string | null;
          order_status?: Database["public"]["Enums"]["order_status"] | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          preferred_payment_provider?: Database["public"]["Enums"]["payment_provider"] | null;
          phone?: string;
          status?: string;
          subtotal?: number;
          total?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_delivery_zone_id_fkey";
            columns: ["delivery_zone_id"];
            isOneToOne: false;
            referencedRelation: "delivery_zones";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_methods: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          is_enabled: boolean;
          label: string;
          provider: Database["public"]["Enums"]["payment_provider"];
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string;
          id?: string;
          is_enabled?: boolean;
          label: string;
          provider: Database["public"]["Enums"]["payment_provider"];
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          is_enabled?: boolean;
          label?: string;
          provider?: Database["public"]["Enums"]["payment_provider"];
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount_paid: number;
          created_at: string;
          currency: string;
          id: string;
          notes: string | null;
          order_id: string;
          payer_phone_number: string;
          payment_provider: Database["public"]["Enums"]["payment_provider"];
          payment_status: Database["public"]["Enums"]["payment_status"];
          recorded_at: string;
          recorded_by: string | null;
          transaction_reference: string | null;
          updated_at: string;
        };
        Insert: {
          amount_paid: number;
          created_at?: string;
          currency?: string;
          id?: string;
          notes?: string | null;
          order_id: string;
          payer_phone_number: string;
          payment_provider: Database["public"]["Enums"]["payment_provider"];
          payment_status?: Database["public"]["Enums"]["payment_status"];
          recorded_at?: string;
          recorded_by?: string | null;
          transaction_reference?: string | null;
          updated_at?: string;
        };
        Update: {
          amount_paid?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          notes?: string | null;
          order_id?: string;
          payer_phone_number?: string;
          payment_provider?: Database["public"]["Enums"]["payment_provider"];
          payment_status?: Database["public"]["Enums"]["payment_status"];
          recorded_at?: string;
          recorded_by?: string | null;
          transaction_reference?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          alt_text: string | null;
          created_at: string;
          full_url: string | null;
          id: string;
          image_url: string;
          is_primary: boolean;
          medium_url: string | null;
          product_id: string;
          sort_order: number;
          thumbnail_url: string | null;
        };
        Insert: {
          alt_text?: string | null;
          created_at?: string;
          full_url?: string | null;
          id?: string;
          image_url: string;
          is_primary?: boolean;
          medium_url?: string | null;
          product_id: string;
          sort_order?: number;
          thumbnail_url?: string | null;
        };
        Update: {
          alt_text?: string | null;
          created_at?: string;
          full_url?: string | null;
          id?: string;
          image_url?: string;
          is_primary?: boolean;
          medium_url?: string | null;
          product_id?: string;
          sort_order?: number;
          thumbnail_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          attributes: Json;
          available_stock: number;
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          price: number | null;
          product_id: string;
          reserved_stock: number;
          sku: string | null;
          sort_order: number;
        };
        Insert: {
          attributes?: Json;
          available_stock?: number;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          price?: number | null;
          product_id: string;
          reserved_stock?: number;
          sku?: string | null;
          sort_order?: number;
        };
        Update: {
          attributes?: Json;
          available_stock?: number;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          price?: number | null;
          product_id?: string;
          reserved_stock?: number;
          sku?: string | null;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          archived_at: string | null;
          available_stock: number;
          category_id: string | null;
          created_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          is_featured: boolean;
          is_visible: boolean;
          low_stock_threshold: number;
          material: string | null;
          meta_description: string | null;
          meta_title: string | null;
          name: string;
          price: number;
          reserved_stock: number;
          sku: string | null;
          slug: string;
          stock_quantity: number;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          available_stock?: number;
          category_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_featured?: boolean;
          is_visible?: boolean;
          low_stock_threshold?: number;
          material?: string | null;
          meta_description?: string | null;
          meta_title?: string | null;
          name: string;
          price?: number;
          reserved_stock?: number;
          sku?: string | null;
          slug: string;
          stock_quantity?: number;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          available_stock?: number;
          category_id?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_featured?: boolean;
          is_visible?: boolean;
          low_stock_threshold?: number;
          material?: string | null;
          meta_description?: string | null;
          meta_title?: string | null;
          name?: string;
          price?: number;
          reserved_stock?: number;
          sku?: string | null;
          slug?: string;
          stock_quantity?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      role_permissions: {
        Row: {
          permission_key: string;
          role_id: string;
        };
        Insert: {
          permission_key: string;
          role_id: string;
        };
        Update: {
          permission_key?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          is_locked: boolean;
          is_system: boolean;
          name: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string;
          id?: string;
          is_locked?: boolean;
          is_system?: boolean;
          name: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          is_locked?: boolean;
          is_system?: boolean;
          name?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      staff_role_assignments: {
        Row: {
          assigned_at: string;
          assigned_by: string | null;
          role_id: string;
          user_id: string;
        };
        Insert: {
          assigned_at?: string;
          assigned_by?: string | null;
          role_id: string;
          user_id: string;
        };
        Update: {
          assigned_at?: string;
          assigned_by?: string | null;
          role_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staff_role_assignments_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      settings: {
        Row: {
          about_text: string | null;
          address: string | null;
          airtel_merchant_code: string | null;
          airtel_merchant_name: string | null;
          bank_transfer_instructions: string | null;
          currency: string;
          email: string | null;
          facebook: string | null;
          hero_subtitle: string | null;
          hero_title: string | null;
          id: number;
          instagram: string | null;
          inventory_mode: Database["public"]["Enums"]["inventory_mode"];
          logo_url: string | null;
          meta_description: string | null;
          meta_title: string | null;
          mtn_momo_merchant_code: string | null;
          mtn_momo_merchant_name: string | null;
          phone: string | null;
          shop_name: string;
          tiktok: string | null;
          whatsapp: string | null;
        };
        Insert: {
          about_text?: string | null;
          address?: string | null;
          airtel_merchant_code?: string | null;
          airtel_merchant_name?: string | null;
          bank_transfer_instructions?: string | null;
          currency?: string;
          email?: string | null;
          facebook?: string | null;
          hero_subtitle?: string | null;
          hero_title?: string | null;
          id?: number;
          instagram?: string | null;
          inventory_mode?: Database["public"]["Enums"]["inventory_mode"];
          logo_url?: string | null;
          meta_description?: string | null;
          meta_title?: string | null;
          mtn_momo_merchant_code?: string | null;
          mtn_momo_merchant_name?: string | null;
          phone?: string | null;
          shop_name?: string;
          tiktok?: string | null;
          whatsapp?: string | null;
        };
        Update: {
          about_text?: string | null;
          address?: string | null;
          airtel_merchant_code?: string | null;
          airtel_merchant_name?: string | null;
          bank_transfer_instructions?: string | null;
          currency?: string;
          email?: string | null;
          facebook?: string | null;
          hero_subtitle?: string | null;
          hero_title?: string | null;
          id?: number;
          instagram?: string | null;
          inventory_mode?: Database["public"]["Enums"]["inventory_mode"];
          logo_url?: string | null;
          meta_description?: string | null;
          meta_title?: string | null;
          mtn_momo_merchant_code?: string | null;
          mtn_momo_merchant_name?: string | null;
          phone?: string | null;
          shop_name?: string;
          tiktok?: string | null;
          whatsapp?: string | null;
        };
        Relationships: [];
      };
      system_config: {
        Row: {
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value?: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_manage_catalog: { Args: { _user_id: string }; Returns: boolean };
      can_manage_orders: { Args: { _user_id: string }; Returns: boolean };
      confirm_order_stock: { Args: { p_order_id: string }; Returns: undefined };
      create_order_with_reservation: {
        Args: {
          p_address?: string;
          p_cash_on_delivery?: boolean;
          p_checkout_session_id?: string;
          p_customer_name: string;
          p_delivery_area?: string;
          p_delivery_fee?: number;
          p_delivery_zone_id?: string;
          p_email?: string;
          p_express_delivery?: boolean;
          p_grand_total?: number;
          p_items?: Json;
          p_notes?: string;
          p_phone: string;
          p_preferred_payment_provider?: Database["public"]["Enums"]["payment_provider"];
          p_subtotal?: number;
        };
        Returns: Json;
      };
      fulfill_order_inventory: { Args: { p_order_id: string }; Returns: undefined };
      generate_order_reference: { Args: Record<string, never>; Returns: string };
      get_store_inventory_mode: { Args: Record<string, never>; Returns: string };
      release_order_inventory: { Args: { p_order_id: string }; Returns: undefined };
      update_order_status_with_inventory: {
        Args: {
          p_note?: string;
          p_new_status: Database["public"]["Enums"]["order_status"];
          p_order_id: string;
        };
        Returns: undefined;
      };
      is_bootstrap_required: { Args: Record<string, never>; Returns: boolean };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_owner: { Args: { _user_id: string }; Returns: boolean };
      is_staff_member: { Args: { _user_id: string }; Returns: boolean };
      staff_has_permission: {
        Args: { _action: string; _module: string; _user_id: string };
        Returns: boolean;
      };
      staff_has_permission_key: {
        Args: { _permission_key: string; _user_id: string };
        Returns: boolean;
      };
      user_has_any_role: {
        Args: { _roles: Database["public"]["Enums"]["app_role"][]; _user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "owner" | "manager" | "staff";
      audit_action:
        | "product_created"
        | "product_updated"
        | "product_deleted"
        | "category_created"
        | "category_updated"
        | "category_deleted"
        | "inventory_changed"
        | "order_updated"
        | "settings_changed"
        | "invite_created"
        | "role_assigned"
        | "item_restored"
        | "item_purged"
        | "user_login"
        | "payment_recorded"
        | "other";
      inventory_mode: "strict" | "backorder";
      order_status:
        | "awaiting_stock_confirmation"
        | "awaiting_payment"
        | "confirmed"
        | "packed"
        | "shipped"
        | "delivered"
        | "cancelled";
      payment_provider: "mtn_momo" | "airtel_money" | "cash_on_delivery" | "bank_transfer";
      payment_status: "pending" | "partially_paid" | "paid" | "failed" | "refunded";
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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    Enums: {
      app_role: ["admin", "owner", "manager", "staff"],
      audit_action: [
        "product_created",
        "product_updated",
        "product_deleted",
        "category_created",
        "category_updated",
        "category_deleted",
        "inventory_changed",
        "order_updated",
        "settings_changed",
        "invite_created",
        "role_assigned",
        "item_restored",
        "item_purged",
        "user_login",
        "payment_recorded",
        "other",
      ],
      inventory_mode: ["strict", "backorder"],
      order_status: [
        "awaiting_stock_confirmation",
        "awaiting_payment",
        "confirmed",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      payment_provider: ["mtn_momo", "airtel_money", "cash_on_delivery", "bank_transfer"],
      payment_status: ["pending", "partially_paid", "paid", "failed", "refunded"],
    },
  },
} as const;
