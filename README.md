# The Fortnight Vault — Cloudflare Pages + KV

Your 14-day sprint tracker, hosted free on Cloudflare Pages, with a tiny sync
endpoint so your morning brief can read your live progress.

```
index.html                 the tracker (open it directly to preview)
functions/api/state.js     the sync endpoint (GET reads, POST writes)
wrangler.toml              config for CLI deploys (KV binding)
```

Everything here runs on Cloudflare's free tier. You need a (free) Cloudflare
account.

---

## What you're standing up

- The **page** at `https://<your-project>.pages.dev` (or your own domain).
- A **sync endpoint** at `/api/state` on the same domain.
- A **KV namespace** (`VAULT_KV`) that stores your progress JSON.

Because the endpoint is on the same domain as the page, there is no CORS to
configure.

---

## Option A — Dashboard (no terminal)  ~10 min

1. **Create the KV namespace.**
   Cloudflare dashboard → **Storage & Databases → KV → Create namespace**.
   Name it `VAULT_KV`. (You don't need to copy the id for this path.)

2. **Create the Pages project.**
   Either drag-and-drop this whole folder at **Workers & Pages → Create →
   Pages → Upload assets**, or connect the GitHub repo you push it to.

3. **Bind KV to the project.**
   Open the Pages project → **Settings → Functions → KV namespace bindings →
   Add binding**.
   - Variable name: `VAULT_KV`
   - KV namespace: the `VAULT_KV` you created.
   Add it to **Production** (and Preview if you want).

4. **(Optional) Lock down writes.**
   Same Settings page → **Environment variables** → add `SYNC_SECRET` = a long
   random string. Then open `index.html` and set `SYNC.secret` to the same value.

5. **Redeploy** (Deployments → Retry/redeploy) so the binding takes effect.

Done. Visit your `*.pages.dev` URL.

---

## Option B — CLI (wrangler)  ~5 min

```bash
npm install -g wrangler
wrangler login

# 1) create the KV namespace, copy the printed id
wrangler kv namespace create VAULT_KV

# 2) paste that id into wrangler.toml  ->  [[kv_namespaces]] id = "..."

# 3) (optional) set a write secret
#    add SYNC_SECRET under [vars] in wrangler.toml, and set SYNC.secret in index.html

# 4) deploy
wrangler pages deploy .
```

Wrangler prints your live URL.

---

## Point your phone at it

Open the live URL on your phone and **Add to Home Screen** (Safari share menu
on iPhone; Chrome ⋮ menu on Android). You'll get the pink-diamond icon that
opens straight to today's Brief.

---

## Wire up your 6 AM "My morning brief" task

1. Open the tracker → **Brief** tab → **Copy feed URL**. It looks like:
   `https://<your-domain>/api/state?id=kaylee-vault-7f3a9c`
2. Add this to your morning-brief task prompt:

   > First, fetch my live sprint progress from
   > `https://<your-domain>/api/state?id=kaylee-vault-7f3a9c`
   > (JSON: `done` = completed task ids, `rituals` = daily 30-min logs,
   > `rewards`/`settings` = my diamond goals). Then run my Cairn sprint brief:
   > tell me what's still undone, what I'm behind on, and how far I am from my
   > goal. Then read my Google Calendar for today and propose a time-blocked
   > schedule that fits today's tasks, my deep-work block, and my 30-minute
   > measurement ritual into the open gaps.

Now the brief reads your *real* checkmarks every morning, not just the plan.

---

## Notes

- **Privacy:** the GET feed is public (it has to be, so the morning brief can
  read it without a login). It only exposes task progress, hours, and diamonds.
  The `?id=` slug makes the URL unguessable; change it in `index.html` (the
  `SYNC.id` value) to rotate it. Set `SYNC_SECRET` to stop others from writing.
- **Cross-device:** progress syncs through KV, so phone and laptop stay in step
  (newest write wins).
- **Free tier:** unlimited bandwidth; ~100k KV reads/day and ~1k writes/day —
  far beyond a personal tracker. Each checkbox tap is one write.
- **Going local-only:** set `SYNC.enabled = false` in `index.html` to disable
  the cloud entirely and store everything in your browser.
