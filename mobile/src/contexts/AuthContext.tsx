import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  user_id: string;
  role: "shipper" | "driver" | "admin";
  full_name?: string | null;
};

type AuthState = {
  userId: string | null;
  userEmail: string | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (uid: string | null) => {
    if (!uid) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, role, full_name")
      .eq("user_id", uid)
      .single();
    if (error) {
      setProfile(null);
      return;
    }
    setProfile(data as Profile);
  }, []);

  const updateFromSession = useCallback(async (session: { user?: { id?: string; email?: string } } | null) => {
    setIsLoading(true);
    const uid = session?.user?.id ?? null;
    setUserId(uid);
    setUserEmail(session?.user?.email ?? null);
    await fetchProfile(uid);
    setIsLoading(false);
  }, [fetchProfile]);

  useEffect(() => {
    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) void updateFromSession(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) void updateFromSession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [updateFromSession]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUserId(null);
    setProfile(null);
  }, []);

  const refetchProfile = useCallback(async () => {
    await fetchProfile(userId);
  }, [fetchProfile, userId]);

  return (
    <AuthContext.Provider value={{ userId, userEmail, profile, isLoading, signOut, refetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
