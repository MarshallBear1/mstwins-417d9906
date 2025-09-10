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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean
          last_activity: string | null
          session_data: Json | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string | null
          session_data?: Json | null
          session_token?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string | null
          session_data?: Json | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      announcement_campaigns: {
        Row: {
          campaign_name: string
          completed_at: string | null
          content: string
          created_at: string
          created_by: string | null
          failed_count: number | null
          id: string
          list_id: string
          sent_at: string | null
          sent_count: number | null
          status: string
          subject: string
        }
        Insert: {
          campaign_name: string
          completed_at?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          failed_count?: number | null
          id?: string
          list_id: string
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          subject: string
        }
        Update: {
          campaign_name?: string
          completed_at?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          failed_count?: number | null
          id?: string
          list_id?: string
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_campaigns_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "announcement_email_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_email_addresses: {
        Row: {
          created_at: string
          email: string
          id: string
          list_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          list_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          list_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_email_addresses_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "announcement_email_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_email_lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          list_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          list_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          list_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_likes: {
        Row: {
          created_at: string
          id: string
          like_count: number
          like_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          like_count?: number
          like_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          like_count?: number
          like_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_referrals: {
        Row: {
          bonus_claimed: boolean
          bonus_claimed_at: string | null
          created_at: string
          id: string
          referral_code: string
          referral_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bonus_claimed?: boolean
          bonus_claimed_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referral_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bonus_claimed?: boolean
          bonus_claimed_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referral_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_processing_log: {
        Row: {
          created_at: string
          id: string
          status: string
          triggered_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          triggered_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          triggered_at?: string
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          error_message: string | null
          id: string
          last_attempt: string | null
          liked_user_id: string
          liker_user_id: string
          message_content: string | null
          processed: boolean | null
          type: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_attempt?: string | null
          liked_user_id: string
          liker_user_id: string
          message_content?: string | null
          processed?: boolean | null
          type: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_attempt?: string | null
          liked_user_id?: string
          liker_user_id?: string
          message_content?: string | null
          processed?: boolean | null
          type?: string
        }
        Relationships: []
      }
      failed_login_attempts: {
        Row: {
          attempt_time: string
          email: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          attempt_time?: string
          email: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          attempt_time?: string
          email?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string | null
          id: string
          message: string
          priority: string
          status: string
          subject: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message: string
          priority?: string
          status?: string
          subject: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          priority?: string
          status?: string
          subject?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      forum_comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "forum_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          likes_count: number
          moderation_status: string | null
          parent_comment_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          moderation_status?: string | null
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          moderation_status?: string | null
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "forum_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_id: string
          comments_count: number
          content: string
          created_at: string
          flair: string
          id: string
          is_pinned: boolean
          likes_count: number
          moderation_status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          comments_count?: number
          content: string
          created_at?: string
          flair?: string
          id?: string
          is_pinned?: boolean
          likes_count?: number
          moderation_status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          comments_count?: number
          content?: string
          created_at?: string
          flair?: string
          id?: string
          is_pinned?: boolean
          likes_count?: number
          moderation_status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          liked_id: string
          liker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          liked_id: string
          liker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          liked_id?: string
          liker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_likes_liked_profile"
            columns: ["liked_id"]
            isOneToOne: false
            referencedRelation: "profile_discovery"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_likes_liked_profile"
            columns: ["liked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_likes_liker_profile"
            columns: ["liker_id"]
            isOneToOne: false
            referencedRelation: "profile_discovery"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_likes_liker_profile"
            columns: ["liker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_matches_user1_profile"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profile_discovery"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_matches_user1_profile"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_matches_user2_profile"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profile_discovery"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_matches_user2_profile"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          match_id: string
          moderation_flag_id: string | null
          moderation_status: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          match_id: string
          moderation_flag_id?: string | null
          moderation_status?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          match_id?: string
          moderation_flag_id?: string | null
          moderation_status?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_messages_receiver_profile"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profile_discovery"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_messages_receiver_profile"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_messages_sender_profile"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profile_discovery"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_messages_sender_profile"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_moderation_flag_id_fkey"
            columns: ["moderation_flag_id"]
            isOneToOne: false
            referencedRelation: "moderation_flags"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_flags: {
        Row: {
          confidence_score: number | null
          content_id: string | null
          content_text: string
          content_type: string
          created_at: string
          flagged_categories: string[] | null
          id: string
          is_flagged: boolean
          moderation_result: Json
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          content_id?: string | null
          content_text: string
          content_type: string
          created_at?: string
          flagged_categories?: string[] | null
          id?: string
          is_flagged?: boolean
          moderation_result: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          content_id?: string | null
          content_text?: string
          content_type?: string
          created_at?: string
          flagged_categories?: string[] | null
          id?: string
          is_flagged?: boolean
          moderation_result?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          body: string
          created_at: string | null
          id: string
          results: Json | null
          sent_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          results?: Json | null
          sent_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          results?: Json | null
          sent_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          from_user_id: string | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      passes: {
        Row: {
          created_at: string
          id: string
          passed_id: string
          passer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          passed_id: string
          passer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          passed_id?: string
          passer_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          about_me: string | null
          additional_photos: string[] | null
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          diagnosis_year: number | null
          extended_profile_completed: boolean | null
          first_name: string
          gender: string | null
          hide_from_discover: boolean | null
          hobbies: string[] | null
          id: string
          last_name: string
          last_seen: string | null
          location: string
          medications: string[] | null
          moderation_flag_id: string | null
          moderation_status: string | null
          ms_subtype: string | null
          selected_prompts: Json | null
          symptoms: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          about_me?: string | null
          additional_photos?: string[] | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          diagnosis_year?: number | null
          extended_profile_completed?: boolean | null
          first_name: string
          gender?: string | null
          hide_from_discover?: boolean | null
          hobbies?: string[] | null
          id?: string
          last_name: string
          last_seen?: string | null
          location: string
          medications?: string[] | null
          moderation_flag_id?: string | null
          moderation_status?: string | null
          ms_subtype?: string | null
          selected_prompts?: Json | null
          symptoms?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          about_me?: string | null
          additional_photos?: string[] | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          diagnosis_year?: number | null
          extended_profile_completed?: boolean | null
          first_name?: string
          gender?: string | null
          hide_from_discover?: boolean | null
          hobbies?: string[] | null
          id?: string
          last_name?: string
          last_seen?: string | null
          location?: string
          medications?: string[] | null
          moderation_flag_id?: string | null
          moderation_status?: string | null
          ms_subtype?: string | null
          selected_prompts?: Json | null
          symptoms?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_moderation_flag_id_fkey"
            columns: ["moderation_flag_id"]
            isOneToOne: false
            referencedRelation: "moderation_flags"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      re_engagement_emails: {
        Row: {
          created_at: string
          email_type: string
          id: string
          sent_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_type: string
          id?: string
          sent_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_type?: string
          id?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      robot_announcements: {
        Row: {
          announcement_type: string
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          message: string
          start_date: string | null
          target_audience: string
          title: string
        }
        Insert: {
          announcement_type?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          message: string
          start_date?: string | null
          target_audience?: string
          title: string
        }
        Update: {
          announcement_type?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          message?: string
          start_date?: string | null
          target_audience?: string
          title?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          event_details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_config: {
        Row: {
          description: string | null
          last_updated: string | null
          setting_key: string
          setting_value: Json
        }
        Insert: {
          description?: string | null
          last_updated?: string | null
          setting_key: string
          setting_value: Json
        }
        Update: {
          description?: string | null
          last_updated?: string | null
          setting_key?: string
          setting_value?: Json
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      system_flags: {
        Row: {
          enabled: boolean | null
          flag_name: string
          updated_at: string | null
        }
        Insert: {
          enabled?: boolean | null
          flag_name: string
          updated_at?: string | null
        }
        Update: {
          enabled?: boolean | null
          flag_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          status?: string
          updated_at?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      welcome_email_queue: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          processed: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          processed?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          processed?: boolean
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profile_discovery: {
        Row: {
          about_me_preview: string | null
          additional_photos: string[] | null
          age: number | null
          avatar_url: string | null
          city: string | null
          extended_profile_completed: boolean | null
          first_name: string | null
          gender: string | null
          hide_from_discover: boolean | null
          hobbies: string[] | null
          id: string | null
          last_seen: string | null
          ms_subtype: string | null
          selected_prompts: Json | null
          user_id: string | null
        }
        Insert: {
          about_me_preview?: never
          additional_photos?: string[] | null
          age?: never
          avatar_url?: string | null
          city?: never
          extended_profile_completed?: boolean | null
          first_name?: string | null
          gender?: string | null
          hide_from_discover?: boolean | null
          hobbies?: string[] | null
          id?: string | null
          last_seen?: string | null
          ms_subtype?: string | null
          selected_prompts?: Json | null
          user_id?: string | null
        }
        Update: {
          about_me_preview?: never
          additional_photos?: string[] | null
          age?: never
          avatar_url?: string | null
          city?: never
          extended_profile_completed?: boolean | null
          first_name?: string | null
          gender?: string | null
          hide_from_discover?: boolean | null
          hobbies?: string[] | null
          id?: string | null
          last_seen?: string | null
          ms_subtype?: string | null
          selected_prompts?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      authenticate_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_admin_rate_limit: {
        Args: {
          action_type: string
          admin_user_id: string
          max_actions?: number
          time_window?: unknown
        }
        Returns: Json
      }
      check_and_increment_daily_likes: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      check_login_rate_limit: {
        Args: { email_input: string; ip_input?: unknown }
        Returns: Json
      }
      claim_referral_bonus: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      clear_failed_login_attempts: {
        Args: { email_input: string }
        Returns: undefined
      }
      create_admin_session: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      debug_likes_info: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      delete_user_account: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      enhanced_log_admin_action: {
        Args: {
          action_details?: Json
          action_type: string
          security_level?: string
        }
        Returns: undefined
      }
      enhanced_rate_limit_check: {
        Args: {
          action_type: string
          max_actions: number
          time_window: unknown
          user_id_param: string
        }
        Returns: boolean
      }
      enhanced_validate_admin_session: {
        Args: { session_token: string }
        Returns: Json
      }
      get_api_version: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_feedback_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          admin_notes: string
          created_at: string
          email: string
          id: string
          message: string
          priority: string
          status: string
          subject: string
          type: string
          updated_at: string
          user_id: string
        }[]
      }
      get_forum_author_display: {
        Args: { author_id: string }
        Returns: Json
      }
      get_matching_profiles: {
        Args: { limit_count?: number; requesting_user_id: string }
        Returns: {
          about_me_preview: string
          additional_photos: string[]
          age: number
          avatar_url: string
          city: string
          extended_profile_completed: boolean
          first_name: string
          gender: string
          hobbies: string[]
          id: string
          ms_subtype: string
          selected_prompts: Json
          user_id: string
        }[]
      }
      get_remaining_likes_today: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_security_setting: {
        Args: { setting_key: string }
        Returns: Json
      }
      get_user_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_email_by_id: {
        Args: { user_id_param: string }
        Returns: string
      }
      get_users_needing_like_refresh_emails: {
        Args: Record<PropertyKey, never>
        Returns: {
          email: string
          first_name: string
          last_like_date: string
          user_id: string
        }[]
      }
      get_users_needing_re_engagement: {
        Args: Record<PropertyKey, never>
        Returns: {
          email: string
          email_type: string
          first_name: string
          hours_offline: number
          last_seen: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_admin_action: {
        Args: { action_details?: Json; action_type: string }
        Returns: undefined
      }
      log_failed_login_attempt: {
        Args: {
          email_input: string
          ip_input?: unknown
          user_agent_input?: string
        }
        Returns: undefined
      }
      log_push_notification_result: {
        Args: {
          body_param: string
          notification_type: string
          result_data?: Json
          title_param: string
          user_id_param: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          event_details_param?: Json
          event_type_param: string
          user_id_param: string
        }
        Returns: undefined
      }
      process_stuck_email_queue: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      reset_daily_likes_for_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      revoke_admin_session: {
        Args: { session_token: string }
        Returns: boolean
      }
      send_announcement_email: {
        Args: {
          campaign_name: string
          email_content: string
          email_subject: string
          list_name: string
        }
        Returns: Json
      }
      trigger_email_queue_processing: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      update_feedback_admin: {
        Args: {
          feedback_id: string
          new_admin_notes?: string
          new_status: string
        }
        Returns: boolean
      }
      update_security_config: {
        Args: { description?: string; setting_key: string; setting_value: Json }
        Returns: undefined
      }
      update_user_last_seen: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      validate_admin_input_security: {
        Args: { input_data: Json; validation_type: string }
        Returns: Json
      }
      validate_admin_session: {
        Args: { session_token: string }
        Returns: Json
      }
      validate_and_refresh_admin_session: {
        Args: { session_token: string }
        Returns: Json
      }
      validate_email: {
        Args: { email_input: string }
        Returns: string
      }
      validate_password_strength: {
        Args: { password_input: string }
        Returns: Json
      }
      validate_text_input: {
        Args: { input_text: string; max_length?: number }
        Returns: string
      }
      validate_user_action: {
        Args: { target_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
