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
