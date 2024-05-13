export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          id: number;
          name: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          id?: number;
          name?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          id?: number;
          name?: string | null;
        };
        Relationships: [];
      };
      games: {
        Row: {
          category: string | null;
          completed_on: string | null;
          created_at: string | null;
          game: Json | null;
          id: number;
          players: Json[] | null;
          winners: Json[] | null;
        };
        Insert: {
          category?: string | null;
          completed_on?: string | null;
          created_at?: string | null;
          game?: Json | null;
          id?: number;
          players?: Json[] | null;
          winners?: Json[] | null;
        };
        Update: {
          category?: string | null;
          completed_on?: string | null;
          created_at?: string | null;
          game?: Json | null;
          id?: number;
          players?: Json[] | null;
          winners?: Json[] | null;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          body: string | null;
          created_at: string | null;
          id: string;
          profile_id: string;
          topic_id: number | null;
          updated_at: string | null;
        };
        Insert: {
          body?: string | null;
          created_at?: string | null;
          id?: string;
          profile_id: string;
          topic_id?: number | null;
          updated_at?: string | null;
        };
        Update: {
          body?: string | null;
          created_at?: string | null;
          id?: string;
          profile_id?: string;
          topic_id?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notes_profile_id_fkey';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notes_topic_id_fkey';
            columns: ['topic_id'];
            isOneToOne: false;
            referencedRelation: 'topic';
            referencedColumns: ['id'];
          },
        ];
      };
      picks: {
        Row: {
          created_at: string;
          email: string | null;
          id: number;
          topic_category: string | null;
          topic_url: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: number;
          topic_category?: string | null;
          topic_url?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: number;
          topic_category?: string | null;
          topic_url?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          name: string | null;
          score: number | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
          name?: string | null;
          score?: number | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          name?: string | null;
          score?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      rules: {
        Row: {
          answer_buffer: number | null;
          countdown_seconds: number | null;
          created_at: string | null;
          id: number;
          min_players: number | null;
        };
        Insert: {
          answer_buffer?: number | null;
          countdown_seconds?: number | null;
          created_at?: string | null;
          id?: number;
          min_players?: number | null;
        };
        Update: {
          answer_buffer?: number | null;
          countdown_seconds?: number | null;
          created_at?: string | null;
          id?: number;
          min_players?: number | null;
        };
        Relationships: [];
      };
      topic: {
        Row: {
          created_at: string;
          id: number;
          name: string | null;
          user: string | null;
        };
        Insert: {
          created_at?: string;
          id?: number;
          name?: string | null;
          user?: string | null;
        };
        Update: {
          created_at?: string;
          id?: number;
          name?: string | null;
          user?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'topic_user_fkey';
            columns: ['user'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      trivia_questions: {
        Row: {
          answered_on: string | null;
          created_at: string;
          created_by: string | null;
          id: number;
          option_1: string | null;
          option_2: string | null;
          option_3: string | null;
          option_4: string | null;
          percent_correct: number | null;
          question: string | null;
        };
        Insert: {
          answered_on?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: number;
          option_1?: string | null;
          option_2?: string | null;
          option_3?: string | null;
          option_4?: string | null;
          percent_correct?: number | null;
          question?: string | null;
        };
        Update: {
          answered_on?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: number;
          option_1?: string | null;
          option_2?: string | null;
          option_3?: string | null;
          option_4?: string | null;
          percent_correct?: number | null;
          question?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never;
