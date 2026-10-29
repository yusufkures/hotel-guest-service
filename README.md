# Hotel Guest Service Management System — Starter

This is a real starter project for a cloud-hosted hotel QR guest-service system.

## Included in this first implementation
- Next.js App Router + TypeScript
- Supabase PostgreSQL schema with rooms, departments, roles, permissions, requests, request history, restaurants and menus
- A public guest page at `/guest/<QR_TOKEN>` with Clean My Room, Do Not Disturb, maintenance and general requests
- A server API that hashes the QR token, checks that it is active, and inserts requests without exposing the service key to the browser
- A starter operator dashboard at `/dashboard` that loads requests server-side using a server-only Supabase service key
- A script to create a configurable room list and unique QR tokens, save printable PNG QR codes and a CSV mapping
- Basic request status update API for the starter dashboard

## Important
This is an initial working foundation, **not yet production-ready**. Before real hotel use, finish staff authentication and role enforcement, email provider integration, rate limiting / abuse protection, upload scanning, backup and recovery testing, monitoring, and a security review. Do not expose `/dashboard` publicly until authentication and authorization are implemented. The dashboard route intentionally shows a warning banner.

## Requirements
- Node.js 20.9+
- A Supabase project
- npm
- Optional: Python 3.10+ to run the QR generator

## 1. Create the app
```bash
npx create-next-app@latest hotel-guest-service --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd hotel-guest-service
npm install @supabase/supabase-js qrcode
```
Copy the `src` directory from this starter into the new app's `src` directory, replacing the generated files as needed. Copy `.env.example` to `.env.local`.

## 2. Create the Supabase database
1. Create a Supabase project.
2. Open **SQL Editor**.
3. Run `supabase/schema.sql`.
4. In Project Settings → API, copy the project URL and the publishable/anon key.
5. Copy the **service_role** key only into `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`. Never put it in a `NEXT_PUBLIC_` variable or commit it to Git.

## 3. Configure environment
Copy `.env.example` to `.env.local` and fill in:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
Keep `.env.local` private. Confirm it is in `.gitignore`.

## 4. Generate 214 unique room QR codes
Install the QR generator dependency in the app (already listed above), then use the included Python generator:
```bash
python -m pip install qrcode[pil]
python scripts/generate_qr_codes.py --base-url http://localhost:3000 --rooms-file scripts/rooms.txt --output-dir generated-qr
```
The default room list is a **placeholder example** from 101 through 314. Edit `scripts/rooms.txt` to match the hotel's actual room numbering before using it. The generator outputs PNG files, a CSV of room/token pairs, and SQL inserts. Treat the CSV and generated SQL as sensitive because the tokens allow guest request submission for the corresponding room. For production, generate tokens and insert them via a secured admin-only workflow instead of manually importing files.

For a quick local test, use the generated SQL file in Supabase SQL Editor after reviewing it. This script stores the SHA-256 token hash in the database and puts the raw token only in the QR URL.

## 5. Run locally
```bash
npm run dev
```
Open `http://localhost:3000`. Use a generated QR URL, or visit `/guest/<token>` with a token from the generated CSV. Requests should appear on `/dashboard` in this starter environment.

## 6. Deployment
Deploy the app to Vercel and set the same environment variables in Project Settings. Set `NEXT_PUBLIC_APP_URL` to the production HTTPS URL. Do not print or share the service role key. Configure a custom domain after testing.

## 7. What remains for the next phase
1. Staff login using Supabase Auth and server-side session verification.
2. Permission checks for Super Administrator, Administrator, Operator, Department Supervisor, Department Staff, and Read-Only roles.
3. An admin-only UI for rooms, users, roles, permissions, departments, routing rules and menu editing.
4. Realtime subscriptions for new requests and status changes.
5. Audible alerts (browser audio may require a staff click to enable).
6. Email alerts through a configured provider such as Resend or SMTP.
7. Safe photo uploads, throttling, request deduplication, audit logs, monitoring and operational testing.

## Security notes
- The public guest endpoint accepts submissions only for active QR tokens.
- Raw QR tokens are not stored in the database; only SHA-256 hashes are stored.
- Guest requests are created through a server route using a server-only service key.
- This starter's dashboard uses a privileged server-side key and is **not safe for public deployment until staff authentication and authorization are added**.
- Do not use the starter for real guest data until the remaining security work is completed and reviewed.
