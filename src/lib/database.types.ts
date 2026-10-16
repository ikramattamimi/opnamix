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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      master_jasa: {
        Row: {
          category_id: number | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          harga: number | null
          id: number
          is_active: boolean | null
          kode: string
          nama: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category_id?: number | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          harga?: number | null
          id?: never
          is_active?: boolean | null
          kode: string
          nama: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category_id?: number | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          harga?: number | null
          id?: never
          is_active?: boolean | null
          kode?: string
          nama?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "master_jasa_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      master_jenis_obat: {
        Row: {
          created_at: string | null
          created_by: string | null
          deskripsi: string | null
          id: number
          is_active: boolean | null
          kode: string
          nama_jenis: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deskripsi?: string | null
          id?: number
          is_active?: boolean | null
          kode: string
          nama_jenis: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deskripsi?: string | null
          id?: number
          is_active?: boolean | null
          kode?: string
          nama_jenis?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      master_obat: {
        Row: {
          buffer_stok: number | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          harga: number | null
          id: number
          is_active: boolean | null
          jenis: string | null
          jenis_obat_id: number | null
          kandungan: string | null
          kode: string
          merek: string | null
          nama: string
          qty: number | null
          satuan: string | null
          satuan_id: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          buffer_stok?: number | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          harga?: number | null
          id?: never
          is_active?: boolean | null
          jenis?: string | null
          jenis_obat_id?: number | null
          kandungan?: string | null
          kode: string
          merek?: string | null
          nama: string
          qty?: number | null
          satuan?: string | null
          satuan_id?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          buffer_stok?: number | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          harga?: number | null
          id?: never
          is_active?: boolean | null
          jenis?: string | null
          jenis_obat_id?: number | null
          kandungan?: string | null
          kode?: string
          merek?: string | null
          nama?: string
          qty?: number | null
          satuan?: string | null
          satuan_id?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "master_obat_jenis_obat_id_fkey"
            columns: ["jenis_obat_id"]
            isOneToOne: false
            referencedRelation: "master_jenis_obat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_obat_satuan_id_fkey"
            columns: ["satuan_id"]
            isOneToOne: false
            referencedRelation: "master_satuan"
            referencedColumns: ["id"]
          },
        ]
      }
      master_satuan: {
        Row: {
          created_at: string | null
          created_by: string | null
          deskripsi: string | null
          id: number
          is_active: boolean | null
          kode: string
          nama_satuan: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deskripsi?: string | null
          id?: number
          is_active?: boolean | null
          kode: string
          nama_satuan: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deskripsi?: string | null
          id?: number
          is_active?: boolean | null
          kode?: string
          nama_satuan?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: number
          is_read: boolean | null
          message: string
          target_role: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: never
          is_read?: boolean | null
          message: string
          target_role?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: never
          is_read?: boolean | null
          message?: string
          target_role?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      opname: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          current_step: number | null
          deleted_at: string | null
          id: number
          obat_ids: Json | null
          schedule_id: number | null
          selected_obat_ids: Json | null
          status: string | null
          tanggal: string | null
          tanggal_jadwal: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          current_step?: number | null
          deleted_at?: string | null
          id?: never
          obat_ids?: Json | null
          schedule_id?: number | null
          selected_obat_ids?: Json | null
          status?: string | null
          tanggal?: string | null
          tanggal_jadwal?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          current_step?: number | null
          deleted_at?: string | null
          id?: never
          obat_ids?: Json | null
          schedule_id?: number | null
          selected_obat_ids?: Json | null
          status?: string | null
          tanggal?: string | null
          tanggal_jadwal?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opname_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "opname_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      opname_detail: {
        Row: {
          alasan: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          id: number
          obat_id: number | null
          opname_id: number | null
          selisih: number | null
          status: string | null
          stok_final: number | null
          stok_fisik: number | null
          stok_sistem: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          alasan?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: never
          obat_id?: number | null
          opname_id?: number | null
          selisih?: number | null
          status?: string | null
          stok_final?: number | null
          stok_fisik?: number | null
          stok_sistem?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          alasan?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: never
          obat_id?: number | null
          opname_id?: number | null
          selisih?: number | null
          status?: string | null
          stok_final?: number | null
          stok_fisik?: number | null
          stok_sistem?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opname_detail_obat_id_fkey"
            columns: ["obat_id"]
            isOneToOne: false
            referencedRelation: "master_obat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opname_detail_opname_id_fkey"
            columns: ["opname_id"]
            isOneToOne: false
            referencedRelation: "opname"
            referencedColumns: ["id"]
          },
        ]
      }
      opname_schedule: {
        Row: {
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          durasi_pengerjaan: number | null
          id: number
          is_active: boolean | null
          nama: string
          obat_ids: Json | null
          pengulangan: string | null
          tanggal_audit: number | null
          updated_at: string | null
          updated_by: string | null
          waktu_jam: number | null
          waktu_menit: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          durasi_pengerjaan?: number | null
          id?: never
          is_active?: boolean | null
          nama: string
          obat_ids?: Json | null
          pengulangan?: string | null
          tanggal_audit?: number | null
          updated_at?: string | null
          updated_by?: string | null
          waktu_jam?: number | null
          waktu_menit?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          durasi_pengerjaan?: number | null
          id?: never
          is_active?: boolean | null
          nama?: string
          obat_ids?: Json | null
          pengulangan?: string | null
          tanggal_audit?: number | null
          updated_at?: string | null
          updated_by?: string | null
          waktu_jam?: number | null
          waktu_menit?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transaksi: {
        Row: {
          biaya_layanan: number
          bukti: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          diskon: number | null
          id: number
          jasa_id: number | null
          keterangan: string | null
          nama_nakes: string | null
          nama_pasien: string | null
          nomor: string | null
          processed_at: string | null
          processed_by: string | null
          status: string | null
          tanggal: string | null
          tanggal_lahir_pasien: string | null
          tipe: string | null
          tipe_sumber: string | null
          total: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          biaya_layanan?: number
          bukti?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          diskon?: number | null
          id?: number
          jasa_id?: number | null
          keterangan?: string | null
          nama_nakes?: string | null
          nama_pasien?: string | null
          nomor?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          tanggal?: string | null
          tanggal_lahir_pasien?: string | null
          tipe?: string | null
          tipe_sumber?: string | null
          total?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          biaya_layanan?: number
          bukti?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          diskon?: number | null
          id?: number
          jasa_id?: number | null
          keterangan?: string | null
          nama_nakes?: string | null
          nama_pasien?: string | null
          nomor?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string | null
          tanggal?: string | null
          tanggal_lahir_pasien?: string | null
          tipe?: string | null
          tipe_sumber?: string | null
          total?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaksi_jasa_id_fkey"
            columns: ["jasa_id"]
            isOneToOne: false
            referencedRelation: "master_jasa"
            referencedColumns: ["id"]
          },
        ]
      }
      transaksi_detail: {
        Row: {
          batch: string | null
          expire_date: string | null
          harga: number | null
          id: number
          obat_id: number | null
          qty: number
          subtotal: number | null
          transaksi_id: number
          transaksi_nomor: string | null
        }
        Insert: {
          batch?: string | null
          expire_date?: string | null
          harga?: number | null
          id?: never
          obat_id?: number | null
          qty: number
          subtotal?: number | null
          transaksi_id: number
          transaksi_nomor?: string | null
        }
        Update: {
          batch?: string | null
          expire_date?: string | null
          harga?: number | null
          id?: never
          obat_id?: number | null
          qty?: number
          subtotal?: number | null
          transaksi_id?: number
          transaksi_nomor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaksi_detail_obat_id_fkey"
            columns: ["obat_id"]
            isOneToOne: false
            referencedRelation: "master_obat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaksi_detail_transaksi_id_fkey"
            columns: ["transaksi_id"]
            isOneToOne: false
            referencedRelation: "transaksi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaksi_detail_transaksi_nomor_fkey"
            columns: ["transaksi_nomor"]
            isOneToOne: false
            referencedRelation: "transaksi"
            referencedColumns: ["nomor"]
          },
        ]
      }
      transaksi_jasa: {
        Row: {
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          harga_jasa: number | null
          id: number
          jasa_id: number
          qty: number | null
          subtotal: number | null
          transaksi_id: number
          transaksi_nomor: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          harga_jasa?: number | null
          id?: never
          jasa_id: number
          qty?: number | null
          subtotal?: number | null
          transaksi_id: number
          transaksi_nomor?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          harga_jasa?: number | null
          id?: never
          jasa_id?: number
          qty?: number | null
          subtotal?: number | null
          transaksi_id?: number
          transaksi_nomor?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaksi_jasa_jasa_id_fkey"
            columns: ["jasa_id"]
            isOneToOne: false
            referencedRelation: "master_jasa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaksi_jasa_transaksi_id_fkey"
            columns: ["transaksi_id"]
            isOneToOne: false
            referencedRelation: "transaksi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaksi_jasa_transaksi_nomor_fkey"
            columns: ["transaksi_nomor"]
            isOneToOne: false
            referencedRelation: "transaksi"
            referencedColumns: ["nomor"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assert_no_active_opname: { Args: never; Returns: undefined }
      backward_opname_to_step_one: {
        Args: { p_opname_id: number; p_schedule_obat_ids: Json }
        Returns: undefined
      }
      can_edit_transaksi: { Args: { p_transaksi_id: number }; Returns: boolean }
      complete_opname_step_one: {
        Args: { p_opname_id: number; p_selected_obat_ids: Json }
        Returns: undefined
      }
      create_transaction: { Args: { p_payload: Json }; Returns: Json }
      decrement_obat_qty: {
        Args: { obat_id: number; qty_change: number }
        Returns: undefined
      }
      finish_opname: { Args: { p_opname_id: number }; Returns: undefined }
      has_any_role: { Args: { p_roles: string[] }; Returns: boolean }
      increment_obat_qty: {
        Args: { obat_id: number; qty_change: number }
        Returns: undefined
      }
      insert_transaksi_items: {
        Args: {
          p_items: Json
          p_nomor: string
          p_services: Json
          p_transaksi_id: number
        }
        Returns: undefined
      }
      is_staff: { Args: never; Returns: boolean }
      lock_editable_opname: { Args: { p_opname_id: number }; Returns: string }
      next_transaction_number: { Args: { p_tipe: string }; Returns: string }
      opname_stock_lock_key: { Args: never; Returns: number }
      process_stock_out_request: {
        Args: {
          p_biaya_layanan?: number
          p_diskon?: number
          p_nomor: string
          p_total?: number
        }
        Returns: undefined
      }
      replace_opname_details: {
        Args: { p_obat_ids: Json; p_opname_id: number }
        Returns: undefined
      }
      resolve_opname_difference: {
        Args: { p_detail_id: number; p_reason: string }
        Returns: undefined
      }
      save_opname_details: {
        Args: { p_opname_id: number; p_step: number; p_updates: Json }
        Returns: undefined
      }
      update_opname_selection: {
        Args: { p_opname_id: number; p_selected_obat_ids: Json }
        Returns: undefined
      }
      update_pending_stock_out_request: {
        Args: { p_nomor: string; p_payload: Json }
        Returns: undefined
      }
      update_stock_atomic: {
        Args: { p_items: Json; p_tipe: string }
        Returns: undefined
      }
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
    Enums: {},
  },
} as const
