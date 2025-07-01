"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext({
  user: null,
  userData: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  refreshUserData: async () => {},      // <- NEW (typed here so TS/IDE knows)
});

export const AuthProvider = ({ children }) => {
  const [user,       setUser]       = useState(null);
  const [userData,   setUserData]   = useState(null);
  const [loading,    setLoading]    = useState(true);

  /* ------------------------------------------------------------ */
  /*  Internal helper used everywhere we need a fresh user record */
  /* ------------------------------------------------------------ */
  const fetchUserData = async (authUserId) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          "uuid, username, person_id, display_name, phone, email, created_at, first_name, last_name, dob, updated_at, available_tokens, biography, avatar_url"
        )
        .eq("uuid", authUserId)
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

  /* Public wrapper so outside components can re-use it */
  const refreshUserData = async () => {
    if (user) await fetchUserData(user.id);
  };

  /* ------------------------------------------------------------ */
  /*  On mount + on auth events                                   */
  /* ------------------------------------------------------------ */
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error fetching session:", error.message);
        setLoading(false);
        return;
      }

      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await fetchUserData(u.id);
      } else {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          await fetchUserData(u.id);
        } else {
          setUserData(null);
          setLoading(false);
        }
      });

    return () => subscription.unsubscribe();
  }, []);

  /* ------------------------------------------------------------ */
  /*  Supabase sign-in helpers                                     */
  /* ------------------------------------------------------------ */
  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserData(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, userData, loading, signIn, signOut, refreshUserData }} // expose helper
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
