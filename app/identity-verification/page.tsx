"use client";

import React, { useState } from "react";
import {
  Menu, Bell, LayoutDashboard, CreditCard,
  Landmark, IdCard, User, ShieldCheck,
  HelpCircle, MoreVertical, ZoomIn, UploadCloud, ArrowRight, Shield, HelpCircleIcon,
} from "lucide-react";
import { S, LOGO_SRC, BeneficiaryStyle } from "@/app/shared/beneficiary-shared";

// ─── Types ────────────────────────────────────────────────────────────────────

type VerificationStatus = "Approved" | "Pending" | "Rejected";

interface VerificationEntry {
  date: string;
  docType: string;
  docIcon: React.ReactNode;
  status: VerificationStatus;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: VerificationStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles: Record<VerificationStatus, { bg: string; color: string }> = {
    Approved: { bg: S.surfaceContainerHighest, color: S.onSecondaryContainer },
    Pending: { bg: S.tertiaryFixed, color: S.onTertiaryContainer },
    Rejected: { bg: `${S.errorContainer}66`, color: S.onErrorContainer },
  };
  const style = styles[status];
  return (
    <span
      style={{
        padding: "0.25rem 0.75rem",
        background: style.bg,
        color: style.color,
        borderRadius: "999px",
        fontSize: "0.625rem",
        fontWeight: 700,
        textTransform: "uppercase",
        fontFamily: "Plus Jakarta Sans, sans-serif",
      }}
    >
      {status}
    </span>
  );
};

interface VerificationRowProps {
  entry: VerificationEntry;
}

const VerificationRow: React.FC<VerificationRowProps> = ({ entry }) => (
  <tr
    style={{
      borderBottom: `1px solid ${S.outlineVariant}1a`,
      transition: "background 0.15s",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = `${S.surfaceContainerLow}80`)}
    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
  >
    <td style={{ padding: "1.25rem 2rem", fontSize: "0.875rem", fontWeight: 500 }}>{entry.date}</td>
    <td style={{ padding: "1.25rem 2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span style={{ color: S.primary, display: "flex" }}>{entry.docIcon}</span>
        <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{entry.docType}</span>
      </div>
    </td>
    <td style={{ padding: "1.25rem 2rem" }}>
      <StatusBadge status={entry.status} />
    </td>
    <td style={{ padding: "1.25rem 2rem", textAlign: "right" }}>
      <button
        style={{
          color: S.onSurfaceVariant,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0.5rem",
          borderRadius: "999px",
          display: "inline-flex",
          transition: "color 0.15s, background 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = S.primary;
          e.currentTarget.style.background = `${S.primary}0d`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = S.onSurfaceVariant;
          e.currentTarget.style.background = "transparent";
        }}
      >
        <MoreVertical size={20} />
      </button>
    </td>
  </tr>
);

// ─── Nav Item ──────────────────────────────────────────────────────────────────

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed: boolean;
  href: string;
}

const NavItem = React.memo<NavItemProps>(({ icon, label, active = false, collapsed, href }) => (
  <a
    href={href}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      padding: collapsed ? "0.75rem" : "0.75rem 1rem 0.75rem 2rem",
      justifyContent: collapsed ? "center" : "flex-start",
      borderRadius: active ? "999px 0 0 999px" : "999px",
      marginLeft: active ? "1rem" : collapsed ? "0.75rem" : 0,
      marginRight: active ? 0 : collapsed ? "0.75rem" : 0,
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
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.color = S.primary;
        e.currentTarget.style.transform = "translateX(4px)";
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.color = "#78716c";
        e.currentTarget.style.transform = "translateX(0)";
      }
    }}
  >
    {icon}
    {!collapsed && <span style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>{label}</span>}
  </a>
));
NavItem.displayName = "NavItem";

// ─── Nav Data ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: <LayoutDashboard size={20} />, label: "Overview", active: false, href: "/dashboard" },
  { icon: <CreditCard size={20} />, label: "Funds", active: false, href: "/fund-management" },
  { icon: <Landmark size={20} />, label: "Banking", active: false, href: "/banking-details" },
  { icon: <IdCard size={20} />, label: "Identity", active: true, href: "/identity-verification" },
  { icon: <User size={20} />, label: "Profile", active: false, href: "/profile-settings" },
  { icon: <ShieldCheck size={20} />, label: "Security", active: false, href: "/security-settings" },
];

