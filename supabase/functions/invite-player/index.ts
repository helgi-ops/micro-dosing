import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Body = {
  team_id: string;
  player_id: string;
  email: string;
  redirect_to?: string;
  mode?: "invite" | "resend";
};

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) return new Response("Missing auth", { status: 401 });

    // User client to validate caller
    const supabaseUser = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );

    const { data: me, error: meErr } = await supabaseUser.auth.getUser();
    if (meErr || !me?.user) return new Response("Unauthorized", { status: 401 });

    const body = (await req.json()) as Body;
    const email = (body.email || "").trim().toLowerCase();
    const team_id = body.team_id;
    const player_id = body.player_id;
    const mode = body.mode ?? "invite";

    if (!team_id || !player_id || !email) {
      return new Response("Missing team_id/player_id/email", { status: 400 });
    }

    // Verify coach membership
    const { data: membership, error: mErr } = await supabaseAdmin
      .from("team_members")
      .select("role")
      .eq("team_id", team_id)
      .eq("user_id", me.user.id)
      .maybeSingle();

    if (mErr || !membership) {
      return new Response("Forbidden (not team member)", { status: 403 });
    }

    // Ensure player belongs to team
    const { data: player, error: pErr } = await supabaseAdmin
      .from("players")
      .select("id, team_id, invite_status, invite_email, auth_user_id")
      .eq("id", player_id)
      .maybeSingle();

    if (pErr || !player) return new Response("Player not found", { status: 404 });
    if (player.team_id !== team_id) return new Response("Forbidden (wrong team)", { status: 403 });

    const redirectTo =
      body.redirect_to ??
      `${req.headers.get("origin") ?? ""}/index.html`;

    const { data: invited, error: invErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      { redirectTo }
    );

    if (invErr) {
      return new Response(JSON.stringify({ ok: false, error: invErr.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
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

    const { error: upErr } = await supabaseAdmin.from("players").update(patch).eq("id", player_id);
    if (upErr) {
      return new Response(JSON.stringify({ ok: false, error: upErr.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, player_id, email, invited_user_id: invited?.user?.id ?? null }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
