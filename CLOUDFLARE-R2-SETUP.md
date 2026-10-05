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

Because the portal displays these images directly in normal `<img>` elements, the bucket needs a public read URL.

For a quick setup, enable the bucket's **Public Development URL (r2.dev)**. For production, use a custom domain connected to the bucket.

Copy the resulting public URL, for example:

`https://<your-bucket-subdomain>.r2.dev`

## 4. Add these Render environment variables

Add them to the `boyz-of-rosario` service. Do not put the secret values in GitHub.

```text
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=YOUR_R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY=YOUR_R2_SECRET_ACCESS_KEY
R2_BUCKET=boyz-of-rosario-media
R2_PUBLIC_BASE_URL=https://YOUR_PUBLIC_R2_DOMAIN
```

Keep your existing Supabase variables because the current app uses Supabase Storage to persist the SQLite database file.

## 5. Deploy

After Render redeploys, new image uploads will go directly to R2. Existing Supabase image URLs are not automatically deleted, so existing photos continue to work.

If R2 is not configured, this code safely falls back to the existing Supabase media bucket.

## Important

Do not commit `R2_SECRET_ACCESS_KEY` to GitHub and do not send it in chat. Enter it only in Render Environment Variables.
