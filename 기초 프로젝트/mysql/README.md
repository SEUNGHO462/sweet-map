MySQL Setup (Sweet Map)

Overview
- This folder is reserved for MySQL schema and backend notes.
- We removed Supabase; the app will use a custom backend (Express/Prisma/MySQL).

What to add here later
- schema/ or prisma/ files for migrations
- docs for API endpoints and ERD
- any SQL snippets you want to keep

Frontend
- The frontend no longer depends on Supabase. Auth and data will call your backend.

Next steps
- Scaffold backend (Express + Prisma + MySQL)
- Implement auth (email/password, JWT via httpOnly cookie)
- Add REST endpoints for reviews/favorites/plans
