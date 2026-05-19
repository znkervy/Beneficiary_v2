# Beneficiary App

Next.js 16 frontend for the Beneficiary portal with Supabase email/password authentication.

## Features

- Supabase email/password login
- Session-aware redirects
- Protected dashboard route
- Cookie refresh handling with Next.js `proxy.ts`

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth

## Requirements

- Node.js 20 or newer
- npm
- A Supabase project

## Project Setup From Scratch

### 1. Install dependencies

```bash
npm install
```

### 2. Create your environment file

Create `.env.local` in the project root.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can also copy the sample file:

```bash
copy .env.example .env.local
```

If you already use `.env`, that also works, but `.env.local` is the safer local default for Next.js.

### 3. Configure Supabase Auth

In your Supabase dashboard:

1. Open `Authentication`.
2. Make sure `Email` provider is enabled.
3. Go to `Users`.
4. Create a user manually, or sign one up through your own flow later.

Use that same email and password on the app login page.

### 4. Run the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3006
```

The root route automatically redirects:

- to `/dashboard` if a session exists
- to `/login` if no session exists

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Authentication Flow

### Login

- The login page submits email and password to Supabase using `signInWithPassword`.
- On success, the app redirects to `/dashboard`.
- On failure, the login form shows the Supabase error message.

### Protected Routes

- `/dashboard` checks the current Supabase user on the server.
- Unauthenticated users are redirected back to `/login`.

### Session Refresh

- `proxy.ts` refreshes auth cookies for incoming requests.
- Shared Supabase helpers live under `utils/supabase/`.

## Important Files

- `app/login/page.tsx` - login page shell and session redirect
- `app/login/login-form.tsx` - client-side login form
- `app/dashboard/page.tsx` - protected dashboard page
- `app/page.tsx` - root redirect logic
- `proxy.ts` - auth cookie refresh entry point
- `utils/supabase/client.ts` - browser Supabase client
- `utils/supabase/server.ts` - server Supabase client
- `utils/supabase/middleware.ts` - session refresh helper
- `.env.example` - sample environment variables

## Verification

The current setup has been checked with:

```bash
npm run lint
npm run build
```

Notes:

- `npm run build` passes.
- `npm run lint` passes with warnings only for the existing `<img>` tags, which Next.js recommends replacing with `next/image`.

## Current Limitation

This implementation supports login for existing Supabase Auth users. It does not yet include:

- sign up
- forgot password
- sign out

Those can be added next if needed.


login credential sample: 
email: sample@hopecard.com
password: sample1
