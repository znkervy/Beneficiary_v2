"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Menu, Bell, LayoutDashboard, CreditCard,
  Landmark, IdCard, User, ShieldCheck, HelpCircle, Plus, Edit, Trash2, CheckCircle
} from "lucide-react";
import { S, LOGO_SRC, BeneficiaryStyle } from "@/app/shared/beneficiary-shared";
import { createClient } from "@/utils/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BankAccount {
  id: string;
  bank_name: string;
  account_holder: string;
  account_number: string;
  is_primary: boolean;
  is_verified: boolean;
  created_at: string;
  beneficiary_id: string;
}

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
    icon: "🔗",
    iconBg: "rgba(254,160,150,0.15)",
    iconColor: "#934841",
    label: "Chase Bank Linked",
    date: "Oct 12, 2023",
    status: "Completed",
  },
  {
    id: "2",
    icon: "✓",
    iconBg: "rgba(255,223,152,0.4)",
    iconColor: "#775a00",
    label: "Micro-deposit Verification",
    date: "Oct 10, 2023",
    status: "Completed",
  },
  {
    id: "3",
    icon: "!",
    iconBg: "rgba(255,218,214,0.5)",
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
    <span style={{
      padding: "0.25rem 0.75rem",
      background: "#f4dddc",
      color: "#79342e",
      borderRadius: "999px",
      fontSize: "0.625rem",
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    }}>
      Completed
    </span>
  ) : (
    <span style={{
      padding: "0.25rem 0.75rem",
      background: "rgba(255,218,214,0.6)",
      color: "#ba1a1a",
      borderRadius: "999px",
      fontSize: "0.625rem",
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    }}>
      Rejected
    </span>
  );

