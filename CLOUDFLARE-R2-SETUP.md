# Boyz of Rosario — Cloudflare R2 image storage setup

This version keeps the existing Supabase database/persistence setup, but sends new uploaded media to Cloudflare R2 instead of serving/storing the media through Render.

## What moves to R2

- Member motorcycle photos
- Admin profile photos
- Admin motorcycle photos
- Website logo uploads
- Event photos
- Gallery photos
- Event attendance/venue proofs

The database continues to store only the image URL.

## 1. Create an R2 bucket

In Cloudflare Dashboard → R2 → Create bucket, use:

`boyz-of-rosario-media`

Use Standard storage.

## 2. Create an R2 API token

R2 → Manage R2 API Tokens → Create API token.

Use **Object Read & Write** and restrict it to the `boyz-of-rosario-media` bucket.

Copy the Access Key ID and Secret Access Key. The secret cannot be viewed again later.

## 3. Enable public read access

The application now retrieves R2 objects privately from the Render server and serves them through the same website domain at `/api/media`. Visitors' phones and browsers do not need to resolve or contact the R2 public hostname. A public bucket URL is not required for new uploads.

Keep the existing `r2.dev` URL in `R2_PUBLIC_BASE_URL` temporarily so the application can recognize and proxy image URLs saved by older deployments. For production, you may later replace it with a custom domain, but it is not used for new photo delivery.

Example legacy public URL:

`https://<your-bucket-subdomain>.r2.dev`

## 4. Add these Render environment variables

Add them to the `boyz-of-rosario` service. Do not put the secret values in GitHub.

```text
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=YOUR_R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY=YOUR_R2_SECRET_ACCESS_KEY
R2_BUCKET=boyz-of-rosario-media
# Optional: legacy public URL, used to translate old stored links into same-origin proxy URLs.
R2_PUBLIC_BASE_URL=https://YOUR_PUBLIC_R2_DOMAIN
```

Keep your existing Supabase variables because the current app uses Supabase Storage to persist the SQLite database file.

## 5. Deploy

After Render redeploys, new image uploads will go directly to R2, but the database stores an internal `r2://` reference and API responses expose only the same-origin `/api/media` proxy URL. Older saved `r2.dev` links are also translated to the proxy, so mobile users and other networks do not depend on their local DNS resolving the R2 hostname. Existing Supabase image URLs continue to use the Supabase proxy.

If R2 is not configured, this code safely falls back to the existing Supabase media bucket.

## Important

Do not commit `R2_SECRET_ACCESS_KEY` to GitHub and do not send it in chat. Enter it only in Render Environment Variables.
