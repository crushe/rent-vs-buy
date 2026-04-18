# Rent vs Buy Calculator

A UK-focused calculator for comparing the long-term financial outcome of renting a home versus buying one, with user-adjustable assumptions, shareable URLs, saved scenarios, and printable summaries.

## Stack

- **Next.js 14** (App Router) on **Netlify**
- **TypeScript** (strict mode)
- **Tailwind CSS** with custom design tokens
- **Supabase** for auth (magic link + Google) and saved scenarios
- **Recharts** for the trajectory chart
- **Vitest** for model tests
- **next/font** for Source Serif 4, IBM Plex Sans, IBM Plex Mono

## Features

- **Calculator** — six user inputs (price, deposit, mortgage rate, fix length, rent, term), five assumption sliders, auto-calculated stamp duty with overrides and first-time buyer / additional home / region rules
- **Shareable URLs** — every change to the scenario updates the URL via `replaceState`; copy-to-clipboard dialog produces compact short URLs (only non-default values are encoded)
- **Save to account** — sign in with Google or a magic link, save scenarios by name, reload them later; all data protected by Supabase row-level security
- **Print to PDF** — browser-native print styling with `@page` rules, hidden chrome, simplified inputs, and A4 pagination

## Project structure

```
src/
├── app/                         Next.js App Router
│   ├── page.tsx                 Landing page at /
│   ├── layout.tsx               Fonts and global metadata
│   ├── globals.css              Design tokens + print styles
│   ├── opengraph-image.tsx      Dynamic OG image (1200×630)
│   ├── sitemap.ts               sitemap.xml generator
│   ├── robots.ts                robots.txt generator
│   └── calculator/
│       ├── page.tsx             The calculator at /calculator
│       └── layout.tsx           Calculator-specific metadata
├── components/
│   ├── AccountDialog.tsx        Sign-in and saved scenarios modal
│   └── ShareDialog.tsx          Share URL modal
└── lib/
    ├── model.ts                 Pure finance model
    ├── urlState.ts              Scenario → query string encoding
    ├── supabase.ts              Supabase browser client factory
    ├── auth.ts                  Auth hook and sign-in helpers
    ├── scenarios.ts             CRUD for saved scenarios
    ├── useAnimatedNumber.ts     RAF-based number interpolation
    └── __tests__/               Vitest unit tests (17 passing)
supabase/
└── schema.sql                   Run in Supabase SQL Editor on first setup
```

## Routes

- `/` — Landing page with pitch and methodology
- `/calculator` — The calculator itself (state syncs to URL query params)
- `/sitemap.xml` — Auto-generated
- `/robots.txt` — Auto-generated
- `/opengraph-image` — Dynamic OG image for social shares

## Running locally

```bash
cp .env.example .env.local      # optional — only needed for the save-to-account feature
npm install
npm run dev                      # http://localhost:3000
npm test                         # runs 17 unit tests
```

Without Supabase env vars set, the app still works with URL sharing and PDF export. The "Sign in" link is hidden automatically.

## Deployment to Netlify

### 1. Push to a GitHub repository

```bash
git init
git add .
git commit -m "Initial commit"
# Create a repo on GitHub and push
```

### 2. Connect to Netlify

- Log in to Netlify, click "Add new site" → "Import an existing project"
- Connect your GitHub repo
- Netlify auto-detects Next.js via `netlify.toml` and the Next.js runtime plugin; no manual configuration needed
- Deploy

### 3. Supabase setup (optional — skip this if you don't want save-to-account)

1. Go to [supabase.com](https://supabase.com) and create a free project
2. In the **SQL Editor**, paste and run `supabase/schema.sql` to create the `scenarios` table and RLS policies
3. In **Settings → API**, copy your project URL and the `anon` public key
4. In Netlify, go to **Site configuration → Environment variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL` — your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your anon key
5. Trigger a redeploy

### 4. Google OAuth (optional)

1. In Google Cloud Console, create an OAuth 2.0 client ID (web application)
2. Add `https://your-project.supabase.co/auth/v1/callback` as an authorised redirect URI
3. In Supabase: **Authentication → Providers → Google**, enable it and paste the client ID + secret
4. In Supabase: **Authentication → URL Configuration**, add your Netlify site URL to "Site URL" and "Redirect URLs"

### 5. Magic link

Enabled by default in Supabase. Customise the email template in **Authentication → Email Templates** if you want branded copy.

## Roadmap

- **Stage 1** ✓ Working calculator, deployable, no persistence
- **Stage 2** ✓ Premium design: editorial typography, restrained palette, expressive motion
- **Stage 3** ✓ Shareable URLs, Supabase auth, saved scenarios, print to PDF
- **Stage 4** ✓ Landing page, proofread copy, SEO meta tags, dynamic OG image, sitemap, structured data

## Notes on the model

All finance logic is in `src/lib/model.ts` as pure, typed functions — no React coupling, unit-testable in isolation. If you ever want to port this to a different frontend or expose it as an API, the model is portable without modification.

The model covers:

- **Stamp duty** for England, Scotland (LBTT), Wales (LTT), and Northern Ireland, with first-time buyer relief and additional-home surcharge
- **Mortgage amortisation** with initial fix and re-fix at a user-set rate for the remainder of the term
- **House appreciation** and carrying costs (maintenance, buildings insurance, both inflation-adjusted)
- **Renter portfolio** split across ISA (tax-free) and GIA (CGT on gains), with annual bed-and-ISA transfers
- **Monthly compounding** throughout for accuracy
- **CGT on GIA gains** at an effective rate (defaults to 15%) applied at exit