const EventRow: React.FC<{ event: BankingEvent }> = ({ event }) => (
  <tr style={{ borderBottom: `1px solid ${S.outlineVariant}1a` }}>
    <td style={{ padding: "1.5rem 2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div
          style={{
            width: "2.5rem",
            height: "2.5rem",
            borderRadius: "999px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: event.iconBg,
            color: event.iconColor,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            fontSize: "1.125rem",
            fontWeight: 700,
          }}
        >
          {event.icon}
        </div>
        <span style={{ fontWeight: 700, color: S.onSurface, fontSize: "0.9375rem" }}>{event.label}</span>
      </div>
    </td>
    <td style={{ padding: "1.5rem 2rem", fontSize: "0.875rem", fontWeight: 500, color: "#554240" }}>
      {event.date}
    </td>
    <td style={{ padding: "1.5rem 2rem" }}>
      <StatusBadge status={event.status} />
    </td>
    <td style={{ padding: "1.5rem 2rem", textAlign: "right" }}>
      <button 
        type="button"
        style={{ 
          color: "#d4d4d8", 
          background: "none", 
          border: "none", 
          cursor: "pointer", 
          padding: "0.5rem",
          borderRadius: "999px",
          display: "inline-flex",
          transition: "color 0.15s"
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = S.primary)}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#d4d4d8")}
      >
        <span style={{ fontSize: "1.125rem" }}>ℹ</span>
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

const NavItem = React.memo<NavItemProps>(({ icon, label, active, collapsed, href }) => {
  const paddingValue = collapsed ? "0.75rem" : "0.75rem 1rem 0.75rem 2rem";
  
  let marginLeftValue: string | number = 0;
  if (active) {
    marginLeftValue = "1rem";
  } else if (collapsed) {
    marginLeftValue = "0.75rem";
  }
  
  let marginRightValue: string | number = 0;
  if (!active && collapsed) {
    marginRightValue = "0.75rem";
  }
  
  return (
    <a
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: paddingValue,
        justifyContent: collapsed ? "center" : "flex-start",
        borderRadius: active ? "999px 0 0 999px" : "999px",
        marginLeft: marginLeftValue,
        marginRight: marginRightValue,
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
  );
});
NavItem.displayName = "NavItem";

const NAV_ITEMS = [
  { icon: <LayoutDashboard size={20} />, label: "Overview", active: false, href: "/dashboard" },
  { icon: <CreditCard size={20} />, label: "Funds", active: false, href: "/fund-management" },
  { icon: <Landmark size={20} />, label: "Banking", active: true, href: "/banking-details" },
  { icon: <IdCard size={20} />, label: "Identity", active: false, href: "/identity-verification" },
  { icon: <User size={20} />, label: "Profile", active: false, href: "/profile-settings" },
  { icon: <ShieldCheck size={20} />, label: "Security", active: false, href: "/security-settings" },
];

const SIDEBAR_W_EXPANDED = 220;
const SIDEBAR_W_COLLAPSED = 80;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BankingDetailsPage() {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const supabase = createClient();
  
  const toggleSidebar = useCallback(() => setCollapsed((p) => !p), []);
  const sidebarW = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED;

  // Fetch bank accounts on mount
  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("No user found");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("beneficiary_profiles")
        .select("id, bank_name, account_name, account_number, created_at, auth_user_id")
        .eq("auth_user_id", user.id)
        .single();

      console.log("DEBUG user.id:", user.id);
      console.log("DEBUG data:", JSON.stringify(data));
      console.log("DEBUG error:", error?.message, error?.code);

      if (error) {
        console.error("Error fetching bank accounts:", error.message, error.code, error.details);
      } else if (data && data.account_number) {
        // Transform the profile data to match the BankAccount interface
        const bankAccount: BankAccount = {
          id: data.id,
          bank_name: data.bank_name || "Bank Account",
          account_holder: data.account_name || "Account Holder",
          account_number: data.account_number,
          is_primary: true,
          is_verified: true,
          created_at: data.created_at,
          beneficiary_id: data.auth_user_id,
        };
        setBankAccounts([bankAccount]);
      } else {
        setBankAccounts([]);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to remove your bank details?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("beneficiary_profiles")
        .update({ bank_name: null, account_name: null, account_number: null })
        .eq("id", accountId);

      if (error) {
        console.error("Error removing bank details:", error.message);
        alert("Failed to remove bank details");
      } else {
        fetchBankAccounts();
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to remove bank details");
    }
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return "•••• " + accountNumber.slice(-4);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

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
          <header style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: S.onSurface, letterSpacing: "-0.02em", marginBottom: "0.5rem", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              Banking Details
            </h1>
            <p style={{ color: S.onSurfaceVariant, fontSize: "1.125rem", maxWidth: "40rem", lineHeight: 1.5 }}>
              Manage your verified bank accounts for disbursements. Your security is our highest priority.
            </p>
          </header>

          {/* Layout */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "64rem", margin: "0 auto", width: "100%" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem", color: S.onSurfaceVariant }}>
                <p>Loading bank accounts...</p>
              </div>
            ) : bankAccounts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <p style={{ color: S.onSurfaceVariant, marginBottom: "1.5rem" }}>No bank accounts connected yet</p>
              </div>
            ) : (
              <>
                {/* Bank Account Cards */}
                {bankAccounts.map((account) => (
                  <div 
                    key={account.id}
                    style={{ 
                      background: S.surfaceContainerLowest, 
                      borderRadius: "0.75rem", 
                      padding: "2rem", 
                      position: "relative", 
                      overflow: "hidden", 
                      boxShadow: "0px 12px 32px rgba(151,69,62,0.06)" 
                    }}
                  >
                    <div style={{ position: "absolute", right: "-1rem", top: "-1rem", width: "6rem", height: "6rem", background: `${S.primary}05`, borderRadius: "999px" }} />
                    <div style={{ position: "absolute", top: "1.5rem", right: "2rem" }}>
                      {account.is_verified && (
                        <span style={{
                          background: "#f4dddc",
                          color: "#79342e",
                          padding: "0.375rem 1rem",
                          borderRadius: "999px",
                          fontSize: "0.625rem",
                          fontWeight: 800,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.375rem",
                        }}>
                          <CheckCircle size={14} fill="#79342e" />
                          Verified
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5rem", position: "relative", zIndex: 10 }}>
                      <div style={{
                        width: "4rem",
                        height: "4rem",
                        borderRadius: "0.75rem",
                        background: "#fae3e1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: S.primary,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      }}>
                        <Landmark size={32} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", flex: 1 }}>
                        <div>
                          <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: S.onSurface, letterSpacing: "-0.01em", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                            {account.bank_name}
                          </h3>
                          <p style={{ color: S.onSurfaceVariant, fontSize: "0.875rem", fontWeight: 500 }}>
                            {account.is_primary ? "Primary Disbursement Account" : "Disbursement Account"}
                          </p>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "2rem" }}>
                          <div>
                            <p style={{ fontSize: "0.625rem", fontWeight: 800, color: `${S.onSurfaceVariant}80`, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
                              Account Holder
                            </p>
                            <p style={{ fontWeight: 700, color: S.onSurface }}>{account.account_holder}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: "0.625rem", fontWeight: 800, color: `${S.onSurfaceVariant}80`, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
                              Account Number
                            </p>
                            <p style={{ fontWeight: 700, color: S.onSurface }}>{maskAccountNumber(account.account_number)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: "2rem", display: "flex", alignItems: "center", gap: "1.5rem", borderTop: `1px solid ${S.outlineVariant}1a`, paddingTop: "1.5rem" }}>
                      <button 
                        type="button"
                        style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "0.5rem", 
                          color: S.primary, 
                          fontWeight: 700, 
                          fontSize: "0.8125rem",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          transition: "transform 0.15s"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateX(4px)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateX(0)")}
                      >
                        <Edit size={18} />
                        <span>Edit Details</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleDeleteAccount(account.id)}
                        style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "0.5rem", 
                          color: S.error, 
                          fontWeight: 700, 
                          fontSize: "0.8125rem",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          marginLeft: "auto",
                          fontFamily: "Plus Jakarta Sans, sans-serif",
                          transition: "opacity 0.15s"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                      >
                        <Trash2 size={18} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Add New Bank CTA */}
            <a 
              href="/connect-bank" 
              style={{
                width: "100%",
                border: `2px dashed ${S.outlineVariant}4d`,
                borderRadius: "0.75rem",
                padding: "2.5rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "1rem",
                textDecoration: "none",
                transition: "background 0.15s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#fff0ef")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{
                width: "3.5rem",
                height: "3.5rem",
                borderRadius: "999px",
                background: `${S.primary}15`,
                color: S.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                transition: "transform 0.15s",
              }}>
                <Plus size={28} />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: 800, color: S.onSurface, fontSize: "1.125rem", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                  Add New Bank Account
                </p>
                <p style={{ fontSize: "0.875rem", color: S.onSurfaceVariant, fontWeight: 500 }}>
                  Connect another secure source for your fund transfers
                </p>
              </div>
            </a>
          </div>

          {/* Banking Activity */}
          <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 0.5rem" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.01em", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                  Banking Activity
                </h3>
                <p style={{ fontSize: "0.875rem", color: S.onSurfaceVariant, fontWeight: 500 }}>
                  History of account links and verifications
                </p>
              </div>
              <button 
                type="button"
                style={{ 
                  color: S.primary, 
                  fontSize: "0.8125rem", 
                  fontWeight: 800, 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "0.25rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  transition: "opacity 0.15s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Download Report
                {" "}
                <span style={{ fontSize: "0.875rem" }}>↓</span>
              </button>
            </div>
            <div style={{ background: S.surfaceContainerLowest, borderRadius: "0.75rem", boxShadow: "0px 12px 32px rgba(151,69,62,0.06)", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: S.surfaceContainerLow }}>
                      {["Event", "Date", "Status", "Details"].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "1.25rem 2rem",
                            fontSize: "0.625rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            color: S.onSurfaceVariant,
                            textAlign: h === "Details" ? "right" : "left",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
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
    </div>
  );
}

