"use client";

import React, { useState, useCallback } from "react";
import { User, Landmark, ShieldCheck, CloudUpload } from "lucide-react";
import {
  S, BeneficiaryStyle, AmbientCard, CardLogo, FieldLabel,
  TextInput, SelectInput, FormSection, PrimaryBtn, BeneficiaryFooter,
} from "../shared/beneficiary-shared";

// ─── Field Grid ───────────────────────────────────────────────────────────────
const FieldGrid = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.5rem" }}>
    {children}
  </div>
);

// ─── Full-width field wrapper ─────────────────────────────────────────────────
const FullField = ({ children }: { children: React.ReactNode }) => (
  <div style={{ gridColumn: "1 / -1" }}>{children}</div>
);

export default function SignupPage() {
  const [agreed, setAgreed]         = useState(false);
  const [fileName, setFileName]     = useState<string | null>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFileName(f ? f.name : null);
  }, []);

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

          {/* Form */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "2.5rem" }}>

            {/* ── Section 1: Personal Information ──────────────────────── */}
            <FormSection icon={<User size={20} />} title="Personal Information">
              <FieldGrid>
                <div>
                  <FieldLabel>Full Name</FieldLabel>
                  <TextInput type="text" placeholder="John Doe" />
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
                  <TextInput type="email" placeholder="name@hopecard.com" />
                </FullField>
                <div>
                  <FieldLabel>Password</FieldLabel>
                  <TextInput type="password" placeholder="••••••••" />
                </div>
                <div>
                  <FieldLabel>Confirm Password</FieldLabel>
                  <TextInput type="password" placeholder="••••••••" />
                </div>
              </FieldGrid>
            </FormSection>

            {/* ── Section 2: Bank Details ───────────────────────────────── */}
            <FormSection icon={<Landmark size={20} />} title="Bank Details">
              <FieldGrid>
                <div>
                  <FieldLabel>Account Name</FieldLabel>
                  <TextInput type="text" placeholder="As written on bank card" />
                </div>
                <div>
                  <FieldLabel>Bank Name</FieldLabel>
                  <SelectInput>
                    <option>Select your bank</option>
                    <option>BDO</option>
                    <option>BPI</option>
                    <option>Metrobank</option>
                    <option>Landbank</option>
                  </SelectInput>
                </div>
                <FullField>
                  <FieldLabel>Account Number</FieldLabel>
                  <TextInput type="text" placeholder="0000 0000 0000 00" />
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
                    transition: "transform 0.15s",
                  }}
                >
                  <CloudUpload size={24} style={{ color: S.primary }} />
                </div>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: S.onSurface, margin: "0 0 0.25rem" }}>
                  {fileName ?? "Click to upload Government Issued ID"}
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

            {/* ── Terms & CTA ───────────────────────────────────────────── */}
            <div style={{ paddingTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgreed(e.target.checked)}
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

              <PrimaryBtn label="Sign Up" />

              <p style={{ textAlign: "center", color: S.onSurfaceVariant, fontSize: "0.875rem", fontWeight: 500, margin: 0 }}>
                Already have an account?{" "}
                <a href="/login" style={{ color: S.primary, fontWeight: 700, marginLeft: "0.25rem", textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                >Sign In</a>
              </p>
            </div>
          </div>
        </AmbientCard>

        <BeneficiaryFooter />
      </main>
    </div>
  );
}
