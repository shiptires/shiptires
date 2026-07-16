"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface CustomerProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  avatar_url: string;
  vehicles: Vehicle[];
  saved_addresses: SavedAddress[];
}

export interface Vehicle {
  year: string;
  make: string;
  model: string;
  tire_size?: string;
}

export interface SavedAddress {
  label: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: CustomerProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string, authUser?: User) => {
    try {
      const { data } = await supabase
        .from("customer_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (data) {
        setProfile(data as CustomerProfile);
        return;
      }
    } catch {
      // DB row doesn't exist or query failed — fall through
    }

    // No DB profile — build a default from auth metadata so pages don't hang
    const u = authUser ?? user;
    if (u) {
      setProfile({
        id: u.id,
        email: u.email || "",
        full_name: u.user_metadata?.full_name || u.user_metadata?.name || "",
        phone: "",
        avatar_url: u.user_metadata?.avatar_url || "",
        vehicles: [],
        saved_addresses: [],
      });
    }
  }, [supabase, user]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id, session.user);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id, session.user);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }, [supabase]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    setUser(null);
    setSession(null);
    setProfile(null);
    window.location.href = "/";
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, signInWithGoogle, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
