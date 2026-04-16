# Auth Backend Design — Beneficiary v2

**Date:** 2026-04-16  
**Branch:** beneficiary_v3  
**Status:** Approved

---

## Overview

Add a proper backend authentication system to the Beneficiary app using Next.js API routes (mirroring the sitemanager reference project). The flow covers signup with email confirmation, ID upload to Supabase Storage, profile creation in `beneficiary_profiles`, and login blocked by admin approval status.

---

## Architecture

### New Files
- `app/api/auth/signup/route.ts` — handles registration, ID upload, profile insert
- `app/api/auth/login/route.ts` — handles login with approval status check
- `app/auth/callback/route.ts` — handles Supabase email confirmation code exchange

### Modified Files
- `app/signup/page.tsx` — split Full Name into First Name + Last Name, wire to `/api/auth/signup`, show post-submit success state
- `app/login/login-form.tsx` — call `/api/auth/login` instead of Supabase directly, handle status-based error messages and `?confirmed=true` URL param

---

## Data Flow

### Signup
1. Client validates passwords match and ID file is present/under 5MB
2. POST `/api/auth/signup` with form data (multipart or JSON + base64)
3. Server uploads ID to `beneficiary-ids` bucket at path `{user_id}/{filename}`
4. Server calls `supabase.auth.signUp` with `emailRedirectTo: /auth/callback` — Supabase sends confirmation email
5. Server inserts row into `beneficiary_profiles` using service role key
6. Returns success → frontend shows "Account created! Check your email to confirm your account."

### Email Confirmation
1. User clicks link in email → lands on `/auth/callback?code=...`
2. Server exchanges code for session via `supabase.auth.exchangeCodeForSession`
3. Redirects to `/login?confirmed=true`

### Login
1. POST `/api/auth/login` with email + password
2. Server calls `supabase.auth.signInWithPassword`
3. If Supabase returns `email_not_confirmed` error → 403 "Please confirm your email before logging in."
4. Server queries `beneficiary_profiles` status via service role
5. `approved` → return session token → client redirects to `/dashboard`
6. `pending` → 403 "Your account is pending admin approval. You can log in once approved."
7. `rejected` → 403 "Your account application was not approved. Please contact support."

---

## Field Mapping

### `beneficiary_profiles` table

| Form Field     | Column              | Notes                                      |
|----------------|---------------------|--------------------------------------------|
| First Name     | `first_name`        | Split from single name field               |
| Last Name      | `last_name`         | Split from single name field               |
| Email          | `email`             | Also stored in Supabase auth               |
| Password       | *(auth only)*       | Not stored in profile table                |
| Account Name   | `account_name`      |                                            |
| Bank Name      | `bank_name`         |                                            |
| Account Number | `account_number`    |                                            |
| ID Upload      | `id_verification_key` | Storage key: `{user_id}/{filename}` in `beneficiary-ids` bucket |
| *(auto)*       | `status`            | Always set to `'pending'` on insert        |
| *(auto)*       | `auth_user_id`      | From Supabase auth user ID                 |
| Campaign       | *(untouched)*       | No backend mapping for now                 |

---

## Error Handling

### Signup
| Scenario | Handling |
|---|---|
| Duplicate email | Show "An account with this email already exists." |
| Passwords don't match | Client-side validation, inline error |
| No ID uploaded | Client-side validation, required before submit |
| File > 5MB | Client-side validation before upload |
| Profile insert fails after auth user created | Return success with warning; user contacts support |
| Storage upload fails | Return error before creating auth user |

### Login
| Scenario | Message |
|---|---|
| Wrong password | "Invalid login credentials." |
| Email not confirmed | "Please confirm your email before logging in." |
| Status = pending | "Your account is pending admin approval. You can log in once approved." |
| Status = rejected | "Your account application was not approved. Please contact support." |
| No profile found | Treated as pending |
| Network error | "Something went wrong, please try again." |

### Auth Callback
| Scenario | Handling |
|---|---|
| No code in URL | Redirect to `/login` |
| Invalid/expired code | Redirect to `/login?error=expired` with "This confirmation link has expired. Please sign up again." |

---

## Login Page State

- On load with `?confirmed=true` in URL: show info banner — *"Your account is pending admin approval. You can log in once approved."*
- On load with `?error=expired`: show error banner — *"This confirmation link has expired. Please sign up again."*

---

## Environment Variables Required

All already present in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

---

## Out of Scope
- Admin approval UI (admin sets status directly in Supabase or their own panel)
- Email notification to beneficiary when approved
- Campaign field backend integration
- Password reset flow
