// netlify/functions/invite-player.js
import { createClient } from "@supabase/supabase-js";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { team_id, email } = JSON.parse(event.body || "{}");
    if (!team_id || !email) {
      return { statusCode: 400, body: "Missing team_id or email" };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const redirectTo = `${process.env.APP_BASE_URL}/index.html`;

    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    });

    if (error) {
      return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }

    const invitedUserId = data?.user?.id ?? null;

    const { error: upsertErr } = await supabase
      .from("players")
      .upsert(
        {
          team_id,
          invite_email: email,
          auth_user_id: invitedUserId,
          invite_status: "invited",
        },
        { onConflict: "team_id,invite_email" }
      );

    if (upsertErr) {
      console.warn("players upsert error:", upsertErr.message);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        invited: email,
        auth_user_id: invitedUserId,
      }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || String(e) }) };
  }
}
