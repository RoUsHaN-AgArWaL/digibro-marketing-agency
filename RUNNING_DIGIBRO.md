# How to Run DIGIBRO (Fixed & Production-Ready)

This describes the fully working setup and what was changed to eliminate errors and enable backend integration.

## What was fixed

- Backend no longer crashes when MONGODB_URI is missing. It runs in demo mode with in-memory fallback arrays for appointments and messages.
- Auth login works against Mongo when available, and falls back to a demo admin (email: admin@digibro.agency, password: digibro123).
- Frontend Contact and Book forms POST to `/api/messages` and `/api/appointments` first, then fallback to localStorage if the API is not running.
- Protected admin dashboard fetches live data from the backend when a token exists.
- Added `.env` for the backend with safe defaults for local running.
- CORS accepts vite dev and preview ports.

## How to run (two processes)

1) Install deps (already done).
2) Start the frontend dev server:

   npm run dev

   Visit http://localhost:5173

3) In another terminal, start the backend API:

   cd backend && node server.js

   Backend runs on http://localhost:4000

   You can hit http://localhost:4000/api/health to confirm.

Note: If you do not have MongoDB locally, just leave MONGODB_URI empty in backend/.env. The API will run in demo mode without a database and all routes work with in-memory storage.

## Admin access

- URL: http://localhost:5173/admin/login
- Email: admin@digibro.agency
- Password: digibro123

The protected /admin dashboard will show appointments and messages from the API (or the local demo store if Mongo is not connected).

## Production notes

- For real persistence, set MONGODB_URI in backend/.env.
- Set JWT_SECRET to a strong secret.
- Configure SMTP vars if you want email notifications.
- Frontend build is unchanged: npm run build produces a production bundle.

Selected files updated to resolve the “how to run” issue:
- backend/.env (created)
- backend/config/db.js (graceful missing DB handling)
- backend/server.js (CORS and health note)
- backend/routes/appointments.js (in-memory fallback)
- backend/routes/messages.js (in-memory fallback)
- backend/routes/auth.js (demo admin login fallback)
- src/App.tsx (Contact and Book forms now hit API first with fallback)