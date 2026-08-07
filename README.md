# C-LICON Data Bank — Store Front

Static agent dashboard + Vercel serverless API proxy.

## Required Vercel environment variables

In **Project Settings → Environment Variables** set:

| Name | Example | Notes |
|------|---------|--------|
| `STORE_API_BASE` | `https://your-upstream-api.com` | No trailing slash preferred |
| `STORE_API_KEY` | `your-bearer-token` | Sent as `Authorization: Bearer …` |

Apply to **Production**, **Preview**, and **Development**, then **Redeploy**.

## Deploy

1. Push this repo to GitHub (or connect the folder to Vercel).
2. Set the env vars above.
3. Redeploy. Confirm `https://<your-app>.vercel.app/api/datamart?action=store` returns JSON (not `NOT_FOUND`).

## Local

```bash
npx vercel dev
```

Needs the same env vars (`.env` is gitignored).

## Structure

- `index.html` / `login.html` — UI
- `app.js` / `auth.js` / `protect.js` — client logic + Firebase auth
- `api/datamart.js` — serverless proxy → upstream store API
- `vercel.json` — Node 20 runtime for `/api/*`
