# Shree Shyam Traders — Ready-to-run starter

A responsive React + Vite + Supabase dashboard for mobile, desktop and web.

## 1. Install
```bash
npm install
```

## 2. Configure Supabase
Copy `.env.example` to `.env` and set:
```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Use the **Project URL** and the **publishable/anon key** from Supabase. Never put a service-role/secret key in this frontend.

## 3. Run
```bash
npm run dev
```
Open the local URL shown by Vite.

## Current modules
- Dashboard
- Products + stock
- Customers
- Sales view
- Payment overview
- Responsive mobile sidebar

The existing Supabase tables from the setup SQL are used directly.
