// assets/dataClient.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = window.__SUPABASE_URL__;
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
window.supabase = supabase;

// Handle magic-link landing early so session is stored and hash cleared
if (location.hash && location.hash.includes("access_token=")) {
  (async () => {
    try {
      await supabase.auth.getSession();
    } catch (_) {}
    try {
      history.replaceState({}, document.title, location.pathname + location.search);
    } catch (_) {}
  })();
}

export const api = {
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async signInWithEmail(email) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname
      }
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getTeams() {
    const { data, error } = await supabase
      .from("teams")
      .select("id,name,created_at")
      .order("name");
    if (error) throw error;
    return data || [];
  },

  async getPlayers(teamId) {
    const { data, error } = await supabase
      .from("players")
      .select("id,team_id,first_name,last_name,position,status,created_at")
      .eq("team_id", teamId)
      .order("last_name");
    if (error) throw error;
    return data || [];
  },

  async createPlayer(teamId, firstName, lastName, position, status) {
    const { data, error } = await supabase
      .from("players")
      .insert([{
        team_id: teamId,
        first_name: firstName,
        last_name: lastName,
        position: position || null,
        status: status || "active",
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deletePlayer(teamId, playerId) {
    const { error } = await supabase
      .from("players")
      .delete()
      .eq("team_id", teamId)
      .eq("id", playerId);
    if (error) throw error;
  }
};

// debug (valfrjálst)
window.__api = api;
window.__supabase = supabase;
