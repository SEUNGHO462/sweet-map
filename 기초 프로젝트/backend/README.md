Backend (Express + Prisma + MySQL)

Setup
- Node.js 18+
- MySQL 8 (local or cloud)

1) Install deps
- cd backend
- npm install

2) Configure env
- Copy .env.example to .env and set:
  - DATABASE_URL=mysql://sm_user:password@localhost:3306/sweetmap
  - JWT_SECRET=generate_a_random_string
  - PORT=3000 (optional)
  - FRONTEND_ORIGIN=http://localhost:5173

3) Prisma
- npx prisma generate
- npx prisma migrate dev --name init

4) Run
- npm run dev
- Health: GET http://localhost:3000/api/health

API (first slice)
- POST /api/auth/register { email, password, name }
- POST /api/auth/login { email, password }
- POST /api/auth/logout
- GET  /api/auth/me (cookie auth)
- GET  /api/reviews?cafeIds=1,2,3
- POST /api/reviews { cafe_id, rating (1-5), text, photo_url? } (auth)

Notes
- Cookies are httpOnly (name: sm_token) and SameSite=Lax; set secure in production.
- Extend routes for favorites/plans next.

