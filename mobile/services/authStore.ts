import { create } from "zustand";
import { supabase } from "./supabaseClient";

interface AuthUser {
  id: string;
  email: string;
  role: "student" | "parent" | "teacher" | "admin";
  name: string;
}

interface AuthStore {
  user: AuthUser | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signUp: (email: string, password: string, role: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  restoreToken: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  isSignedIn: false,

  signUp: async (email: string, password: string, role: string, name: string) => {
    try {
      set({ isLoading: true });
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: insertError } = await supabase
          .from("users")
          .insert([
            {
              id: authData.user.id,
              email,
              role,
              name,
            },
          ]);

        if (insertError) throw insertError;

        set({
          user: {
            id: authData.user.id,
            email,
            role: role as any,
            name,
          },
          isSignedIn: true,
        });
      }
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (userError) throw userError;

      set({
        user: userData,
        isSignedIn: true,
      });
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    try {
      set({ isLoading: true });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      set({
        user: null,
        isSignedIn: false,
      });
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  restoreToken: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: userData, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (!error && userData) {
          set({
            user: userData,
            isSignedIn: true,
          });
        }
      }
    } catch (error) {
      console.error("Restore token error:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
