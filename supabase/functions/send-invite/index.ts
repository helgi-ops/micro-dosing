import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Body = {
  team_id: string;
  player_id: string;
  email: string;
  redirect_to?: string;
  mode?: "invite" | "resend";
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  // ✅ Handle preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return json(405, { ok: false, error: "Method not allowed" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // ✅ Must have Bearer token from the logged-in coach
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "").trim();
    if (!jwt) return json(401, { ok: false, error: "Missing auth" });

    // User client to validate caller
    const supabaseUser = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );

    const { data: me, error: meErr } = await supabaseUser.auth.getUser();
    if (meErr || !me?.user) return json(401, { ok: false, error: "Unauthorized" });

    const body = (await req.json()) as Body;
    const email = (body.email || "").trim().toLowerCase();
    const team_id = body.team_id;
    const player_id = body.player_id;
    const mode = body.mode ?? "invite";

    if (!team_id || !player_id || !email) {
      return json(400, { ok: false, error: "Missing team_id/player_id/email" });
    }

    // Verify coach membership
    const { data: membership, error: mErr } = await supabaseAdmin
      .from("team_members")
      .select("role")
      .eq("team_id", team_id)
      .eq("user_id", me.user.id)
      .maybeSingle();

    if (mErr || !membership) {
      return json(403, { ok: false, error: "Forbidden (not team member)" });
    }

    // Ensure player belongs to team
    const { data: player, error: pErr } = await supabaseAdmin
      .from("players")
      .select("id, team_id, invite_status, invite_email, auth_user_id, invite_resend_count")
      .eq("id", player_id)
      .maybeSingle();

    if (pErr || !player) return json(404, { ok: false, error: "Player not found" });
    if (player.team_id !== team_id) return json(403, { ok: false, error: "Forbidden (wrong team)" });

    const origin = req.headers.get("origin") ?? "";
    const redirectTo = body.redirect_to ?? `${origin}/index.html`;

    const { data: invited, error: invErr } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo });

    if (invErr) {
      return json(400, { ok: false, error: invErr.message });
    }

    const now = new Date().toISOString();
    const patch: Record<string, any> = {
      invite_email: email,
      invite_status: "invited",
      invite_sent_at: now,
    };

    if (mode === "resend") {
      patch.invite_resend_count = (player as any).invite_resend_count
        ? (player as any).invite_resend_count + 1
        : 1;
    }

    if (invited?.user?.id) patch.auth_user_id = invited.user.id;

    const { error: upErr } = await supabaseAdmin
      .from("players")
      .update(patch)
      .eq("id", player_id);

    if (upErr) {
      return json(500, { ok: false, error: upErr.message });
    }

    return json(200, {
      ok: true,
      player_id,
      email,
      invited_user_id: invited?.user?.id ?? null,
    });
  } catch (e) {
    return json(500, { ok: false, error: String(e) });
  }
});
