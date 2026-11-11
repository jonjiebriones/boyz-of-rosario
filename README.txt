Boyz of Rosario - photo persistence patch

This server.js includes explicit persistent database saves after these image uploads:
- Member motorcycle photo
- Website logo
- Admin profile photo
- Admin motorcycle photo
- Admin gallery images

Important:
This is a backend-only patch. If images still show as broken after this change, the frontend image rendering or Supabase credentials/bucket access must also be checked. Please provide the full current bor_deploy project ZIP (including public/ and persistent-db.js) to complete that diagnosis.

Replace the project's server.js with this file, run `node --check server.js`, commit, push, and let Render redeploy.
