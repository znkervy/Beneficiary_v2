# Auth Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up signup, email confirmation, and approval-gated login for the Beneficiary app using Next.js API routes and Supabase.

**Architecture:** Three new API route files handle registration (with ID upload to Supabase Storage and profile insert into `beneficiary_profiles`), login (with approval status check), and email confirmation callback. The signup and login forms are updated to call these routes and display the correct status messages.

**Tech Stack:** Next.js 16 App Router, Supabase JS v2, `@supabase/ssr`, TypeScript

**Spec:** `docs/superpowers/specs/2026-04-16-auth-backend-design.md`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `app/api/auth/signup/route.ts` | Upload ID to storage, create auth user, insert `beneficiary_profiles` row |
| Create | `app/api/auth/login/route.ts` | Authenticate user, check `beneficiary_profiles.status`, return session tokens |
| Create | `app/auth/callback/route.ts` | Exchange Supabase email-confirmation code for session, redirect to login |
| Create | `middleware.ts` | Refresh Supabase session on every request, protect `/dashboard` route |
| Modify | `app/login/page.tsx` | Pass `searchParams` (confirmed, error) as props to `LoginForm` |
| Modify | `app/login/login-form.tsx` | Call `/api/auth/login`, handle session tokens, show status banners |
| Modify | `app/signup/page.tsx` | Split name fields, validate client-side, POST FormData to `/api/auth/signup`, show success state |

---

## Task 1: Create the email-confirmation callback route

**Files:**
- Create: `app/auth/callback/route.ts`

- [ ] **Step 1: Create the file with this exact content**

```typescript
// app/auth/callback/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Callback error:', error.message);
    return NextResponse.redirect(new URL('/login?error=expired', origin));
  }

  return NextResponse.redirect(new URL('/login?confirmed=true', origin));
}
```

- [ ] **Step 2: Verify the file exists**

```bash
ls app/auth/callback/route.ts
```

Expected: file listed with no errors.

- [ ] **Step 3: Commit**

```bash
git add app/auth/callback/route.ts
git commit -m "feat: add email confirmation callback route"
```

---

## Task 2: Create the login API route

**Files:**
- Create: `app/api/auth/login/route.ts`

- [ ] **Step 1: Create the file with this exact content**

