// Pro: Uygulama görevini Google Takvim'de oluştur / güncelle / sil
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors() });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ ok: false, error: "no_auth" }), {
      status: 200,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const token = authHeader.slice(7);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: { user }, error: userError } = await supabaseAnon.auth.getUser(token);

  if (userError || !user) {
    return new Response(JSON.stringify({ ok: false, error: "invalid_session" }), {
      status: 200,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  const { action, taskId, title, startDateTime, endDateTime, description, googleEventId } = body as {
    action?: string;
    taskId?: string;
    title?: string;
    startDateTime?: string;
    endDateTime?: string;
    description?: string;
    googleEventId?: string;
  };

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(supabaseUrl, serviceKey);
  const { data: row } = await supabaseAdmin
    .from("google_calendar_tokens")
    .select("refresh_token, access_token, expires_at")
    .eq("user_id", user.id)
    .single();

  if (!row) {
    return new Response(JSON.stringify({ ok: false, error: "no_token" }), {
      status: 200,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  let accessToken = row.access_token;
  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  if (!accessToken || Date.now() >= expiresAt - 60 * 1000) {
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const refreshRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        refresh_token: row.refresh_token,
        grant_type: "refresh_token",
      }).toString(),
    });
    if (!refreshRes.ok) {
      return new Response(JSON.stringify({ ok: false, error: "refresh_failed" }), {
        status: 200,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }
    const tokens = await refreshRes.json();
    accessToken = tokens.access_token;
    const newExpires = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;
    await supabaseAdmin.from("google_calendar_tokens").update({
      access_token: accessToken,
      expires_at: newExpires,
      updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);
  }

  if (action === "delete") {
    if (!googleEventId) {
      return new Response(JSON.stringify({ ok: false, error: "missing_google_event_id" }), {
        status: 200,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }
    const delRes = await fetch(`${CALENDAR_API}/${encodeURIComponent(googleEventId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!delRes.ok && delRes.status !== 404) {
      return new Response(JSON.stringify({ ok: false, error: "delete_failed" }), {
        status: 200,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }
    if (taskId) {
      await supabaseAdmin.from("tasks").update({ google_event_id: null }).eq("id", taskId).eq("user_id", user.id);
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  if (action === "create" || action === "update") {
    if (!title || !startDateTime) {
      return new Response(JSON.stringify({ ok: false, error: "missing_title_or_start" }), {
        status: 200,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }
    const end = endDateTime || (() => {
      const start = new Date(startDateTime);
      start.setHours(start.getHours() + 1);
      return start.toISOString();
    })();
    const eventBody = {
      summary: title,
      description: description || "",
      start: { dateTime: startDateTime, timeZone: "UTC" },
      end: { dateTime: end, timeZone: "UTC" },
    };

    if (action === "create") {
      const createRes = await fetch(CALENDAR_API, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      });
      if (!createRes.ok) {
        const errText = await createRes.text();
        return new Response(JSON.stringify({ ok: false, error: "create_failed", detail: errText }), {
          status: 200,
          headers: { ...cors(), "Content-Type": "application/json" },
        });
      }
      const created = await createRes.json();
      const eventId = created.id;
      if (taskId && eventId) {
        await supabaseAdmin.from("tasks").update({ google_event_id: eventId }).eq("id", taskId).eq("user_id", user.id);
      }
      return new Response(JSON.stringify({ ok: true, googleEventId: eventId }), {
        status: 200,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      if (!googleEventId) {
        return new Response(JSON.stringify({ ok: false, error: "missing_google_event_id" }), {
          status: 200,
          headers: { ...cors(), "Content-Type": "application/json" },
        });
      }
      const patchRes = await fetch(`${CALENDAR_API}/${encodeURIComponent(googleEventId)}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      });
      if (!patchRes.ok) {
        return new Response(JSON.stringify({ ok: false, error: "update_failed" }), {
          status: 200,
          headers: { ...cors(), "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ ok: false, error: "invalid_action" }), {
    status: 200,
    headers: { ...cors(), "Content-Type": "application/json" },
  });
});

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };
}
