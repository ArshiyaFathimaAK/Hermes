/**
 * Types for the Supabase tables in supabase/migrations, in the shape `supabase gen types` writes.
 *
 * Written by hand while the migrations are only a proposal. Once they're applied, replace this
 * whole file with generated types, and again after every migration:
 *   Supabase connector: generate_typescript_types, or
 *   npx supabase gen types typescript --project-id zlcclaqiilsakslcqjqs > src/services/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string; created_at: string; updated_at: string };
        Insert: { id: string; display_name?: string; created_at?: string; updated_at?: string };
        Update: { display_name?: string };
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string;
          name: string;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          start_date?: string | null;
          end_date?: string | null;
        };
        Relationships: [];
      };
      trip_places: {
        Row: {
          trip_id: string;
          place_id: string;
          position: number;
          stay_id: string | null;
          created_at: string;
        };
        Insert: {
          trip_id: string;
          place_id: string;
          position?: number;
          stay_id?: string | null;
          created_at?: string;
        };
        Update: { position?: number; stay_id?: string | null };
        Relationships: [
          {
            foreignKeyName: 'trip_places_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
      trip_items: {
        Row: {
          id: string;
          trip_id: string;
          place_id: string;
          activity_id: string;
          day: number | null;
          slot: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          place_id: string;
          activity_id: string;
          day?: number | null;
          slot?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: { day?: number | null; slot?: string | null; sort_order?: number };
        Relationships: [
          {
            foreignKeyName: 'trip_items_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
      share_links: {
        Row: { trip_id: string; token: string; created_at: string };
        Insert: { trip_id: string; token?: string; created_at?: string };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: 'share_links_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: true;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
      recent_places: {
        Row: {
          owner_id: string;
          place_id: string;
          name: string;
          region: string;
          viewed_at: string;
        };
        Insert: {
          owner_id?: string;
          place_id: string;
          name: string;
          region?: string;
          viewed_at?: string;
        };
        Update: { name?: string; region?: string; viewed_at?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      get_shared_trip: { Args: { share_token: string }; Returns: Json };
      is_trip_owner: { Args: { trip: string }; Returns: boolean };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
