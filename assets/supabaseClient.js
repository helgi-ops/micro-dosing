import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://tbtkxttiwbdmugjivmvb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRidGt4dHRpd2JkbXVnaml2bXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjYxOTgsImV4cCI6MjA4MzkwMjE5OH0.2PvhrzwYdx5oxf_oARFIio5Es8mgv3_ks3CAqxUcsKI";

export const supabase =
  window.__supabase ??
  (window.__supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
  }));

// compat bridge for older modules
window.supabase = window.__supabase;
window.api = window.api || {};
window.api.supabase = window.__supabase;
