BOYZ OF ROSARIO — COMBINED ADMIN DASHBOARD + APPROVAL FIX

Files to replace in your project root:
- server.js
- public/admin.html

Includes:
- Robust member/admin dashboard API response parsing and member array handling.
- Admin dashboard/menu fixes from the dashboard patch.
- Better HTTP error messages when the server returns HTML/non-JSON.
- Safer member status endpoint with ID/status validation and clear JSON errors. It responds promptly and then attempts persistence. Also removes large base64 motorcycle-photo fields from the main admin members-list response; those fields are not used by the member cards, and were making GET /api/admin/members return several megabytes, increasing load and timeout risk.

BACK UP BEFORE REPLACING
From Command Prompt in C:\Users\Jonjie\OneDrive\Desktop\bor_new run:
  copy server.js server.js.before-approval-fix
  copy public\admin.html public\admin.html.before-approval-fix

Extract this ZIP into that folder and overwrite the two files, preserving public\admin.html. Then run:
  git add server.js public/admin.html
  git commit -m "Fix admin dashboard and member approval"
  git push

Wait for Render to finish deploying. Open the admin page and press Ctrl+F5. Try approving ONE member, then refresh the page to confirm the status remains approved. Check Render application logs for either “Member status saved to Supabase Storage.” or “Member status changed but database save failed:”.

IMPORTANT: This patch does not include or overwrite your SQLite database, .env, Supabase credentials, or any user data. Keep .env out of GitHub. Because persistence is asynchronous to avoid the 502, verify after refresh that the status was saved; if it reverts, inspect the Render log error before trying again.


Additional diagnostic basis: the browser Network screenshot showed GET /api/admin/members returning about 7.7 MB and taking about 6.8 seconds, followed by 502 responses. The members list now returns only fields needed by the admin list/map. This does not delete any photos from SQLite or Supabase Storage; photo data remains in the database and dedicated photo-request endpoints.
