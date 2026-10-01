# Boyz of Rosario — V44 (Render Free + Supabase)

Fresh-start deployment of the Boyz of Rosario portal.

## Architecture

- GitHub: source code
- Render Free Web Service: Node/Express application
- Supabase Free Storage: persistent SQLite database file
- Socket.IO: real-time member location updates

Render Free web services have ephemeral local files, so the application does **not** depend on a local SQLite file for production persistence. The SQLite database is loaded from and saved to a private Supabase Storage bucket.

Supabase's current Free plan includes 500 MB database size and 1 GB file storage. Render Free web services can run Node applications, but their local filesystem is ephemeral.

## Required Render environment variables

Set these in Render:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_STORAGE_BUCKET=boyz-data`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`
- `ADMIN_REGISTRATION_CODE`
- `SESSION_SECRET`
- `MAP_LAT=13.8454`
- `MAP_LNG=121.2060`

Do not commit `.env` or any Supabase secret key.

## Fresh database

This V44 package intentionally starts a new database. It does not migrate the old Railway database.

On the first successful start, the server creates the required SQLite schema and saves `boyz-of-rosario.sqlite` to the private Supabase Storage bucket.

## Local development

1. Copy `.env.example` to `.env`.
2. If Supabase variables are omitted, the server uses a local SQLite fallback.
3. Run `npm install`.
4. Run `npm start`.

## Deployment

Create a GitHub repository and connect it to Render as a Web Service.

Build command:

```text
npm install
```

Start command:

```text
npm start
```

Choose the **Free** web service plan.

## Important

- Do not use Render's local filesystem as the production database.
- Keep `SUPABASE_SECRET_KEY` private. Supabase documents secret keys as server-only credentials that bypass Row Level Security.
- Supabase Free Storage currently has a 50 MB maximum file size per upload. This application limits individual image uploads to 5 MB.
