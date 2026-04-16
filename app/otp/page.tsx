"use client";

import React, { useState, useRef, useCallback } from "react";
import { Clock, ArrowLeft } from "lucide-react";
import {
  S, BeneficiaryStyle, AmbientCard, CardLogo,
  PrimaryBtn, BeneficiaryFooter,
} from "../shared/beneficiary-shared";

// ─── OTP Digit ────────────────────────────────────────────────────────────────
interface OtpDigitProps {
  index: number;
  value: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (i: number, v: string) => void;
  onKeyDown: (i: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const OtpDigit = React.memo<OtpDigitProps>(({ index, value, inputRef, onChange, onKeyDown }) => (
  <input
    ref={inputRef}
    type="number"
    inputMode="numeric"
    maxLength={1}
    aria-label={`OTP Digit ${index + 1}`}
    value={value}
    autoFocus={index === 0}
    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(index, e.target.value)}
    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => onKeyDown(index, e)}
    style={{
      width: "100%",
      aspectRatio: "1",
      textAlign: "center",
      fontSize: "1.25rem",
      fontWeight: 700,
      background: S.surfaceContainerLow,
      border: `1px solid ${S.outlineVariant}4d`,
      borderRadius: "0.75rem",
      color: S.onSurface,
      outline: "none",
      fontFamily: "Plus Jakarta Sans, sans-serif",
      transition: "border-color 0.15s, box-shadow 0.15s",
    }}
    onFocus={(e) => {
      e.currentTarget.style.borderColor = S.primary;
      e.currentTarget.style.boxShadow = `0 0 0 4px ${S.primaryContainer}33`;
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = `${S.outlineVariant}4d`;
      e.currentTarget.style.boxShadow = "none";
    }}
  />
));
OtpDigit.displayName = "OtpDigit";

// ─── Page Component ────────────────────────────────────────────────────────────
const OTP_LENGTH = 6;

export default function OTPPage() {
  const [digits, setDigits] = useState<string[]>(new Array(OTP_LENGTH).fill(""));
  const refs = useRef<Array<React.RefObject<HTMLInputElement | null>>>(
    new Array(OTP_LENGTH).fill(null).map(() => React.createRef<HTMLInputElement>())
  );

  const handleChange = useCallback((i: number, val: string) => {
    const digit = val.replaceAll(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[i] = digit;
      return next;
    });
    if (digit && i < OTP_LENGTH - 1) refs.current[i + 1].current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1].current?.focus();
    },
    [digits]
  );

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
          {/* Branding & Header */}
          <div style={{ width: "100%", textAlign: "center", marginBottom: "2.5rem" }}>
            <CardLogo />
            <h1 style={{ fontSize: "1.875rem", fontWeight: 800, letterSpacing: "-0.03em", color: S.onSurface, margin: "0 0 0.5rem" }}>
              Two-Step Verification
            </h1>
            <p style={{ fontSize: "1rem", fontWeight: 500, color: S.onSurfaceVariant, opacity: 0.8, maxWidth: "24rem", margin: "0 auto", lineHeight: 1.5 }}>
              We've sent a 6-digit code to your registered email address. Please enter it below to continue.
            </p>
          </div>

          {/* Form */}
          <div style={{ width: "100%", maxWidth: "28rem", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            {/* OTP Inputs */}
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
              {digits.map((digit, i) => (
                <OtpDigit
                  key={`otp-digit-${i}`}
                  index={i}
                  value={digit}
                  inputRef={refs.current[i]}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                />
              ))}
            </div>

            {/* Timer & Resend */}
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: `${S.onSurfaceVariant}cc`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  margin: 0,
                }}
              >
                <Clock size={16} />
                Resend code in{" "}
                <strong style={{ color: S.primary }}>00:58</strong>
              </p>
              <button
                type="button"
                disabled
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "0.875rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: `${S.onSurfaceVariant}66`,
                  cursor: "not-allowed",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                }}
              >
                Resend OTP
              </button>
            </div>

            {/* CTA */}
            <div style={{ paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <PrimaryBtn label="Verify Identity" />

              <div style={{ textAlign: "center" }}>
                <a
                  href="/login"
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: S.primary,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    transition: "opacity 0.15s",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                >
                  <ArrowLeft size={16} />
                  Back to Login
                </a>
              </div>
            </div>
          </div>
        </AmbientCard>

        <BeneficiaryFooter />
      </main>
    </div>
  );
}
