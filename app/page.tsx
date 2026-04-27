"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient();
        
        // Check session instead of just user
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);
          router.replace("/login");
          return;
        }

        // If there's a valid session, redirect to dashboard
        if (session?.user) {
          router.replace("/dashboard");
        } else {
          // No session, redirect to login
          router.replace("/login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.replace("/login");
      }
    }

    checkAuth();
  }, [router]);

  // Show loading state while checking auth
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "#fff8f7",
      fontFamily: "Plus Jakarta Sans, sans-serif"
    }}>
      <div style={{
        textAlign: "center",
        color: "#97453e"
      }}>
        <div style={{
          width: "48px",
          height: "48px",
          border: "4px solid #dac1be",
          borderTopColor: "#97453e",
          borderRadius: "50%",
          margin: "0 auto 1rem",
          animation: "spin 1s linear infinite"
        }} />
        <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>Redirecting...</p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
