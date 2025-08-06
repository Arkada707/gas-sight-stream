export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      devices: {
        Row: {
          id: string
          name: string
          mac_address: string
          title: string
          location: string
          service_uuid: string
          data_characteristic_uuid: string
          enabled: boolean
          color: string
          rssi: number | null
          confidence_score: number | null
          last_discovered: string | null
          discovery_metadata: Json | null
          is_connected: boolean
          last_connected: string | null
          connection_attempts: number
          total_packets_received: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          mac_address: string
          title: string
          location?: string
          service_uuid?: string
          data_characteristic_uuid?: string
          enabled?: boolean
          color?: string
          rssi?: number | null
          confidence_score?: number | null
          last_discovered?: string | null
          discovery_metadata?: Json | null
          is_connected?: boolean
          last_connected?: string | null
          connection_attempts?: number
          total_packets_received?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          mac_address?: string
          title?: string
          location?: string
          service_uuid?: string
          data_characteristic_uuid?: string
          enabled?: boolean
          color?: string
          rssi?: number | null
          confidence_score?: number | null
          last_discovered?: string | null
          discovery_metadata?: Json | null
          is_connected?: boolean
          last_connected?: string | null
          connection_attempts?: number
          total_packets_received?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sensor_data: {
        Row: {
          id: string
          device_id: string
          title_name: string
          tank_level: number
          tank_level_unit: string
          updated_refresh: string
          battery: "Full" | "Ok" | "Low"
          connection_strength: number
          measurement: number
          measurement_unit: string
          technical_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          device_id: string
          title_name: string
          tank_level: number
          tank_level_unit?: string
          updated_refresh: string
          battery: "Full" | "Ok" | "Low"
          connection_strength: number
          measurement: number
          measurement_unit?: string
          technical_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          device_id?: string
          title_name?: string
          tank_level?: number
          tank_level_unit?: string
          updated_refresh?: string
          battery?: "Full" | "Ok" | "Low"
          connection_strength?: number
          measurement?: number
          measurement_unit?: string
          technical_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_sensor_data_device_id"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      device_stats: {
        Row: {
          id: string
          name: string
          title: string
          location: string
          color: string
          enabled: boolean
          is_connected: boolean
          last_connected: string | null
          total_packets_received: number
          device_created_at: string
          latest_tank_level: number | null
          tank_level_unit: string | null
          latest_measurement: number | null
          measurement_unit: string | null
          latest_battery: "Full" | "Ok" | "Low" | null
          latest_connection_strength: number | null
          latest_refresh: string | null
          latest_reading_at: string | null
          total_readings: number | null
          readings_last_24h: number | null
          avg_measurement_24h: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
