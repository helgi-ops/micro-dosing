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
      .select("id,team_id,first_name,last_name,position,status,invite_email,invite_sent_at,auth_user_id,created_at")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true });
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

  async deletePlayer(playerId) {
    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", playerId);
    if (error) throw error;
  },

  async createInvite(teamId, playerId, email) {
    const { data, error } = await supabase
      .from("player_invites")
      .upsert([{
        team_id: teamId,
        player_id: playerId,
        email: (email || "").trim().toLowerCase(),
        created_by: (await supabase.auth.getUser()).data?.user?.id || null,
      }], { onConflict: "player_id" })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getMyInvites() {
    const user = (await supabase.auth.getUser()).data?.user;
    const email = (user?.email || "").trim().toLowerCase();
    if (!email) return [];
    const { data, error } = await supabase
      .from("player_invites")
      .select("id,team_id,player_id,email,accepted_at,created_at")
      .eq("email", email)
      .is("accepted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async acceptInvite(inviteId) {
    const { data, error } = await supabase
      .rpc("accept_player_invite", { _invite_id: inviteId });
    if (error) throw error;
    return data;
  }
};

// debug (valfrjálst)
window.__api = api;
window.__supabase = supabase;
