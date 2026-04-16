"use client";

import React, { useState, useCallback } from "react";
import {
  Menu, Bell, LayoutDashboard, CreditCard,
  Landmark, IdCard, User, ShieldCheck, HelpCircle
} from "lucide-react";
import { S, LOGO_SRC, BeneficiaryStyle } from "@/app/shared/beneficiary-shared";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BankingEvent {
  id: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  date: string;
  status: "Completed" | "Rejected";
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const BANKING_EVENTS: BankingEvent[] = [
  {
    id: "1",
    icon: "link",
    iconBg: "rgba(254,160,150,0.2)",
    iconColor: "#934841",
    label: "Chase Bank Linked",
    date: "Oct 12, 2023",
    status: "Completed",
  },
  {
    id: "2",
    icon: "domain_verification",
    iconBg: "rgba(255,223,152,0.3)",
    iconColor: "#775a00",
    label: "Micro-deposit Verification",
    date: "Oct 10, 2023",
    status: "Completed",
  },
  {
    id: "3",
    icon: "error_outline",
    iconBg: "rgba(255,218,214,0.4)",
    iconColor: "#ba1a1a",
    label: "Failed Connection (Wells Fargo)",
    date: "Sep 28, 2023",
    status: "Rejected",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: BankingEvent["status"] }> = ({
  status,
}) =>
  status === "Completed" ? (
    <span className="px-3 py-1 bg-[#f4dddc] text-[#79342e] rounded-full text-[10px] font-extrabold uppercase tracking-wider">
      Completed
    </span>
  ) : (
    <span className="px-3 py-1 bg-[#ffdad6]/60 text-[#ba1a1a] rounded-full text-[10px] font-extrabold uppercase tracking-wider">
      Rejected
    </span>
  );

const EventRow: React.FC<{ event: BankingEvent }> = ({ event }) => (
  <tr className="hover:bg-[#fff0ef] transition-colors group">
    <td className="px-8 py-6">
      <div className="flex items-center space-x-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
          style={{ background: event.iconBg, color: event.iconColor }}
        >
          <span className="material-symbols-outlined text-lg">{event.icon}</span>
        </div>
        <span className="font-bold text-[#241918]">{event.label}</span>
      </div>
    </td>
    <td className="px-8 py-6 text-sm font-medium text-[#554240]">
      {event.date}
    </td>
    <td className="px-8 py-6">
      <StatusBadge status={event.status} />
    </td>
    <td className="px-8 py-6 text-right">
      <button className="text-stone-300 group-hover:text-[#97453e] transition-colors">
        <span className="material-symbols-outlined">info</span>
      </button>
    </td>
  </tr>
);

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
  { icon: <CreditCard size={20} />, label: "Funds", active: false, href: "/fund-management" },
  { icon: <Landmark size={20} />, label: "Banking", active: true, href: "/banking-details" },
  { icon: <IdCard size={20} />, label: "Identity", active: false, href: "/dashboard" },
  { icon: <User size={20} />, label: "Profile", active: false, href: "/dashboard" },
  { icon: <ShieldCheck size={20} />, label: "Security", active: false, href: "/dashboard" },
];

const SIDEBAR_W_EXPANDED = 220;
const SIDEBAR_W_COLLAPSED = 80;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BankingDetailsPage() {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const toggleSidebar = useCallback(() => setCollapsed((p) => !p), []);
  const sidebarW = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED;

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
            <img src={LOGO_SRC} alt="HOPECARD Logo" style={{ height: "2rem", width: "auto", objectFit: "contain" }} />
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
                <p style={{ fontSize: "0.625rem", color: S.onSurfaceVariant, margin: 0 }}>Active since 2023</p>
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
            gap: "3rem",
            minHeight: "calc(100vh - 5rem)",
          }}
        >
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#241918] tracking-tight">
                Banking Details
              </h1>
              <p className="text-lg text-[#554240] max-w-2xl leading-relaxed">
                Manage your verified bank accounts for disbursements. Your
                security is our highest priority.
              </p>
            </div>
            <a href="/connect-bank" className="bg-[#F28D83] text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap">
              <span className="material-symbols-outlined">add_circle</span>
              Connect New Bank
            </a>
          </header>

          {/* Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="space-y-8 lg:col-span-12 max-w-4xl mx-auto w-full">
              {/* Primary Account Card */}
              <div className="bg-white rounded-xl p-8 relative overflow-hidden group shadow-[0px_12px_32px_rgba(151,69,62,0.06)]">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#f28d83]/5 rounded-full group-hover:scale-110 transition-transform" />
                <div className="absolute top-6 right-8">
                  <span className="bg-[#f4dddc] text-[#79342e] px-4 py-1.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase flex items-center gap-1.5">
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified
                    </span>
                    Verified
                  </span>
                </div>
                <div className="flex items-start space-x-6 relative z-10">
                  <div className="w-16 h-16 rounded-xl bg-[#fae3e1] flex items-center justify-center text-[#97453e] shadow-sm">
                    <span className="material-symbols-outlined text-4xl">
                      account_balance
                    </span>
                  </div>
                  <div className="space-y-6 flex-1">
                    <div>
                      <h3 className="text-2xl font-extrabold text-[#241918] tracking-tight">
                        Chase Bank
                      </h3>
                      <p className="text-[#554240] text-sm font-medium">
                        Primary Disbursement Account
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <p className="text-[10px] font-extrabold text-[#554240]/50 uppercase tracking-widest mb-1">
                          Account Holder
                        </p>
                        <p className="font-bold text-[#241918]">Jane Doe</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-extrabold text-[#554240]/50 uppercase tracking-widest mb-1">
                          Account Number
                        </p>
                        <p className="font-bold text-[#241918]">•••• 4219</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex items-center space-x-6 border-t border-[#dac1be]/10 pt-6">
                  <button className="flex items-center space-x-2 text-[#97453e] font-bold text-xs hover:translate-x-1 transition-transform">
                    <span className="material-symbols-outlined text-lg">
                      edit_square
                    </span>
                    <span>Edit Details</span>
                  </button>
                  <button className="flex items-center space-x-2 text-[#ba1a1a] font-bold text-xs hover:opacity-80 transition-opacity ml-auto">
                    <span className="material-symbols-outlined text-lg">
                      delete_sweep
                    </span>
                    <span>Remove</span>
                  </button>
                </div>
              </div>

              {/* Add New Bank CTA */}
              <a href="/connect-bank" className="w-full border-2 border-dashed border-[#dac1be]/30 rounded-xl p-10 flex flex-col items-center justify-center space-y-4 hover:bg-[#fff0ef] transition-all group">
                <div className="w-14 h-14 rounded-full bg-[#f28d83]/15 text-[#97453e] flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                  <span className="material-symbols-outlined text-3xl">
                    add
                  </span>
                </div>
                <div className="text-center">
                  <p className="font-extrabold text-[#241918] text-lg">
                    Add New Bank Account
                  </p>
                  <p className="text-sm text-[#554240] font-medium">
                    Connect another secure source for your fund transfers
                  </p>
                </div>
              </a>
            </div>
          </div>

          {/* Banking Activity */}
          <section className="space-y-6">
            <div className="flex items-end justify-between px-2">
              <div>
                <h3 className="text-xl font-extrabold tracking-tight">
                  Banking Activity
                </h3>
                <p className="text-sm text-[#554240] font-medium">
                  History of account links and verifications
                </p>
              </div>
              <button className="text-[#97453e] text-xs font-extrabold hover:underline flex items-center gap-1">
                Download Report
                <span className="material-symbols-outlined text-sm">
                  download
                </span>
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-[0px_12px_32px_rgba(151,69,62,0.06)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#fff0ef]/50 text-[#554240] text-[10px] font-bold uppercase tracking-widest">
                      {["Event", "Date", "Status", "Details"].map((h) => (
                        <th
                          key={h}
                          className={`px-8 py-5 ${
                            h === "Details" ? "text-right" : ""
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dac1be]/10">
                    {BANKING_EVENTS.map((event) => (
                      <EventRow key={event.id} event={event} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#dac1be]/15 flex justify-around py-4 z-50 shadow-lg">
        {[
          { icon: "dashboard", label: "Home", active: false, href: "/dashboard" },
          { icon: "payments", label: "Funds", active: false, href: "/fund-management" },
          { icon: "account_balance", label: "Bank", active: true, href: "/banking-details" },
          { icon: "person", label: "Profile", active: false, href: "/dashboard" },
        ].map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center ${
              item.active ? "text-[#97453e]" : "text-stone-500"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={
                item.active
                  ? { fontVariationSettings: "'FILL' 1" }
                  : undefined
              }
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-bold uppercase mt-1">
              {item.label}
            </span>
          </a>
        ))}
      </nav>
    </div>
  );
}
