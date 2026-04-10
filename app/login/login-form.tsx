"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";

import { createClient } from "@/utils/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

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
    <form className="space-y-6" onSubmit={handleLogin}>
      {/* Email Input */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
          <Mail className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full h-12 rounded-2xl border-0 bg-gray-50 py-3 pr-5 pl-14 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#6B2C2C] focus:outline-none font-[family-name:var(--font-manrope)]"
          autoComplete="email"
          required
        />
      </div>

      {/* Password Input */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full h-12 rounded-2xl border-0 bg-gray-50 py-3 pr-14 pl-14 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#6B2C2C] focus:outline-none font-[family-name:var(--font-manrope)]"
          autoComplete="current-password"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="absolute inset-y-0 right-0 flex items-center pr-5 text-gray-400 hover:text-gray-600 transition"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-5 py-3 text-sm text-red-700 font-[family-name:var(--font-manrope)]">
          {error}
        </p>
      ) : null}

      {/* Sign In Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 rounded-full bg-[#6B2C2C] font-semibold text-white transition hover:bg-[#5a2424] disabled:cursor-not-allowed disabled:opacity-70 font-[family-name:var(--font-manrope)] shadow-lg"
      >
        {isSubmitting ? "Signing in..." : "Sign In"}
      </button>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between text-[15px] font-[family-name:var(--font-manrope)]">
        <label className="flex cursor-pointer items-center space-x-2">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-[#6B2C2C] focus:ring-[#6B2C2C]"
          />
          <span className="text-gray-600 font-medium">Remember me</span>
        </label>
        <Link href="#" className="text-gray-600 font-medium hover:text-[#6B2C2C] transition">
          Forgot Password?
        </Link>
      </div>

      {/* Sign Up Link */}
      <div className="text-center text-[15px] text-gray-600 font-medium font-[family-name:var(--font-manrope)]">
        Don&apos;t have an account?{" "}
        <Link href="#" className="font-semibold text-[#6B2C2C] hover:underline">
          Sign up
        </Link>
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-6 border-t border-gray-100 font-[family-name:var(--font-manrope)]">
        <Shield className="h-4 w-4" />
        <span className="uppercase tracking-widest font-medium">Secure, Encrypted Access</span>
      </div>
    </form>
  );
}
