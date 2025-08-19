
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
    PostgrestVersion: "13.0.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_feedback_patterns: {
        Row: {
          created_at: string | null
          feature_type: string
          id: string
          response_rating: number | null
          user_guidance: string | null
          user_id: string
          was_helpful: boolean | null
        }
        Insert: {
          created_at?: string | null
          feature_type: string
          id?: string
          response_rating?: number | null
          user_guidance?: string | null
          user_id: string
          was_helpful?: boolean | null
        }
        Update: {
          created_at?: string | null
          feature_type?: string
          id?: string
          response_rating?: number | null
          user_guidance?: string | null
          user_id?: string
          was_helpful?: boolean | null
        }
        Relationships: []
      }
      ai_food_cache: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          expires_at: string | null
          food_data: Json
          hit_count: number | null
          id: string
          last_accessed: string | null
          metadata: Json | null
          normalized_query: string
          query_hash: string
          query_text: string
          source: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          food_data: Json
          hit_count?: number | null
          id?: string
          last_accessed?: string | null
          metadata?: Json | null
          normalized_query: string
          query_hash: string
          query_text: string
          source: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          food_data?: Json
          hit_count?: number | null
          id?: string
          last_accessed?: string | null
          metadata?: Json | null
          normalized_query?: string
          query_hash?: string
          query_text?: string
          source?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          is_cache_hit: boolean | null
          parent_request_id: string | null
          processing_time_ms: number | null
          request_payload: Json | null
          request_type: string
          response_data: Json | null
          tokens_used: number | null
          user_guidance: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_cache_hit?: boolean | null
          parent_request_id?: string | null
          processing_time_ms?: number | null
          request_payload?: Json | null
          request_type: string
          response_data?: Json | null
          tokens_used?: number | null
          user_guidance?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_cache_hit?: boolean | null
          parent_request_id?: string | null
          processing_time_ms?: number | null
          request_payload?: Json | null
          request_type?: string
          response_data?: Json | null
          tokens_used?: number | null
          user_guidance?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_parent_request_id_fkey"
            columns: ["parent_request_id"]
            isOneToOne: false
            referencedRelation: "ai_usage_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_summaries: {
        Row: {
          created_at: string | null
          date: string
          exercise_calories_burned: number | null
          id: string
          meals_logged: number | null
          total_calories: number | null
          total_carbs: number | null
          total_fat: number | null
          total_fiber: number | null
          total_protein: number | null
          total_sodium: number | null
          total_sugar: number | null
          updated_at: string | null
          user_id: string
          water_intake_ml: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          exercise_calories_burned?: number | null
          id?: string
          meals_logged?: number | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_fiber?: number | null
          total_protein?: number | null
          total_sodium?: number | null
          total_sugar?: number | null
          updated_at?: string | null
          user_id: string
          water_intake_ml?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          exercise_calories_burned?: number | null
          id?: string
          meals_logged?: number | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_fiber?: number | null
          total_protein?: number | null
          total_sodium?: number | null
          total_sugar?: number | null
          updated_at?: string | null
          user_id?: string
          water_intake_ml?: number | null
        }
        Relationships: []
      }
      favorite_foods: {
        Row: {
          created_at: string | null
          food_item_id: string
          frequency_score: number | null
          id: string
          typical_portion_grams: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          food_item_id: string
          frequency_score?: number | null
          id?: string
          typical_portion_grams?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          food_item_id?: string
          frequency_score?: number | null
          id?: string
          typical_portion_grams?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_foods_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
        ]
      }
      food_items: {
        Row: {
          brand: string | null
          calories_per_100g: number | null
          carbs_per_100g: number | null
          confidence_score: number | null
          created_at: string | null
          created_by: string | null
          fat_per_100g: number | null
          fiber_per_100g: number | null
          id: string
          name: string
          protein_per_100g: number | null
          sodium_per_100g: number | null
          source: string | null
          sugar_per_100g: number | null
          updated_at: string | null
          usda_food_id: string | null
          verified_by: string | null
        }
        Insert: {
          brand?: string | null
          calories_per_100g?: number | null
          carbs_per_100g?: number | null
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          fat_per_100g?: number | null
          fiber_per_100g?: number | null
          id?: string
          name: string
          protein_per_100g?: number | null
          sodium_per_100g?: number | null
          source?: string | null
          sugar_per_100g?: number | null
          updated_at?: string | null
          usda_food_id?: string | null
          verified_by?: string | null
        }
        Update: {
          brand?: string | null
          calories_per_100g?: number | null
          carbs_per_100g?: number | null
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          fat_per_100g?: number | null
          fiber_per_100g?: number | null
          id?: string
          name?: string
          protein_per_100g?: number | null
          sodium_per_100g?: number | null
          source?: string | null
          sugar_per_100g?: number | null
          updated_at?: string | null
          usda_food_id?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      food_logs: {
        Row: {
          brand: string | null
          calories_consumed: number | null
          carbs_consumed: number | null
          created_at: string | null
          fat_consumed: number | null
          fiber_consumed: number | null
          food_item_id: string | null
          food_name: string
          id: string
          ingredients: Json | null
          logged_at: string | null
          meal_type: string | null
          notes: string | null
          portion_grams: number | null
          protein_consumed: number | null
          sodium_consumed: number | null
          sugar_consumed: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          brand?: string | null
          calories_consumed?: number | null
          carbs_consumed?: number | null
          created_at?: string | null
          fat_consumed?: number | null
          fiber_consumed?: number | null
          food_item_id?: string | null
          food_name: string
          id?: string
          ingredients?: Json | null
          logged_at?: string | null
          meal_type?: string | null
          notes?: string | null
          portion_grams?: number | null
          protein_consumed?: number | null
          sodium_consumed?: number | null
          sugar_consumed?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          brand?: string | null
          calories_consumed?: number | null
          carbs_consumed?: number | null
          created_at?: string | null
          fat_consumed?: number | null
          fiber_consumed?: number | null
          food_item_id?: string | null
          food_name?: string
          id?: string
          ingredients?: Json | null
          logged_at?: string | null
          meal_type?: string | null
          notes?: string | null
          portion_grams?: number | null
          protein_consumed?: number | null
          sodium_consumed?: number | null
          sugar_consumed?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_logs_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: number
          price_id: string
          session_id: string
          status: string
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: number
          price_id: string
          session_id: string
          status?: string
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: number
          price_id?: string
          session_id?: string
          status?: string
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_limits: {
        Row: {
          created_at: string | null
          max_favorites: number
          max_food_logs_per_day: number | null
          max_weight_entries_per_month: number | null
          tier: string
        }
        Insert: {
          created_at?: string | null
          max_favorites: number
          max_food_logs_per_day?: number | null
          max_weight_entries_per_month?: number | null
          tier: string
        }
        Update: {
          created_at?: string | null
          max_favorites?: number
          max_food_logs_per_day?: number | null
          max_weight_entries_per_month?: number | null
          tier?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          body_type: string | null
          carb_target_g: number | null
          created_at: string | null
          current_weight: number | null
          daily_calorie_target: number | null
          dietary_restrictions: string[] | null
          fat_target_g: number | null
          first_name: string
          gender: string | null
          height: number | null
          id: string
          initial_weight: number | null
          last_name: string
          preferred_units: string | null
          primary_goal: string | null
          protein_target_g: number | null
          target_date: string | null
          target_weight: number | null
          updated_at: string | null
          user_tier: string | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          body_type?: string | null
          carb_target_g?: number | null
          created_at?: string | null
          current_weight?: number | null
          daily_calorie_target?: number | null
          dietary_restrictions?: string[] | null
          fat_target_g?: number | null
          first_name: string
          gender?: string | null
          height?: number | null
          id: string
          initial_weight?: number | null
          last_name: string
          preferred_units?: string | null
          primary_goal?: string | null
          protein_target_g?: number | null
          target_date?: string | null
          target_weight?: number | null
          updated_at?: string | null
          user_tier?: string | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          body_type?: string | null
          carb_target_g?: number | null
          created_at?: string | null
          current_weight?: number | null
          daily_calorie_target?: number | null
          dietary_restrictions?: string[] | null
          fat_target_g?: number | null
          first_name?: string
          gender?: string | null
          height?: number | null
          id?: string
          initial_weight?: number | null
          last_name?: string
          preferred_units?: string | null
          primary_goal?: string | null
          protein_target_g?: number | null
          target_date?: string | null
          target_weight?: number | null
          updated_at?: string | null
          user_tier?: string | null
        }
        Relationships: []
      }
      user_tier_changes: {
        Row: {
          created_at: string | null
          from_tier: string
          id: number
          reason: string
          to_tier: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          from_tier: string
          id?: number
          reason: string
          to_tier: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          from_tier?: string
          id?: number
          reason?: string
          to_tier?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_tier_changes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_entries: {
        Row: {
          body_fat_percentage: number | null
          created_at: string | null
          id: string
          muscle_mass: number | null
          notes: string | null
          recorded_at: string | null
          user_id: string
          weight: number
        }
        Insert: {
          body_fat_percentage?: number | null
          created_at?: string | null
          id?: string
          muscle_mass?: number | null
          notes?: string | null
          recorded_at?: string | null
          user_id: string
          weight: number
        }
        Update: {
          body_fat_percentage?: number | null
          created_at?: string | null
          id?: string
          muscle_mass?: number | null
          notes?: string | null
          recorded_at?: string | null
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      batch_check_cache: {
        Args: { p_queries: string[] }
        Returns: {
          cached: boolean
          food_data: Json
          query: string
        }[]
      }
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      can_refresh_ai_content: {
        Args: { p_feature_type: string; user_uuid: string }
        Returns: {
          can_refresh: boolean
          has_initial_content: boolean
          refresh_limit: number
          refreshes_remaining: number
          refreshes_used: number
        }[]
      }
      check_ai_usage_limit: {
        Args: { user_uuid: string }
        Returns: {
          can_use: boolean
          monthly_limit: number
          remaining_requests: number
          tier: string
        }[]
      }
      check_daily_ai_limit: {
        Args: {
          p_is_refresh?: boolean
          p_request_type: string
          user_uuid: string
        }
        Returns: {
          can_use: boolean
          daily_limit: number
          refresh_limit: number
          refreshes_used: number
          remaining_requests: number
          tier: string
        }[]
      }
      clean_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_food_from_ai: {
        Args: { p_food_data: Json; p_user_id: string }
        Returns: string
      }
      create_stripe_checkout_session: {
        Args: {
          cancel_url?: string
          price_id: string
          success_url?: string
          user_id: string
        }
        Returns: Json
      }
      create_stripe_checkout_session_debug: {
        Args: {
          cancel_url?: string
          price_id: string
          success_url?: string
          user_id: string
        }
        Returns: Json
      }
      extract_ingredient_names: {
        Args: { ingredient_data: Json }
        Returns: string[]
      }
      get_ai_feature_status: {
        Args: { user_uuid: string }
        Returns: {
          ai_enabled: boolean
          requests_limit: number
          requests_remaining: number
          requests_used: number
          reset_date: string
          tier: string
        }[]
      }
      get_ai_requests_remaining: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_ai_usage_stats: {
        Args: { user_uuid: string }
        Returns: {
          average_tokens: number
          most_used_type: string
          remaining_this_month: number
          requests_this_month: number
          requests_today: number
          total_requests: number
        }[]
      }
      get_cache_savings_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_confidence_score: number
          estimated_api_calls_saved: number
          most_popular_query: string
          total_cache_hits: number
          unique_cached_queries: number
        }[]
      }
      get_cached_food_data: {
        Args: { p_query: string }
        Returns: {
          cache_hit: boolean
          confidence_score: number
          food_data: Json
          source: string
        }[]
      }
      get_common_guidance_patterns: {
        Args: { p_feature_type: string; p_limit?: number }
        Returns: {
          avg_rating: number
          guidance_pattern: string
          helpful_percentage: number
          usage_count: number
        }[]
      }
      get_daily_ai_usage: {
        Args: { user_uuid: string }
        Returns: {
          daily_review_initial: number
          daily_review_refresh_limit: number
          daily_review_refreshes: number
          dashboard_advice_initial: number
          dashboard_advice_refresh_limit: number
          dashboard_advice_refreshes: number
          food_parse_today: number
          tier: string
        }[]
      }
      get_guidance_suggestions: {
        Args: { p_feature_type: string; p_limit?: number }
        Returns: {
          popularity_score: number
          suggestion: string
        }[]
      }
      get_latest_ai_content: {
        Args: { p_date?: string; p_feature_type: string; user_uuid: string }
        Returns: {
          content_data: Json
          content_id: string
          created_at: string
          is_refresh: boolean
          refresh_count: number
          user_guidance: string
        }[]
      }
      get_monthly_ai_usage: {
        Args: { user_uuid: string }
        Returns: {
          request_count: number
          request_date: string
          request_types: string[]
          total_tokens: number
        }[]
      }
      get_popular_cached_queries: {
        Args: { limit_count?: number }
        Returns: {
          confidence_score: number
          hit_count: number
          last_accessed: string
          query_text: string
          source: string
        }[]
      }
      get_refresh_history: {
        Args: { p_date?: string; p_feature_type: string; user_uuid: string }
        Returns: {
          created_at: string
          is_refresh: boolean
          parent_id: string
          request_id: string
          request_type: string
          response_summary: Json
          user_guidance: string
        }[]
      }
      get_user_guidance_history: {
        Args: { p_feature_type?: string; p_limit?: number; p_user_id: string }
        Returns: {
          created_at: string
          feature_type: string
          guidance_id: string
          response_rating: number
          user_guidance: string
          was_helpful: boolean
        }[]
      }
      get_user_tier_limits: {
        Args: { user_uuid: string }
        Returns: {
          ai_daily_review_per_day: number
          ai_daily_review_refreshes_per_day: number
          ai_dashboard_advice_per_day: number
          ai_dashboard_advice_refreshes_per_day: number
          ai_features_enabled: boolean
          ai_food_search_monthly: number
          max_favorites: number
          max_food_logs_per_day: number
          max_weight_entries_per_month: number
          tier: string
        }[]
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { data: Json; uri: string } | { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { data: Json; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      log_ai_usage: {
        Args: {
          p_error_message?: string
          p_parent_request_id?: string
          p_processing_time_ms?: number
          p_request_payload: Json
          p_request_type: string
          p_response_data?: Json
          p_tokens_used?: number
          p_user_guidance?: string
          p_user_id: string
        }
        Returns: string
      }
      log_cache_hit: {
        Args: {
          p_cached_data: Json
          p_processing_time_ms?: number
          p_query: string
          p_user_id: string
        }
        Returns: undefined
      }
      process_stripe_webhook: {
        Args: { event_type: string; session_data: Json }
        Returns: boolean
      }
      save_ai_feedback: {
        Args: {
          p_feature_type: string
          p_rating?: number
          p_user_guidance: string
          p_user_id: string
          p_was_helpful?: boolean
        }
        Returns: string
      }
      save_food_to_cache: {
        Args: {
          p_confidence_score: number
          p_food_data: Json
          p_metadata?: Json
          p_query: string
          p_source: string
        }
        Returns: string
      }
      search_similar_cached_foods: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          confidence_score: number
          food_data: Json
          query_text: string
          similarity_score: number
        }[]
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
      validate_ai_food_result: {
        Args: { p_food_data: Json; p_user_id: string }
        Returns: Json
      }
      validate_ingredient_structure: {
        Args: { ingredient_data: Json }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
