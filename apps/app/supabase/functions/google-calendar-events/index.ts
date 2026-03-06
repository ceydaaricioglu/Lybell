// Returns Google Calendar events for the authenticated user (Free: read-only).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors() });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ connected: false, events: [], reason: "no_auth" }), {
      status: 200,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const token = authHeader.slice(7);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: { user }, error: userError } = await supabaseAnon.auth.getUser(token);

  if (userError || !user) {
    return new Response(JSON.stringify({ connected: false, events: [], reason: "invalid_session" }), {
      status: 200,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  const timeMin = body?.timeMin || new Date().toISOString();
  const timeMax = body?.timeMax || new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(supabaseUrl, serviceKey);
  const { data: row } = await supabaseAdmin
    .from("google_calendar_tokens")
    .select("refresh_token, access_token, expires_at")
    .eq("user_id", user.id)
    .single();

  if (!row) {
    return new Response(JSON.stringify({ connected: false, events: [], reason: "no_token" }), {
      status: 200,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  let accessToken = row.access_token;
  let expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;

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
      return new Response(JSON.stringify({ connected: false, events: [], reason: "refresh_failed" }), {
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

  const calUrl = `${CALENDAR_API}?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;
  const calRes = await fetch(calUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!calRes.ok) {
    return new Response(JSON.stringify({ connected: false, events: [], reason: "calendar_api_error" }), {
      status: 200,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const cal = await calRes.json();
  const events = (cal.items || []).map((e: any) => {
    const start = e.start?.dateTime || e.start?.date;
    const end = e.end?.dateTime || e.end?.date;
    const startDate = start ? new Date(start) : null;
    const allDay = !e.start?.dateTime;
    return {
      id: e.id,
      title: e.summary || "(Etkinlik)",
      start: start || "",
      end: end || "",
      allDay: !!allDay,
      date: startDate ? String(startDate.getDate()) : "",
      time: startDate && !allDay ? `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}` : "",
      source: "google",
    };
  });

  return new Response(JSON.stringify({ connected: true, events }), {
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
