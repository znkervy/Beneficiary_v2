"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { createClient } from "@/utils/supabase/client";
import { S, FieldLabel, TextInput, PrimaryBtn } from "@/app/shared/beneficiary-shared";

export function LoginForm() {
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

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsSubmitting(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <form style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.5rem" }} onSubmit={handleLogin}>
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

      {error ? (
        <p style={{ 
          borderRadius: "0.75rem", 
          background: S.errorContainer, 
          padding: "0.75rem 1rem", 
          fontSize: "0.875rem", 
          color: S.onErrorContainer,
          margin: 0,
          fontFamily: "Plus Jakarta Sans, sans-serif"
        }}>
          {error}
        </p>
      ) : null}

      <PrimaryBtn label={isSubmitting ? "Signing in..." : "Login"} />
    </form>
  );
}
