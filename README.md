# KORRECT website

React + Vite + Supabase. Run `npm install` then `npm run dev`.

## Where to edit things
- News articles: `src/data/news.js` (add an object, give it a unique `slug`)
- Quadtum logo: save the file as `public/quadtum-logo.png` (a text mark shows until it exists)
- Team names: `src/pages/Quadtum.jsx`
- Beginner's guide text: `src/pages/Guide.jsx`
- Colors, fonts, layout: `src/App.css` (variables at the top)
- APK file / name: `src/pages/Download.jsx`
- Admin PDF report: `src/lib/pdfReport.js` (no extra packages needed)

## Pages
/ , /news , /news/:slug , /guide , /quadtum , /play (hidden login / sign-up) , /download , /account , /admin

## Database
No Supabase tables, policies, functions or triggers were changed. The site only reads and writes
the tables and functions it already used. The 14-day username cooldown is stored in the account's
own metadata (`username_changed_at`), not in a new column.