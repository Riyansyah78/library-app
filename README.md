# Library App (React + Supabase)

Minimal library app built with React, Vite and Supabase. Features:
- Clean UI with hover animation on book cards
- Animated carousel for "hot" books of the month (Swiper)
- Admin page to add books and manage borrow requests
- Fine system: Rp 2000 per day late

Quick start (PowerShell):

```powershell
cd C:\Users\inima\Documents\library-app
npm install
# Create a Supabase project and get URL + ANON KEY
setx VITE_SUPABASE_URL "https://your-project.supabase.co"
setx VITE_SUPABASE_ANON_KEY "your-anon-key"
# Close and reopen your terminal to load env vars, then:
npm run dev
```

Supabase schema (SQL):

```sql
-- Enable pgcrypto for gen_random_uuid (optional)
create extension if not exists pgcrypto;

create table books (
  id uuid primary key default gen_random_uuid(),
  title text,
  author text,
  cover_url text,
  copies int,
  hot_month int,
  created_at timestamptz default now()
);

create table borrow_requests (
  id uuid primary key default gen_random_uuid(),
  book_id uuid references books(id),
  user_name text,
  status text,
  borrow_date timestamptz,
  due_date timestamptz,
  return_date timestamptz,
  fine bigint,
  created_at timestamptz default now()
);
```

Notes:
- Recommended books are those with `hot_month` set to the current month (1-12).
- Admin can approve requests; when marking returned the app computes fine: 2000 × days late.

Next steps / improvements:
- Add authentication (Supabase Auth) to restrict admin actions.
- Add cover upload using Supabase Storage.
- Improve validation & error handling.
