// src/lib/AuthProvider.js
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase"; // adjust path if needed

// Shape of our auth context
const AuthContext = createContext({
  user: null,
  userData: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch session + userData on mount, and subscribe to auth changes
  useEffect(() => {
    // 1) load initial session
    const initAuth = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error fetching session:", sessionError.message);
        setLoading(false);
        return;
      }

      const u = session?.user ?? null;
      setUser(u);

      if (u) {
        await fetchUserData(u.id);
      } else {
        // no logged-in user
        setLoading(false);
      }
    };

    initAuth();

    // 2) listen for login/logout
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);

      if (u) {
        await fetchUserData(u.id);
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Helper: get your custom user row from the "users" table
  const fetchUserData = async (authUserId) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          "uuid, username, person_id, display_name, phone, email, created_at, first_name, last_name, dob, updated_at, available_tokens, biography"
        )
        .eq("uuid", authUserId) // ← match on your uuid FK column
        .single();

      if (error) throw error;
      setUserData(data);
    } catch (err) {
      console.error("Error loading userData:", err.message);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  // Supabase signIn / signOut helpers
  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserData(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, userData, loading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to consume the auth context
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