```typescript
// app/api/auth/login/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Authenticate credentials
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        return NextResponse.json(
          { error: 'Please confirm your email before logging in.' },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Step 2: Check approval status in beneficiary_profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('beneficiary_profiles')
      .select('status')
      .eq('auth_user_id', data.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Your account is pending admin approval. You can log in once approved.' },
        { status: 403 }
      );
    }

    if (profile.status === 'pending') {
      return NextResponse.json(
        { error: 'Your account is pending admin approval. You can log in once approved.' },
        { status: 403 }
      );
    }

    if (profile.status === 'rejected') {
      return NextResponse.json(
        { error: 'Your account application was not approved. Please contact support.' },
        { status: 403 }
      );
    }

    // status === 'approved' — return session tokens for client to set
    return NextResponse.json(
      {
        success: true,
        session: {
          access_token: data.session!.access_token,
          refresh_token: data.session!.refresh_token,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Test manually with curl (dev server must be running)**

```bash
# Should return 401 for bad credentials
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"notreal@test.com","password":"wrongpass"}' | cat
```

Expected: `{"error":"Invalid login credentials"}`

- [ ] **Step 3: Commit**

```bash
git add app/api/auth/login/route.ts
git commit -m "feat: add login API route with approval status check"
```

---

## Task 3: Create the signup API route

**Files:**
- Create: `app/api/auth/signup/route.ts`

- [ ] **Step 1: Create the file with this exact content**

```typescript
// app/api/auth/signup/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const accountName = formData.get('accountName') as string | null;
    const bankName = formData.get('bankName') as string | null;
    const accountNumber = formData.get('accountNumber') as string | null;
    const idFile = formData.get('idFile') as File | null;

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, password' },
        { status: 400 }
      );
    }

    if (!idFile) {
      return NextResponse.json(
        { error: 'Government ID is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Create auth user — triggers Supabase confirmation email
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user?.id) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // Step 2: Upload ID file to beneficiary-ids storage bucket
    const fileBuffer = await idFile.arrayBuffer();
    const storageKey = `${userId}/${Date.now()}-${idFile.name}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('beneficiary-ids')
      .upload(storageKey, fileBuffer, {
        contentType: idFile.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `ID upload failed: ${uploadError.message}` },
        { status: 400 }
      );
    }

    // Step 3: Insert beneficiary_profiles row
    const { error: profileError } = await supabaseAdmin
      .from('beneficiary_profiles')
      .insert({
        auth_user_id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        account_name: accountName || null,
        bank_name: bankName || null,
        account_number: accountNumber || null,
        id_verification_key: storageKey,
        status: 'pending',
      });

    if (profileError) {
      return NextResponse.json(
        { error: `Profile creation failed: ${profileError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Test manually with curl (dev server must be running)**

```bash
# Should return 400 for missing required fields
curl -s -X POST http://localhost:3000/api/auth/signup \
  -F "firstName=" -F "email=test@test.com" | cat
```

Expected: `{"error":"Missing required fields: firstName, lastName, email, password"}`

- [ ] **Step 3: Commit**

```bash
git add app/api/auth/signup/route.ts
git commit -m "feat: add signup API route with ID upload and profile creation"
```

---

## Task 4: Add root middleware for session refresh and dashboard protection

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Create the file with this exact content**

```typescript
// middleware.ts
import { type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

- [ ] **Step 2: Update `utils/supabase/middleware.ts` to protect the dashboard route**

Replace the entire file content with:

```typescript
// utils/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect unauthenticated users away from protected routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from login/signup
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}
```

- [ ] **Step 3: Commit**

```bash
git add middleware.ts utils/supabase/middleware.ts
git commit -m "feat: add middleware for session refresh and route protection"
```

---

## Task 5: Update the login page and form

**Files:**
- Modify: `app/login/page.tsx`
- Modify: `app/login/login-form.tsx`

- [ ] **Step 1: Update `app/login/page.tsx` to pass searchParams as props**

Replace the entire file with:

```tsx
// app/login/page.tsx
import { LoginForm } from "@/app/login/login-form";
import { BeneficiaryStyle, BeneficiaryFooter, AmbientCard, CardLogo } from "@/app/shared/beneficiary-shared";

interface LoginPageProps {
  searchParams: Promise<{ confirmed?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <div
      style={{
        background: "#fff8f7",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        fontFamily: "Plus Jakarta Sans, sans-serif",
        color: "#241918",
      }}
    >
      <BeneficiaryStyle />

      <main style={{ width: "100%", maxWidth: "32rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <AmbientCard>
          {/* Branding */}
          <div style={{ width: "100%", textAlign: "center", marginBottom: "2.5rem" }}>
            <CardLogo />
            <h1 style={{ fontSize: "1.875rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#241918", margin: "0 0 0.5rem" }}>
              Welcome back
            </h1>
            <p style={{ fontSize: "1rem", fontWeight: 500, color: "#554240", opacity: 0.8, margin: 0 }}>
              Enter your beneficiary credentials to continue.
            </p>
          </div>

          <LoginForm confirmed={params.confirmed === 'true'} linkExpired={params.error === 'expired'} />

          {/* Bottom link */}
          <div style={{ marginTop: "2.5rem", paddingTop: "2rem", width: "100%", textAlign: "center", borderTop: "1px solid #dac1be1a" }}>
            <p style={{ color: "#554240", fontSize: "0.875rem", fontWeight: 500, margin: 0 }}>
              Don't have an account?{" "}
              <a
                href="/signup"
                style={{ color: "#97453e", fontWeight: 700, marginLeft: "0.25rem", textDecoration: "none" }}
              >
                Sign up
              </a>
            </p>
          </div>
        </AmbientCard>

        <BeneficiaryFooter />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Replace `app/login/login-form.tsx` with this exact content**

```tsx
// app/login/login-form.tsx
"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { createClient } from "@/utils/supabase/client";
import { S, FieldLabel, TextInput, PrimaryBtn } from "@/app/shared/beneficiary-shared";

interface LoginFormProps {
  confirmed?: boolean;
  linkExpired?: boolean;
}

export function LoginForm({ confirmed, linkExpired }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const togglePassword = useCallback(() => setShowPassword((p) => !p), []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong, please try again.');
        setIsSubmitting(false);
        return;
      }

      // Establish session in the browser using the returned tokens
      const supabase = createClient();
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      router.replace('/dashboard');
      router.refresh();
    } catch {
      setError('Something went wrong, please try again.');
      setIsSubmitting(false);
    }
  };

  const infoBannerStyle = {
    borderRadius: "0.75rem",
    background: "#e8f4fd",
    padding: "0.75rem 1rem",
    fontSize: "0.875rem",
    color: "#1a5276",
    margin: 0,
    fontFamily: "Plus Jakarta Sans, sans-serif",
  };

  const errorBannerStyle = {
    borderRadius: "0.75rem",
    background: S.errorContainer,
    padding: "0.75rem 1rem",
    fontSize: "0.875rem",
    color: S.onErrorContainer,
    margin: 0,
    fontFamily: "Plus Jakarta Sans, sans-serif",
  };

  return (
    <form style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.5rem" }} onSubmit={handleLogin}>
      {/* Confirmed banner */}
      {confirmed && !error && (
        <p style={infoBannerStyle}>
          Your account is pending admin approval. You can log in once approved.
        </p>
      )}

      {/* Expired link banner */}
      {linkExpired && !error && (
        <p style={errorBannerStyle}>
          This confirmation link has expired. Please sign up again.
        </p>
      )}

      {/* Email */}
      <div>
        <FieldLabel>Email Address</FieldLabel>
        <TextInput
          type="email"
          placeholder="name@hopecard.com"
          leadIcon={<Mail size={20} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* Password */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: "0.25rem", marginBottom: "0.5rem" }}>
          <FieldLabel>Password</FieldLabel>
          <Link
            href="#"
            style={{ fontSize: "0.625rem", fontWeight: 800, color: S.primary, textTransform: "uppercase", letterSpacing: "0.1em" }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            Forgot Password?
          </Link>
        </div>
        <div style={{ position: "relative" }}>
          <TextInput
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            leadIcon={<Lock size={20} />}
            style={{ paddingRight: "3rem" }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={togglePassword}
            style={{
              position: "absolute",
              right: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: S.onSurfaceVariant,
              display: "flex",
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {error && (
        <p style={errorBannerStyle}>{error}</p>
      )}

      <PrimaryBtn label={isSubmitting ? "Signing in..." : "Login"} />
    </form>
  );
}
```

- [ ] **Step 3: Start the dev server and verify the login page loads without errors**

```bash
npm run dev
```

Open `http://localhost:3000/login` — page should render with no console errors.

- [ ] **Step 4: Verify `?confirmed=true` banner shows**

Open `http://localhost:3000/login?confirmed=true` — should see the info banner: *"Your account is pending admin approval. You can log in once approved."*

- [ ] **Step 5: Verify `?error=expired` banner shows**

Open `http://localhost:3000/login?error=expired` — should see the error banner: *"This confirmation link has expired. Please sign up again."*

- [ ] **Step 6: Commit**

```bash
git add app/login/page.tsx app/login/login-form.tsx
git commit -m "feat: update login form to use approval-gated API route and show status banners"
```

---

## Task 6: Update the signup form

**Files:**
- Modify: `app/signup/page.tsx`

- [ ] **Step 1: Replace `app/signup/page.tsx` with this exact content**

```tsx
// app/signup/page.tsx
"use client";

import React, { useState, useCallback } from "react";
import { User, Landmark, ShieldCheck, CloudUpload, CheckCircle } from "lucide-react";
import {
  S, BeneficiaryStyle, AmbientCard, CardLogo, FieldLabel,
  TextInput, SelectInput, FormSection, PrimaryBtn, BeneficiaryFooter,
} from "../shared/beneficiary-shared";

const FieldGrid = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.5rem" }}>
    {children}
  </div>
);

const FullField = ({ children }: { children: React.ReactNode }) => (
  <div style={{ gridColumn: "1 / -1" }}>{children}</div>
);

export default function SignupPage() {
  const [agreed, setAgreed]           = useState(false);
  const [idFile, setIdFile]           = useState<File | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted]     = useState(false);

  // Form fields
  const [firstName, setFirstName]     = useState("");
  const [lastName, setLastName]       = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName]       = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB.");
      setIdFile(null);
      return;
    }
    setError(null);
    setIdFile(f);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!idFile) {
      setError("Please upload your Government Issued ID.");
      return;
    }
    if (!agreed) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("accountName", accountName);
      formData.append("bankName", bankName);
      formData.append("accountNumber", accountNumber);
      formData.append("idFile", idFile);

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div
        style={{
          background: S.surface,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          fontFamily: "Plus Jakarta Sans, sans-serif",
          color: S.onSurface,
        }}
      >
        <BeneficiaryStyle />
        <AmbientCard maxWidth="32rem">
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
            <div style={{ width: "4rem", height: "4rem", borderRadius: "999px", background: `${S.primary}1a`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle size={32} style={{ color: S.primary }} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: S.onSurface, margin: "0 0 0.5rem" }}>Account Created!</h2>
              <p style={{ fontSize: "0.9375rem", color: S.onSurfaceVariant, margin: 0, lineHeight: 1.6 }}>
                Check your email to confirm your account. Once confirmed, your application will be reviewed by an admin.
              </p>
            </div>
            <a
              href="/login"
              style={{
                display: "inline-block",
                padding: "0.75rem 2rem",
                borderRadius: "0.75rem",
                background: S.primary,
                color: S.onPrimary,
                fontWeight: 700,
                fontSize: "0.9375rem",
                textDecoration: "none",
              }}
            >
              Go to Login
            </a>
          </div>
        </AmbientCard>
      </div>
    );
  }

  // ── Form state ────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        background: S.surface,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        fontFamily: "Plus Jakarta Sans, sans-serif",
        color: S.onSurface,
      }}
    >
      <BeneficiaryStyle />

      <main style={{ width: "100%", maxWidth: "42rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <AmbientCard maxWidth="42rem">
          {/* Branding */}
          <div style={{ width: "100%", textAlign: "center", marginBottom: "2.5rem" }}>
            <CardLogo />
            <h1 style={{ fontSize: "1.875rem", fontWeight: 800, letterSpacing: "-0.03em", color: S.onSurface, margin: "0 0 0.5rem" }}>
              Join our community
            </h1>
            <p style={{ fontSize: "1rem", fontWeight: 500, color: S.onSurfaceVariant, opacity: 0.8, margin: 0 }}>
              Join the HOPECARD community and manage your benefits with dignity.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ width: "100%", display: "flex", flexDirection: "column", gap: "2.5rem" }}
          >
            {/* ── Section 1: Personal Information ──────────────────────── */}
            <FormSection icon={<User size={20} />} title="Personal Information">
              <FieldGrid>
                <div>
                  <FieldLabel>First Name</FieldLabel>
                  <TextInput
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <FieldLabel>Last Name</FieldLabel>
                  <TextInput
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <FieldLabel>Campaign</FieldLabel>
                  <SelectInput>
                    <option>Select a Campaign</option>
                    <option>Community Uplift 2024</option>
                    <option>Health &amp; Wellness Fund</option>
                    <option>Educational Grant Program</option>
                  </SelectInput>
                </div>
                <FullField>
                  <FieldLabel>Email Address</FieldLabel>
                  <TextInput
                    type="email"
                    placeholder="name@hopecard.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </FullField>
                <div>
                  <FieldLabel>Password</FieldLabel>
                  <TextInput
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <FieldLabel>Confirm Password</FieldLabel>
                  <TextInput
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </FieldGrid>
            </FormSection>

            {/* ── Section 2: Bank Details ───────────────────────────────── */}
            <FormSection icon={<Landmark size={20} />} title="Bank Details">
              <FieldGrid>
                <div>
                  <FieldLabel>Account Name</FieldLabel>
                  <TextInput
                    type="text"
                    placeholder="As written on bank card"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Bank Name</FieldLabel>
                  <SelectInput
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  >
                    <option value="">Select your bank</option>
                    <option>BDO</option>
                    <option>BPI</option>
                    <option>Metrobank</option>
                    <option>Landbank</option>
                  </SelectInput>
                </div>
                <FullField>
                  <FieldLabel>Account Number</FieldLabel>
                  <TextInput
                    type="text"
                    placeholder="0000 0000 0000 00"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </FullField>
              </FieldGrid>
            </FormSection>

            {/* ── Section 3: Identity Verification ─────────────────────── */}
            <FormSection icon={<ShieldCheck size={20} />} title="Identity Verification">
              <label
                htmlFor="id-upload"
                style={{
                  position: "relative",
                  width: "100%",
                  padding: "2.5rem 1.5rem",
                  borderRadius: "1rem",
                  background: S.surfaceContainerLow,
                  border: `2px dashed ${S.outlineVariant}66`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${S.primary}80`)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${S.outlineVariant}66`)}
              >
                <div
                  style={{
                    width: "3rem",
                    height: "3rem",
                    borderRadius: "999px",
                    background: `${S.primary}1a`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1rem",
                  }}
                >
                  <CloudUpload size={24} style={{ color: S.primary }} />
                </div>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: S.onSurface, margin: "0 0 0.25rem" }}>
                  {idFile ? idFile.name : "Click to upload Government Issued ID"}
                </p>
                <p style={{ fontSize: "0.625rem", color: `${S.onSurfaceVariant}99`, textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.1em", margin: 0 }}>
                  JPG, PNG, PDF (Max 5MB)
                </p>
                <input
                  id="id-upload"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFile}
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                />
              </label>
            </FormSection>

            {/* ── Error banner ──────────────────────────────────────────── */}
            {error && (
              <p style={{
                borderRadius: "0.75rem",
                background: S.errorContainer,
                padding: "0.75rem 1rem",
                fontSize: "0.875rem",
                color: S.onErrorContainer,
                margin: 0,
                fontFamily: "Plus Jakarta Sans, sans-serif",
              }}>
                {error}
              </p>
            )}

            {/* ── Terms & CTA ───────────────────────────────────────────── */}
            <div style={{ paddingTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{ width: "1rem", height: "1rem", marginTop: "2px", accentColor: S.primary, cursor: "pointer", flexShrink: 0 }}
                />
                <label style={{ fontSize: "0.75rem", color: S.onSurfaceVariant, lineHeight: 1.6, fontWeight: 500 }}>
                  I agree to the{" "}
                  <a href="/terms" style={{ color: S.primary, fontWeight: 700, textDecoration: "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                  >Terms of Service</a>{" "}
                  and{" "}
                  <a href="/privacy" style={{ color: S.primary, fontWeight: 700, textDecoration: "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                  >Privacy Policy</a>.
                </label>
              </div>

              <PrimaryBtn label={isSubmitting ? "Creating account..." : "Sign Up"} />

              <p style={{ textAlign: "center", color: S.onSurfaceVariant, fontSize: "0.875rem", fontWeight: 500, margin: 0 }}>
                Already have an account?{" "}
                <a href="/login" style={{ color: S.primary, fontWeight: 700, marginLeft: "0.25rem", textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                >Sign In</a>
              </p>
            </div>
          </form>
        </AmbientCard>

        <BeneficiaryFooter />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify the signup page renders correctly**

With dev server running, open `http://localhost:3000/signup`.

Expected:
- Two separate fields: "First Name" and "Last Name" (not one "Full Name" field)
- Form has all sections: Personal Info, Bank Details, Identity Verification
- "Sign Up" button at the bottom

- [ ] **Step 3: Test client-side validation**

Try submitting the form with mismatched passwords — should see "Passwords do not match." error banner. Try submitting without uploading an ID — should see "Please upload your Government Issued ID."

- [ ] **Step 4: Commit**

```bash
git add app/signup/page.tsx
git commit -m "feat: update signup form with split name fields, validation, and API integration"
```

---

## Task 7: End-to-end verification

- [ ] **Step 1: Test full signup flow**

1. Open `http://localhost:3000/signup`
2. Fill in all fields with a real email address you can access, upload a small test image
3. Click Sign Up
4. Should see the success screen: *"Account Created! Check your email to confirm your account."*
5. Check your email inbox — confirm the Supabase confirmation email arrived
6. Check Supabase dashboard → Authentication → Users — new user should appear with status "Waiting for verification"
7. Check Supabase dashboard → Table Editor → `beneficiary_profiles` — new row should appear with `status = 'pending'`
8. Check Supabase dashboard → Storage → `beneficiary-ids` — uploaded file should appear under `{user_id}/` folder

- [ ] **Step 2: Test email confirmation**

1. Click the confirmation link in the email
2. Should be redirected to `http://localhost:3000/login?confirmed=true`
3. Info banner should read: *"Your account is pending admin approval. You can log in once approved."*

- [ ] **Step 3: Test login blocked while pending**

1. Enter the email/password of the newly confirmed user
2. Click Login
3. Should see error: *"Your account is pending admin approval. You can log in once approved."*

- [ ] **Step 4: Manually approve the account and test login succeeds**

1. In Supabase dashboard → Table Editor → `beneficiary_profiles`, find the row and change `status` from `pending` to `approved`
2. Return to `http://localhost:3000/login`
3. Enter the same email/password
4. Should redirect to `/dashboard`

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: complete auth backend with signup, email confirmation, and approval-gated login"
```
