"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  Menu, Bell, LayoutDashboard, CreditCard,
  Landmark, IdCard, User, ShieldCheck, HelpCircle
} from "lucide-react";
import { S, LOGO_SRC, LOGO_WIDTH, LOGO_HEIGHT, BeneficiaryStyle, LargeCampaignCard, SmallCampaignCard } from "@/app/shared/beneficiary-shared";
import { createClient } from "@/utils/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  icon: string;
  title: string;
  description: string;
  totalReceived: string;
  status: "Active" | "Completed";
  size: "large" | "small";
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURED_CAMPAIGNS: Campaign[] = [
  {
    id: "UYM-001",
    icon: "volunteer_activism",
    title: "Urban Youth Mentorship",
    description:
      "Providing educational resources and weekly mentorship sessions for city students.",
    totalReceived: "$4,200.00",
    status: "Active",
    size: "large",
  },
  {
    id: "CGS-002",
    icon: "eco",
    title: "Community Green Space",
    description:
      "Revitalizing local parks and creating sustainable community gardens in the East district.",
    totalReceived: "$2,850.00",
    status: "Active",
    size: "large",
  },
];

const SECONDARY_CAMPAIGNS: Campaign[] = [
  {
    id: "HAF-003",
    icon: "medical_services",
    title: "Health Accessibility Fund",
    description: "",
    totalReceived: "$5,400.00",
    status: "Active",
    size: "small",
  },
  {
    id: "WTD-004",
    icon: "school",
    title: "Winter Textbook Drive",
    description: "",
    totalReceived: "$1,200.00",
    status: "Completed",
    size: "small",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function BenefitBloom() {
  return (
    <div
      className="w-20 h-20 flex items-center justify-center relative shadow-sm"
      style={{
        background: "conic-gradient(from 0deg, #97453e 0%, #f28d83 82%, transparent 82%)",
        borderRadius: "50%",
      }}
    >
      <div className="absolute inset-1.5 bg-[#fae3e1] rounded-full flex items-center justify-center">
        <span className="text-sm font-bold text-[#97453e]">82%</span>
      </div>
    </div>
  );
}

// ─── Nav Item Component ───────────────────────────────────────────────────────

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
  href: string;
}

const NavItem = React.memo<NavItemProps>(({ icon, label, active, collapsed, href }) => (
  <a
    href={href}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      padding: collapsed ? "0.75rem" : "0.75rem 1rem 0.75rem 2rem",
      justifyContent: collapsed ? "center" : "flex-start",
      borderRadius: active ? "999px 0 0 999px" : "999px",
      marginLeft: active ? "1rem" : (collapsed ? "0.75rem" : 0),
      marginRight: active ? 0 : (collapsed ? "0.75rem" : 0),
      background: active ? S.surfaceContainerLowest : "transparent",
      color: active ? S.primary : "#78716c",
      fontWeight: active ? 700 : 500,
      fontSize: "0.875rem",
      textDecoration: "none",
      boxShadow: active ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
      transition: "color 0.15s, background 0.15s, transform 0.15s",
      whiteSpace: "nowrap",
      overflow: "hidden",
    }}
    onMouseEnter={(e) => { if (!active) { e.currentTarget.style.color = S.primary; e.currentTarget.style.transform = "translateX(4px)"; } }}
    onMouseLeave={(e) => { if (!active) { e.currentTarget.style.color = "#78716c"; e.currentTarget.style.transform = "translateX(0)"; } }}
  >
    {icon}
    {!collapsed && <span style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>{label}</span>}
  </a>
));
NavItem.displayName = "NavItem";

const NAV_ITEMS = [
  { icon: <LayoutDashboard size={20} />, label: "Overview", active: false, href: "/dashboard" },
  { icon: <CreditCard size={20} />, label: "Campaigns", active: true, href: "/campaigns" },
  { icon: <CreditCard size={20} />, label: "Funds", active: false, href: "/fund-management" },
  { icon: <Landmark size={20} />, label: "Banking", active: false, href: "/banking-details" },
  { icon: <IdCard size={20} />, label: "Identity", active: false, href: "/identity-verification" },
  { icon: <User size={20} />, label: "Profile", active: false, href: "/profile-settings" },
  { icon: <ShieldCheck size={20} />, label: "Security", active: false, href: "/security-settings" },
];

