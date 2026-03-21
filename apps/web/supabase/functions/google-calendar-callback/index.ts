// Google OAuth callback: ?code=...&state=userId → exchange token, store, redirect to app.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors() });
  }
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // userId
  const error = url.searchParams.get("error");

  // Production: https://lybell.app — yerel deneme için Supabase’te APP_URL secret’ı (örn. http://localhost:3001) tanımlanabilir.
  const appUrl = Deno.env.get("APP_URL") || "https://lybell.app";
  const redirectTo = `${appUrl}?google_calendar=callback`;

  if (error || !code || !state) {
    const fail = `${redirectTo}&success=0&reason=${encodeURIComponent(error || "missing_code")}`;
    return Response.redirect(fail, 302);
  }

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!clientId || !clientSecret) {
    return Response.redirect(`${redirectTo}&success=0&reason=config`, 302);
  }

  const callbackUrl = `${supabaseUrl}/functions/v1/google-calendar-callback`;
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: callbackUrl,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    return Response.redirect(`${redirectTo}&success=0&reason=token_exchange`, 302);
  }

  const tokens = await tokenRes.json();
  if (!tokens.refresh_token) {
    return Response.redirect(`${redirectTo}&success=0&reason=no_refresh_token`, 302);
  }
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  const supabase = createClient(supabaseUrl, serviceKey);
  const { error: dbError } = await supabase.from("google_calendar_tokens").upsert(
    {
      user_id: state,
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token || null,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (dbError) {
    const reason = encodeURIComponent(dbError.message || "db");
    return Response.redirect(`${redirectTo}&success=0&reason=${reason}`, 302);
  }

  return Response.redirect(`${redirectTo}&success=1`, 302);
});

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };
}
