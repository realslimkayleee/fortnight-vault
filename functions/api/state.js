// Cloudflare Pages Function — sync endpoint for The Fortnight Vault
// Route: /api/state   (same origin as the site, so no CORS needed in-browser)
//
//   GET  /api/state?id=<slug>   -> returns the stored JSON state ({} if none)
//   POST /api/state?id=<slug>   -> body is the full state JSON; stored in KV
//
// Requires a KV namespace bound as VAULT_KV (see README).
// Optional: set a SYNC_SECRET env var to require x-sync-secret on writes.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,x-sync-secret",
};

const keyFor = (id) => "state:" + (id && /^[A-Za-z0-9_-]{1,64}$/.test(id) ? id : "default");

function json(body, status = 200, extra = {}) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store", ...extra },
  });
}

export async function onRequestGet(context) {
  const id = new URL(context.request.url).searchParams.get("id");
  const stored = await context.env.VAULT_KV.get(keyFor(id));
  return json(stored || "{}");
}

export async function onRequestPost(context) {
  const url = new URL(context.request.url);
  const id = url.searchParams.get("id");

  // optional write protection
  const secret = context.env.SYNC_SECRET;
  if (secret) {
    const provided = context.request.headers.get("x-sync-secret") || url.searchParams.get("secret");
    if (provided !== secret) return json({ error: "unauthorized" }, 401);
  }

  let body;
  try {
    body = await context.request.text();
  } catch (e) {
    return json({ error: "bad body" }, 400);
  }
  if (body.length > 2_000_000) return json({ error: "too large" }, 413);
  try {
    JSON.parse(body); // validate
  } catch (e) {
    return json({ error: "invalid json" }, 400);
  }

  await context.env.VAULT_KV.put(keyFor(id), body);
  return json({ ok: true });
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}
