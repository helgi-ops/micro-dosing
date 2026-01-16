import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Missing Authorization Bearer token" }), { status: 401 });
    }

    const body = await req.json();
    const player_id = String(body.player_id || "");
    const invite_email = String(body.invite_email || "");
    const redirect_to = String(body.redirect_to || "");

    if (!player_id || !invite_email) {
      return new Response(JSON.stringify({ error: "player_id and invite_email required" }), { status: 400 });
    }

    // USER client (uses caller JWT)
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid user session" }), { status: 401 });
    }
    const coach_uid = userData.user.id;

    // Fetch player team_id (RLS must allow coach to read players in their team)
    const { data: player, error: pErr } = await supabaseUser
      .from("players")
      .select("id, team_id")
      .eq("id", player_id)
      .single();

    if (pErr || !player) {
      return new Response(JSON.stringify({ error: "Player not found or access denied" }), { status: 403 });
    }

    // Confirm coach is team member
    const { data: tm, error: tmErr } = await supabaseUser
      .from("team_members")
      .select("id")
      .eq("team_id", player.team_id)
      .eq("user_id", coach_uid)
      .maybeSingle();

    if (tmErr || !tm) {
      return new Response(JSON.stringify({ error: "Not a team member" }), { status: 403 });
    }

    // ADMIN client (service role) to send invite + update players
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: upErr } = await supabaseAdmin
      .from("players")
      .update({ invite_email, invite_sent_at: new Date().toISOString() })
      .eq("id", player_id);

    if (upErr) {
      return new Response(JSON.stringify({ error: upErr.message }), { status: 400 });
    }

    const { data: invited, error: invErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(invite_email, {
      redirectTo: redirect_to || undefined,
    });

    if (invErr) {
      return new Response(JSON.stringify({ error: invErr.message }), { status: 400 });
    }

    return new Response(JSON.stringify({ ok: true, invited }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), { status: 500 });
  }
});
