import { player, historyArr, profile } from "./state.js";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabase = createClient(
  "https://jpaldhwgcifxxqpnimzp.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwYWxkaHdnY2lmeHhxcG5pbXpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTg0ODUsImV4cCI6MjA5NTI3NDQ4NX0.nfpQvnsK7Ts8HjEv0aQ7QSf_Gp5HhFBz6x00scduhb0"
);

export { supabase };

// ===== GET CURRENT USER ID =====
async function getUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
}

// ===== SAVE — sync ke Supabase + localStorage fallback =====
export async function saveLocal() {
  // localStorage fallback (tetap disimpan)
  localStorage.setItem("rimm_balance", player.balance);
  localStorage.setItem("rimm_history", JSON.stringify(historyArr));
  localStorage.setItem("rimm_profile", JSON.stringify(profile));

  // Sync ke Supabase
  const uid = await getUserId();
  if (!uid) return;

  await supabase.from("users").update({
    balance: player.balance,
    win: profile.win,
    lose: profile.lose,
    match: profile.match
  }).eq("id", uid);
}

// ===== LOAD — prioritas dari Supabase =====
export async function loadLocal() {
  const uid = await getUserId();

  if (uid) {
    // Load dari Supabase
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", uid)
        .single();

      if (!error && data) {
        player.balance = data.balance || 10000;
        profile.name = data.username || "Player";
        profile.win = data.win || 0;
        profile.lose = data.lose || 0;
        profile.match = data.match || 0;

        // Sync localStorage juga
        localStorage.setItem("rimm_balance", player.balance);
        localStorage.setItem("rimm_profile", JSON.stringify(profile));
        return;
      }
    } catch(e) {
      console.warn("Supabase load failed, fallback to localStorage:", e);
    }
  }

  // Fallback localStorage
  player.balance = parseInt(localStorage.getItem("rimm_balance")) || 10000;

  try {
    historyArr.length = 0;
    const saved = JSON.parse(localStorage.getItem("rimm_history")) || [];
    historyArr.push(...saved);
  } catch {}

  try {
    const savedProfile = JSON.parse(localStorage.getItem("rimm_profile"));
    if (savedProfile) {
      profile.name = savedProfile.name;
      profile.win = savedProfile.win;
      profile.lose = savedProfile.lose;
      profile.match = savedProfile.match;
    }
  } catch {}
}