const SIDEBAR_W_EXPANDED = 220;
const SIDEBAR_W_COLLAPSED = 80;

// ─── Main Component ───────────────────────────────────────────────────────────

const CampaignsPage: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [activeSince, setActiveSince] = useState<number | null>(null);

  const toggleSidebar = useCallback(() => setCollapsed((p) => !p), []);
  const sidebarW = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED;

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("beneficiary_profiles")
          .select("created_at")
          .eq("auth_user_id", user.id)
          .single();

        if (profile?.created_at) setActiveSince(new Date(profile.created_at).getFullYear());
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    fetchData();
  }, []);

  return (
    <div style={{ background: S.surface, minHeight: "100vh", color: S.onSurface, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <BeneficiaryStyle />
      <style>{`
        .nav-transition { transition: width 0.3s cubic-bezier(0.4,0,0.2,1); }
        .main-transition { transition: margin-left 0.3s cubic-bezier(0.4,0,0.2,1); }
      `}</style>

      {/* ── Top Nav ─────────────────────────────────────────────────────────── */}
      <nav
        style={{
          background: "rgba(255,255,255,0.8)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0px 12px 32px rgba(151,69,62,0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          padding: "0 2rem",
          height: "5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={toggleSidebar}
            style={{ padding: "0.5rem", background: "none", border: "none", cursor: "pointer", color: "#78716c", borderRadius: "999px", display: "flex", transition: "background 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = S.surfaceContainerHigh)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Menu size={22} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Image src={LOGO_SRC} alt="HOPECARD Logo" width={LOGO_WIDTH} height={LOGO_HEIGHT} />
            <span style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.03em", color: S.primary }}>HOPECARD</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <button
            style={{ padding: "0.5rem", background: "none", border: "none", cursor: "pointer", color: "#78716c", borderRadius: "999px", display: "flex", position: "relative", transition: "background 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = S.surfaceContainerHigh)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Bell size={22} />
            <span style={{ position: "absolute", top: "0.5rem", right: "0.5rem", width: "0.5rem", height: "0.5rem", background: S.error, borderRadius: "999px" }} />
          </button>

          <div style={{ position: "relative" }}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "999px",
                background: S.primaryContainer,
                border: `2px solid ${S.primary}`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "transform 0.15s",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <User size={20} style={{ color: S.primary }} />
            </button>

            {profileOpen && (
              <>
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 40,
                  }}
                  onClick={() => setProfileOpen(false)}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "3.5rem",
                    right: 0,
                    width: "16rem",
                    background: S.surfaceContainerLowest,
                    borderRadius: "0.75rem",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    overflow: "hidden",
                    zIndex: 50,
                    border: `1px solid ${S.outlineVariant}33`,
                  }}
                >
                  <div style={{ padding: "1.5rem", borderBottom: `1px solid ${S.outlineVariant}1a` }}>
                    <p style={{ fontWeight: 700, color: S.onSurface, fontSize: "0.9375rem", margin: "0 0 0.25rem" }}>
                      Beneficiary
                    </p>
                    <p style={{ fontSize: "0.75rem", color: S.onSurfaceVariant, margin: 0 }}>
                      Beneficiary Account
                    </p>
                  </div>
                  <div style={{ padding: "0.5rem" }}>
                    <button
                      onClick={async () => {
                        const { createClient } = await import("@/utils/supabase/client");
                        await createClient().auth.signOut();
                        window.location.href = "/login";
                      }}
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        color: S.error,
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        borderRadius: "0.5rem",
                        transition: "background 0.15s",
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = `${S.errorContainer}33`)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ fontSize: "1.25rem" }}>→</span>
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      <div style={{ display: "flex" }}>
        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <aside
          className="nav-transition"
          style={{
            width: `${sidebarW}px`,
            background: S.surfaceContainerHigh,
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            paddingTop: "6rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            zIndex: 40,
            overflow: "hidden",
          }}
        >
          {!collapsed && (
            <div style={{ padding: "0 1.5rem", marginBottom: "2rem" }}>
              <p style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: S.onSurfaceVariant, marginBottom: "0.5rem" }}>
                Member Portal
              </p>
              <div style={{ padding: "1rem", background: S.surfaceContainerLowest, borderRadius: "0.5rem" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: S.primary, margin: "0 0 0.125rem" }}>Verified Member</p>
                <p style={{ fontSize: "0.625rem", color: S.onSurfaceVariant, margin: 0 }}>Active since {activeSince ?? "…"}</p>
              </div>
            </div>
          )}

          {NAV_ITEMS.map(({ icon, label, active, href }) => (
            <NavItem key={label} icon={icon} label={label} active={active} collapsed={collapsed} href={href} />
          ))}

          <div style={{ marginTop: "auto", padding: collapsed ? "0 1rem 2rem" : "0 1.5rem 2rem" }}>
            <button
              style={{
                width: "100%",
                padding: collapsed ? "0.75rem" : "0.75rem 1rem",
                background: S.primary,
                color: S.onPrimary,
                borderRadius: "999px",
                fontWeight: 700,
                fontSize: "0.75rem",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: collapsed ? 0 : "0.5rem",
                transition: "opacity 0.15s",
                fontFamily: "Plus Jakarta Sans, sans-serif",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <HelpCircle size={18} />
              {!collapsed && "Request Support"}
            </button>
          </div>
        </aside>

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <main
          className="main-transition"
          style={{
            flex: 1,
            marginLeft: `${sidebarW}px`,
            padding: "2rem 3rem",
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
            minHeight: "calc(100vh - 5rem)",
          }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-[#241918] tracking-tight mb-2">
                Your Campaigns
              </h1>
              <p className="text-[#554240] text-lg max-w-2xl leading-relaxed mt-2">
                Track the impact of your community. Review active initiatives and completed support cycles here.
              </p>
            </div>
            <a href="/campaigns/invitations" className="bg-[#D1736A] text-white px-8 py-4 rounded-[1rem] font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap">
              <span>View Invitations</span>
              <div className="flex items-center justify-center bg-white w-5 h-5 rounded-full text-[10px] text-[#D1736A]">
                3
              </div>
            </a>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Impact Overview */}
            <div className="lg:col-span-4 bg-[#fae3e1] rounded-[2rem] p-8 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-[#97453e] uppercase tracking-widest">
                  Impact Overview
                </span>
                <h3 className="text-2xl font-bold text-[#241918] mt-4 mb-2">Total Support</h3>
                <p className="text-4xl font-black text-[#97453e]">$12,450.00</p>
              </div>
              <div className="mt-12 flex items-center gap-6">
                <BenefitBloom />
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#241918]">Active Campaign Progress</p>
                  <p className="text-xs text-[#554240] mt-1 font-medium">Across 4 active programs</p>
                </div>
              </div>
            </div>

            {/* Large Cards */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {FEATURED_CAMPAIGNS.map((c) => (
                <LargeCampaignCard key={c.id} campaign={c} />
              ))}
            </div>

            {/* Bottom Row */}
            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              {SECONDARY_CAMPAIGNS.map((c) => (
                <SmallCampaignCard key={c.id} campaign={c} />
              ))}

              {/* CTA Card */}
              <div className="bg-[#97453e] rounded-[2rem] p-8 text-white flex flex-col justify-center items-center text-center shadow-lg">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
                  <span
                    className="material-symbols-outlined text-4xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    add_circle
                  </span>
                </div>
                <h4 className="text-xl font-bold mb-2">Join a New Cause</h4>
                <p className="text-xs opacity-80 mb-6 font-medium">
                  There are 12 new campaigns matching your profile interests.
                </p>
              </div>
            </div>
          </div>

          <footer className="pt-8 pb-12 text-center text-[#554240]/50 text-[10px] font-bold uppercase tracking-widest">
            © 2024 HOPECARD Beneficiary Portal. Built for community impact.
          </footer>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#dac1be]/15 flex justify-around py-4 z-50 shadow-lg">
        {[
          { icon: "dashboard", label: "Home", active: false, href: "/dashboard" },
          { icon: "campaign", label: "Campaigns", active: true, href: "/campaigns" },
          { icon: "payments", label: "Funds", active: false, href: "/fund-management" },
          { icon: "person", label: "Profile", active: false, href: "/profile-settings" },
        ].map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={item.active ? "flex flex-col items-center text-[#97453e]" : "flex flex-col items-center text-stone-500"}
          >
            <span
              className="material-symbols-outlined"
              style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-bold uppercase mt-1">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
};

export default CampaignsPage;
