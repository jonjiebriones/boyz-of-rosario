# Boyz of Rosario — Reliability Patch

This package is based on the latest supplied Boyz of Rosario image-fix project.

## Included reliability changes
- Serialized/coalesced database persistence to Supabase Storage.
- Critical attendance operations wait for database persistence before returning success:
  - venue-photo proof submission
  - attendance QR token creation
  - admin QR scan/check-in
  - member approval/status changes
- Attendance scans are idempotent: rescanning an already-present member does not overwrite the original check-in timestamp.
- Graceful SIGTERM/SIGINT shutdown attempts to save the database before the process exits.
- Retains the existing Supabase image proxy and legacy image URL conversion.
- No database is included or reset by this patch.

## Deploy
1. Back up your current project folder and Supabase Storage buckets first.
2. Extract this ZIP into a separate folder and inspect the changes.
3. Copy the package files over your existing project files. Keep your `.env` and all Supabase secrets private.
4. Run `npm install`.
5. Run `node --check server.js` and `node --check persistent-db.js`.
6. Commit and push to GitHub; Render should deploy from the connected repository.

## Required production configuration
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (server-side secret key/service-role equivalent; never expose it in browser code)
- `SUPABASE_STORAGE_BUCKET` (default `boyz-data`)
- `SUPABASE_MEDIA_BUCKET` (default `boyz-media`)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET`
- map configuration if needed

## Important availability limitation
Your Render service is configured on the Free plan. Render Free web services spin down after inactivity and the first request after sleep can be delayed. That is not 24/7 availability and is unsuitable to promise uninterrupted live event check-in. For an event where QR attendance must work continuously, use an always-on web service and a proper managed transactional database (preferably Supabase Postgres rather than a whole SQLite file uploaded to Storage).

## Before a real event
Run a test event with 2–3 test members and verify:
- member logs in and submits a venue photo
- attendance QR is generated for the selected event
- admin scanner accepts a valid QR once
- second scan reports already present without creating a duplicate
- invalid, suspended, wrong-event and no-proof QR codes are rejected
- attendance remains present after a service restart
- both admin and member profile photos and gallery images load on mobile data and Wi-Fi

This patch improves persistence behavior but does not certify the live Render/Supabase deployment. Test it before relying on it for an official event.


## Event-day QR attendance
See EVENT-DAY-QR-ATTENDANCE.txt for the new admin-generated event QR flow, member registration verification, fund confirmation and venue-photo submission.
