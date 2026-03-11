# DIGIBRO Deployment

## Frontend

1. Install dependencies: `npm install`
2. Start locally: `npm run dev`
3. Production build: `npm run build`
4. Deploy the generated frontend to Vercel or Netlify from the project root.

## Backend

1. Copy `backend/.env.example` to `.env` and fill in production values.
2. Start the API locally with `node backend/server.js`.
3. Deploy the backend to a VPS, Railway, Render, or any Node host with the same environment variables.
4. Point the frontend API base URL to your backend host for contact, booking, admin, portfolio, blog, and services data.

## Recommended Production Setup

1. Frontend: Vercel or Netlify with environment-aware API endpoint configuration.
2. Backend: VPS or container host running Node 20+ behind Nginx.
3. Database: MongoDB Atlas with IP allowlisting and database user rotation.
4. Secrets: store JWT, SMTP, and Mongo credentials in provider environment variables only.
5. Media: use a CDN or object storage bucket for portfolio and blog assets.

## Admin Credentials For Demo UI

1. Email: `admin@digibro.agency`
2. Password: `digibro123`

Replace the demo frontend login flow with the included Express JWT route for production.