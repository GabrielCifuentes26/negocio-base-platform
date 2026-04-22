export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

type TableDefinition<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      businesses: TableDefinition<
        {
          id: string;
          name: string;
          slug: string;
          locale: string;
          currency_code: string;
          timezone: string;
          status: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          name: string;
          slug: string;
          locale?: string;
          currency_code?: string;
          timezone?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          name?: string;
          slug?: string;
          locale?: string;
          currency_code?: string;
          timezone?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      business_branding: TableDefinition<
        {
          id: string;
          business_id: string;
          logo_url: string | null;
          hero_image_url: string | null;
          primary_color: string;
          primary_foreground_color: string;
          accent_color: string;
          accent_foreground_color: string;
          sidebar_color: string;
          font_family: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          business_id: string;
          logo_url?: string | null;
          hero_image_url?: string | null;
          primary_color?: string;
          primary_foreground_color?: string;
          accent_color?: string;
          accent_foreground_color?: string;
          sidebar_color?: string;
          font_family?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          business_id?: string;
          logo_url?: string | null;
          hero_image_url?: string | null;
          primary_color?: string;
          primary_foreground_color?: string;
          accent_color?: string;
          accent_foreground_color?: string;
          sidebar_color?: string;
          font_family?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      business_settings: TableDefinition<
        {
          id: string;
          business_id: string;
          contact_email: string | null;
          contact_phone: string | null;
          address: string | null;
          website: string | null;
          welcome_message: string | null;
          modules: Json;
          hours: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          business_id: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          address?: string | null;
          website?: string | null;
          welcome_message?: string | null;
          modules?: Json;
          hours?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          business_id?: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          address?: string | null;
          website?: string | null;
          welcome_message?: string | null;
          modules?: Json;
          hours?: Json;
          created_at?: string;
          updated_at?: string;
        }
      >;
      roles: TableDefinition<
        {
          id: string;
          business_id: string | null;
          key: string;
          name: string;
          description: string | null;
          is_system: boolean;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          business_id?: string | null;
          key: string;
          name: string;
          description?: string | null;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          business_id?: string | null;
          key?: string;
          name?: string;
          description?: string | null;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        }
      >;
      permissions: TableDefinition<
        {
          id: string;
          key: string;
          module_key: string;
          action: string;
          description: string | null;
          created_at: string;
        },
        {
          id?: string;
          key: string;
          module_key: string;
          action: string;
          description?: string | null;
          created_at?: string;
        },
        {
          id?: string;
          key?: string;
          module_key?: string;
          action?: string;
          description?: string | null;
          created_at?: string;
        }
      >;
      role_permissions: TableDefinition<
        {
          role_id: string;
          permission_id: string;
          created_at: string;
        },
        {
          role_id: string;
          permission_id: string;
          created_at?: string;
        },
        {
          role_id?: string;
          permission_id?: string;
          created_at?: string;
        }
      >;
      profiles: TableDefinition<
        {
          id: string;
          full_name: string;
          email: string | null;
          avatar_url: string | null;
          phone: string | null;
          preferred_business_id: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          full_name: string;
          email?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          preferred_business_id?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          full_name?: string;
          email?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          preferred_business_id?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      business_memberships: TableDefinition<
        {
          id: string;
          business_id: string;
          user_id: string;
          role_id: string;
          status: string;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          business_id: string;
          user_id: string;
          role_id: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          business_id?: string;
          user_id?: string;
          role_id?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      business_invitations: TableDefinition<
        {
          id: string;
          business_id: string;
          email: string;
          full_name: string | null;
          role_id: string;
          invite_token: string;
          invited_by_membership_id: string | null;
          status: string;
          expires_at: string | null;
          accepted_at: string | null;
          accepted_by_profile_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          business_id: string;
          email: string;
          full_name?: string | null;
          role_id: string;
          invite_token?: string;
          invited_by_membership_id?: string | null;
          status?: string;
          expires_at?: string | null;
          accepted_at?: string | null;
          accepted_by_profile_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          business_id?: string;
          email?: string;
          full_name?: string | null;
          role_id?: string;
          invite_token?: string;
          invited_by_membership_id?: string | null;
          status?: string;
          expires_at?: string | null;
          accepted_at?: string | null;
          accepted_by_profile_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      customers: TableDefinition<
        {
          id: string;
          business_id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          notes: string | null;
          tags: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          business_id: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          tags?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          business_id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          tags?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        }
      >;
      services: TableDefinition<
        {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          price: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          business_id: string;
          name: string;
          description?: string | null;
          duration_minutes?: number;
          price?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          business_id?: string;
          name?: string;
          description?: string | null;
          duration_minutes?: number;
          price?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        }
      >;
      products: TableDefinition<
        {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          sku: string | null;
          price: number;
          stock: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          business_id: string;
          name: string;
          description?: string | null;
          sku?: string | null;
          price?: number;
          stock?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          business_id?: string;
          name?: string;
          description?: string | null;
          sku?: string | null;
          price?: number;
          stock?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        }
      >;
      appointments: TableDefinition<
        {
          id: string;
          business_id: string;
          customer_id: string;
          assigned_membership_id: string | null;
          starts_at: string;
          ends_at: string;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          business_id: string;
          customer_id: string;
          assigned_membership_id?: string | null;
          starts_at: string;
          ends_at: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          business_id?: string;
          customer_id?: string;
          assigned_membership_id?: string | null;
          starts_at?: string;
          ends_at?: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      appointment_services: TableDefinition<
        {
          id: string;
          appointment_id: string;
          service_id: string;
          unit_price: number;
          quantity: number;
          created_at: string;
        },
        {
          id?: string;
          appointment_id: string;
          service_id: string;
          unit_price?: number;
          quantity?: number;
          created_at?: string;
        },
        {
          id?: string;
          appointment_id?: string;
          service_id?: string;
          unit_price?: number;
          quantity?: number;
          created_at?: string;
        }
      >;
      sales: TableDefinition<
        {
          id: string;
          business_id: string;
          customer_id: string | null;
          appointment_id: string | null;
          sold_by_membership_id: string | null;
          ticket_number: string;
          status: string;
          subtotal: number;
          discount_total: number;
          tax_total: number;
          total: number;
          payment_method: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          business_id: string;
          customer_id?: string | null;
          appointment_id?: string | null;
          sold_by_membership_id?: string | null;
          ticket_number: string;
          status?: string;
          subtotal?: number;
          discount_total?: number;
          tax_total?: number;
          total?: number;
          payment_method?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          business_id?: string;
          customer_id?: string | null;
          appointment_id?: string | null;
          sold_by_membership_id?: string | null;
          ticket_number?: string;
          status?: string;
          subtotal?: number;
          discount_total?: number;
          tax_total?: number;
          total?: number;
          payment_method?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      sale_items: TableDefinition<
        {
          id: string;
          sale_id: string;
          item_type: string;
          service_id: string | null;
          product_id: string | null;
          description: string;
          quantity: number;
          unit_price: number;
          total: number;
          created_at: string;
        },
        {
          id?: string;
          sale_id: string;
          item_type: string;
          service_id?: string | null;
          product_id?: string | null;
          description: string;
          quantity?: number;
          unit_price?: number;
          total?: number;
          created_at?: string;
        },
        {
          id?: string;
          sale_id?: string;
          item_type?: string;
          service_id?: string | null;
          product_id?: string | null;
          description?: string;
          quantity?: number;
          unit_price?: number;
          total?: number;
          created_at?: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      accept_business_invitation: {
        Args: {
          invitation_token: string;
        };
        Returns: {
          business_id: string;
          membership_id: string;
        }[];
      };
      bootstrap_business_workspace: {
        Args: {
          business_name: string;
          contact_email?: string | null;
          contact_phone?: string | null;
          address?: string | null;
          welcome_message?: string | null;
          locale_value?: string | null;
          currency_code_value?: string | null;
          timezone_value?: string | null;
          active_modules?: Json;
          primary_color?: string | null;
          accent_color?: string | null;
          font_family?: string | null;
        };
        Returns: {
          business_id: string;
          membership_id: string;
        }[];
      };
      set_preferred_business: {
        Args: {
          target_business_id: string | null;
        };
        Returns: string | null;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
