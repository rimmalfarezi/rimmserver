import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://jpaldhwgcifxxqpnimzp.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwYWxkaHdnY2lmeHhxcG5pbXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTg0ODUsImV4cCI6MjA5NTI3NDQ4NX0.nfpQvnsK7Ts8HjEv0aQ7QSf_Gp5HhFBz6x00scduhb0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ===== AUTH =====
export async function signUp(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } }
  });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ===== USER DATA =====
export async function loadUserData(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

export async function saveUserData(userId, payload) {
  const { error } = await supabase
    .from("users")
    .update(payload)
    .eq("id", userId);
  if (error) console.error("Save error:", error);
}
