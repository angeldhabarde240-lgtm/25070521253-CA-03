# 25070531253

Minimal Sign Up / Sign In app built with React, Node.js, Express, and MongoDB.

## Run locally

1. Start MongoDB locally, or create a MongoDB Atlas connection string.
2. `npm run install:all`
3. Copy `server/.env.example` to `server/.env` and update `MONGO_URI` and `JWT_SECRET`.
4. Run `npm run dev` from the project root, then open `http://localhost:5173`.

## API routes

- `POST /api/auth/signup` — `{ name, email, password }` → creates a user (password hashed with bcrypt)
- `POST /api/auth/signin` — `{ email, password }` → returns a JWT and the user
- `GET /api/auth/me` — `Authorization: Bearer <token>` → returns the signed-in user