const SIDEBAR_W_EXPANDED = 220;
const SIDEBAR_W_COLLAPSED = 80;

// ─── Main Component ───────────────────────────────────────────────────────────

const IdentityVerification: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);

  const history: VerificationEntry[] = [
    { date: "Mar 12, 2024", docType: "Passport (P-9283)", docIcon: <IdCard size={20} />, status: "Approved" },
    { date: "Jan 05, 2024", docType: "Driver's License", docIcon: <CreditCard size={20} />, status: "Pending" },
    { date: "Dec 20, 2023", docType: "National ID Card", docIcon: <Landmark size={20} />, status: "Rejected" },
  ];

  const sidebarW = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED;

  return (
    <div style={{ background: S.surface, color: S.onSurface, minHeight: "100vh", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <BeneficiaryStyle />
      <style>{`
        .nav-transition { transition: width 0.3s cubic-bezier(0.4,0,0.2,1); }
        .main-transition { transition: margin-left 0.3s cubic-bezier(0.4,0,0.2,1); }
      `}</style>

      {/* TopNav */}
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
            onClick={() => setCollapsed((p) => !p)}
            style={{
              padding: "0.5rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#78716c",
              borderRadius: "999px",
              display: "flex",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = S.surfaceContainerHigh)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Menu size={22} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <img src={LOGO_SRC} alt="HOPECARD Logo" style={{ height: "2rem", width: "auto", objectFit: "contain" }} />
            <span style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.03em", color: S.primary }}>
              HOPECARD
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <button
            style={{
              padding: "0.5rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#78716c",
              borderRadius: "999px",
              display: "flex",
              position: "relative",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = S.surfaceContainerHigh)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Bell size={22} />
            <span
              style={{
                position: "absolute",
                top: "0.5rem",
                right: "0.5rem",
                width: "0.5rem",
                height: "0.5rem",
                background: S.error,
                borderRadius: "999px",
              }}
            />
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
        {/* Sidebar */}
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
              <p
                style={{
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: S.onSurfaceVariant,
                  marginBottom: "0.5rem",
                }}
              >
                Member Portal
              </p>
              <div style={{ padding: "1rem", background: S.surfaceContainerLowest, borderRadius: "0.5rem" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: S.primary, margin: "0 0 0.125rem" }}>
                  Verified Member
                </p>
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

        <main
          className="main-transition"
          style={{
            flex: 1,
            marginLeft: `${sidebarW}px`,
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
            minHeight: "calc(100vh - 5rem)",
          }}
        >
          {/* Header */}
          <header style={{ marginBottom: "2.5rem" }}>
            <h1
              style={{
                fontSize: "2.25rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: S.onSurface,
                margin: "0 0 0.5rem",
              }}
            >
              Identity Verification
            </h1>
            <p style={{ color: S.onSurfaceVariant, maxWidth: "48rem", lineHeight: 1.6, margin: 0 }}>
              Manage your identification documents and verification status. Securely upload and track the progress of your identity proofs.
            </p>
          </header>

          {/* Document Management */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Active Document Card */}
            <div
              style={{
                background: S.surfaceContainerLowest,
                borderRadius: "0.75rem",
                padding: "2rem",
                boxShadow: "0px 12px 32px rgba(151,69,62,0.06)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                  <div
                    style={{
                      width: "16rem",
                      height: "11rem",
                      background: S.surfaceContainerHigh,
                      borderRadius: "0.75rem",
                      overflow: "hidden",
                      position: "relative",
                      border: `1px solid ${S.outlineVariant}26`,
                      flexShrink: 0,
                    }}
                  >
                    <img
                      alt="Passport thumbnail preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzpoDzDEYZVFArX99NpiTRXfw6-id5Ej6sNoYcIwUhj_SWHh8nQORWTeVl9HgetDnhcLlp0g6bry7qfugfXOSMfxdv831iDJlHglQEHE6MBLKGmbaRljXmGjrPmHvzio7CDxqD-AHtKLj2rVCF99iN_qFdaDPQjpAP5DUNQ3hO7vvEDzefd-7gh2NBzCeUddU2UJORD-tJmfxxfPho_keIFO-ncTpqxHbWCe5JomW8AMbVrZB9gROcPEEPueQNEtbGzCI0uK77qIDr"
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: `${S.primary}33`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: 0,
                        transition: "opacity 0.15s",
                        backdropFilter: "blur(2px)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                    >
                      <button
                        style={{
                          background: S.surfaceContainerLowest,
                          padding: "0.75rem",
                          borderRadius: "999px",
                          color: S.primary,
                          boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          transition: "transform 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      >
                        <ZoomIn size={20} />
                      </button>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div>
                      <span
                        style={{
                          fontSize: "0.625rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.15em",
                          color: S.primary,
                        }}
                      >
                        Active Document
                      </span>
                      <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0.25rem 0" }}>Biometric Passport</h3>
                      <p style={{ color: S.onSurfaceVariant, fontSize: "0.875rem", margin: "0.25rem 0" }}>
                        Issued by National Authority • Valid until Oct 2028
                      </p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))", gap: "1rem" }}>
                      <div
                        style={{
                          background: S.surface,
                          padding: "1rem",
                          borderRadius: "0.75rem",
                          border: `1px solid ${S.outlineVariant}1a`,
                        }}
                      >
                        <p
                          style={{
                            fontSize: "0.625rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.12em",
                            color: S.onSurfaceVariant,
                            margin: "0 0 0.25rem",
                          }}
                        >
                          Uploaded On
                        </p>
                        <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>March 12, 2024</p>
                      </div>
                      <div
                        style={{
                          background: S.surface,
                          padding: "1rem",
                          borderRadius: "0.75rem",
                          border: `1px solid ${S.outlineVariant}1a`,
                        }}
                      >
                        <p
                          style={{
                            fontSize: "0.625rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.12em",
                            color: S.onSurfaceVariant,
                            margin: "0 0 0.25rem",
                          }}
                        >
                          Verification Level
                        </p>
                        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: S.tertiary, margin: 0 }}>Level 3 (Full)</p>
                      </div>
                    </div>
                    <button
                      style={{
                        width: "fit-content",
                        padding: "0.875rem 2.5rem",
                        background: S.primary,
                        color: S.onPrimary,
                        borderRadius: "999px",
                        fontWeight: 700,
                        fontSize: "0.875rem",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                        boxShadow: `0 4px 16px ${S.primary}33`,
                        transition: "transform 0.15s",
                        fontFamily: "Plus Jakarta Sans, sans-serif",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    >
                      <UploadCloud size={18} />
                      {" "}
                      Upload New Document
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification History */}
            <div
              style={{
                background: S.surfaceContainerLowest,
                borderRadius: "0.75rem",
                boxShadow: "0px 12px 32px rgba(151,69,62,0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "1.5rem",
                  borderBottom: `1px solid ${S.outlineVariant}1a`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>Verification History</h3>
                <button
                  style={{
                    color: S.primary,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    transition: "opacity 0.15s",
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Download Report
                </button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: S.surfaceContainerLow }}>
                      {["Date", "Document Type", "Status", "Action"].map((h, i) => (
                        <th
                          key={i}
                          style={{
                            padding: "1rem 2rem",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.12em",
                            color: S.onSurfaceVariant,
                            textAlign: i === 3 ? "right" : "left",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((entry) => (
                      <VerificationRow key={`${entry.date}-${entry.docType}`} entry={entry} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer Help */}
          <section style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))", gap: "2rem", paddingBottom: "3rem" }}>
            <div
              style={{
                background: `${S.surfaceContainerHighest}4d`,
                borderRadius: "0.75rem",
                padding: "2rem",
                border: `1px solid ${S.outlineVariant}1a`,
              }}
            >
              <h4 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Shield size={20} style={{ color: S.primary }} />
                {" "}
                Privacy Matters
              </h4>
              <p style={{ color: S.onSurfaceVariant, fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
                Your identification documents are encrypted at rest and in transit. We only use this data for regulatory compliance and identity verification as per our privacy policy.
              </p>
            </div>
            <div
              style={{
                background: `${S.surfaceContainerHighest}4d`,
                borderRadius: "0.75rem",
                padding: "2rem",
                border: `1px solid ${S.outlineVariant}1a`,
              }}
            >
              <h4 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <HelpCircleIcon size={20} style={{ color: S.primary }} />
                {" "}
                Need Assistance?
              </h4>
              <p style={{ color: S.onSurfaceVariant, fontSize: "0.875rem", lineHeight: 1.6, margin: "0 0 1.5rem" }}>
                If your document was rejected or you're experiencing issues uploading, our verification team is here to help.
              </p>
              <button
                style={{
                  color: S.primary,
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Contact Verification Team
                {" "}
                <ArrowRight size={14} />
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default IdentityVerification;
