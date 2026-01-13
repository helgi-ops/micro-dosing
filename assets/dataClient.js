// assets/dataClient.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = window.__SUPABASE_URL__;
const SUPABASE_ANON_KEY = window.__SUPABASE_ANON_KEY__;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
      emailRedirectTo: "https://effervescent-cascaron-c992ff.netlify.app"
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

  async createPlayer(teamId, payload) {
    const row = {
      team_id: teamId,
      first_name: payload.first_name,
      last_name: payload.last_name,
      position: payload.position || null,
      status: payload.status || "active",
    };
    const { data, error } = await supabase
      .from("players")
      .insert(row)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// debug (valfrjálst)
window.__api = api;
window.__supabase = supabase;
