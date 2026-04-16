"use client";

import React, { useState, useCallback } from "react";
import {
  Menu, Bell, LayoutDashboard, CreditCard,
  Landmark, IdCard, User, ShieldCheck, HelpCircle, TrendingUp, ArrowRight
} from "lucide-react";
import { S, LOGO_SRC, BeneficiaryStyle } from "@/app/shared/beneficiary-shared";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  date: string;
  campaign: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  refId: string;
  amount: string;
  status: "Completed" | "Pending";
}

interface Withdrawal {
  id: string;
  date: string;
  label: string;
  amount: string;
  status: "Successful" | "Processing";
  dotColor: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    date: "Oct 24, 2023",
    campaign: "Higher Ed Scholarship",
    icon: "🎓",
    iconBg: "#f4dddc",
    iconColor: "#97453e",
    refId: "TXN-4921-X9",
    amount: "15,000 PHP",
    status: "Completed",
  },
  {
    id: "2",
    date: "Oct 20, 2023",
    campaign: "Healthcare Grant Q4",
    icon: "⚕️",
    iconBg: "rgba(255,223,152,0.3)",
    iconColor: "#775a00",
    refId: "TXN-8812-P0",
    amount: "5,600 PHP",
    status: "Pending",
  },
  {
    id: "3",
    date: "Oct 12, 2023",
    campaign: "Community Aid Fund",
    icon: "🤝",
    iconBg: "#f4dddc",
    iconColor: "#97453e",
    refId: "TXN-1129-K1",
    amount: "24,400 PHP",
    status: "Completed",
  },
];

const WITHDRAWALS: Withdrawal[] = [
  {
    id: "1",
    date: "Oct 26, 2023",
    label: "Bank Transfer to BDO",
    amount: "12,000 PHP",
    status: "Successful",
    dotColor: "#97453e",
  },
  {
    id: "2",
    date: "Oct 15, 2023",
    label: "GCash Disbursement",
    amount: "5,000 PHP",
    status: "Successful",
    dotColor: "#97453e",
  },
  {
    id: "3",
    date: "Oct 02, 2023",
    label: "ATM Withdrawal",
    amount: "2,500 PHP",
    status: "Processing",
    dotColor: "#cda336",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: Transaction["status"] }> = ({ status }) => {
  return status === "Completed" ? (
    <span style={{
      padding: "0.25rem 0.75rem",
      borderRadius: "999px",
      fontSize: "0.625rem",
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      background: "#f4dddc",
      color: "#79342e",
    }}>
      Completed
    </span>
  ) : (
    <span style={{
      padding: "0.25rem 0.75rem",
      borderRadius: "999px",
      fontSize: "0.625rem",
      fontWeight: 800,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      background: "#ffdf98",
      color: "#4f3b00",
    }}>
      Pending
    </span>
  );
};

const TransactionRow: React.FC<{ tx: Transaction }> = ({ tx }) => (
  <tr style={{ borderBottom: `1px solid ${S.outlineVariant}1a` }}>
    <td style={{ padding: "1.5rem 2rem", fontSize: "0.875rem", fontWeight: 700 }}>{tx.date}</td>
    <td style={{ padding: "1.5rem 2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div
          style={{
            width: "2rem",
            height: "2rem",
            borderRadius: "999px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: tx.iconBg,
            color: tx.iconColor,
            fontSize: "0.875rem",
            fontWeight: 700,
          }}
        >
          {tx.icon}
        </div>
        <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{tx.campaign}</span>
      </div>
    </td>
    <td style={{ padding: "1.5rem 2rem", fontSize: "0.875rem", fontFamily: "monospace", color: "#554240" }}>{tx.refId}</td>
    <td style={{ padding: "1.5rem 2rem", fontSize: "0.875rem", fontWeight: 800, textAlign: "right" }}>{tx.amount}</td>
    <td style={{ padding: "1.5rem 2rem", textAlign: "center" }}>
      <StatusBadge status={tx.status} />
    </td>
  </tr>
);

const WithdrawalItem: React.FC<{ w: Withdrawal }> = ({ w }) => (
  <div style={{ position: "relative", paddingLeft: "2rem", borderLeft: `2px solid ${S.primary}33` }}>
    <div
      style={{
        position: "absolute",
        left: "-9px",
        top: 0,
        width: "1rem",
        height: "1rem",
        borderRadius: "999px",
        background: w.dotColor,
        border: "4px solid white",
      }}
    />
    <p style={{ fontSize: "0.625rem", fontWeight: 800, color: "#554240", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
      {w.date}
    </p>
    <p style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.25rem" }}>{w.label}</p>
    <p style={{ fontSize: "1.125rem", fontWeight: 800, color: S.primary, marginTop: "0.25rem" }}>{w.amount}</p>
    <p style={{
      fontSize: "0.625rem",
      fontWeight: 700,
      textTransform: "uppercase",
      marginTop: "0.5rem",
      color: w.status === "Successful" ? "#16a34a" : "#4f3b00",
    }}>
      {w.status}
    </p>
  </div>
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
  { icon: <CreditCard size={20} />, label: "Funds", active: true, href: "/fund-management" },
  { icon: <Landmark size={20} />, label: "Banking", active: false, href: "/banking-details" },
  { icon: <IdCard size={20} />, label: "Identity", active: false, href: "/identity-verification" },
  { icon: <User size={20} />, label: "Profile", active: false, href: "/profile-settings" },
  { icon: <ShieldCheck size={20} />, label: "Security", active: false, href: "/security-settings" },
];

const SIDEBAR_W_EXPANDED = 220;
const SIDEBAR_W_COLLAPSED = 80;

// ─── Main Component ───────────────────────────────────────────────────────────

const FundManagement: React.FC = () => {
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
            gap: "2rem",
            minHeight: "calc(100vh - 5rem)",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1.5rem" }}>
              <div>
                <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: S.onSurface, letterSpacing: "-0.02em", marginBottom: "0.5rem", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                  Fund Management
                </h1>
                <p style={{ color: S.onSurfaceVariant, fontSize: "1.125rem", maxWidth: "40rem" }}>
                  Track, manage, and withdraw your accumulated benefits with dignity.
                </p>
              </div>
              <a 
                href="/request-withdrawal" 
                style={{
                  background: S.primary,
                  color: S.onPrimary,
                  padding: "1rem 2rem",
                  borderRadius: "0.75rem",
                  fontWeight: 700,
                  boxShadow: "0 10px 25px rgba(151,69,62,0.15)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                  transition: "transform 0.15s",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <CreditCard size={20} />
                Request Withdrawal
              </a>
            </div>
          </div>

          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {/* Card 1 */}
            <div style={{ background: S.surfaceContainerLowest, padding: "2rem", borderRadius: "0.75rem", boxShadow: "0px 12px 32px rgba(151,69,62,0.06)", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "12rem", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: "-1rem", top: "-1rem", width: "6rem", height: "6rem", background: `${S.primary}10`, borderRadius: "999px", transition: "transform 0.3s" }} />
              <div>
                <p style={{ fontSize: "0.625rem", fontWeight: 700, color: S.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Total Funds Received
                </p>
                <h3 style={{ fontSize: "2.5rem", fontWeight: 800, color: S.onSurface, marginTop: "1rem", letterSpacing: "-0.02em", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                  45,000{" "}
                  <span style={{ fontSize: "1.125rem", fontWeight: 500, color: S.onSurfaceVariant, opacity: 0.6 }}>PHP</span>
                </h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", color: S.primary, gap: "0.25rem", marginTop: "1rem" }}>
                <TrendingUp size={16} />
                <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>+12% from last month</span>
              </div>
            </div>

            {/* Card 2 */}
            <div style={{ background: S.surfaceContainerLowest, padding: "2rem", borderRadius: "0.75rem", boxShadow: "0px 12px 32px rgba(151,69,62,0.06)", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "12rem", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: "-1rem", top: "-1rem", width: "6rem", height: "6rem", background: "rgba(255,223,152,0.2)", borderRadius: "999px" }} />
              <div>
                <p style={{ fontSize: "0.625rem", fontWeight: 700, color: S.onSurfaceVariant, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Pending Disbursements
                </p>
                <h3 style={{ fontSize: "2.5rem", fontWeight: 800, color: S.onSurface, marginTop: "1rem", letterSpacing: "-0.02em", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                  5,600{" "}
                  <span style={{ fontSize: "1.125rem", fontWeight: 500, color: S.onSurfaceVariant, opacity: 0.6 }}>PHP</span>
                </h3>
              </div>
              <p style={{ fontSize: "0.8125rem", color: S.onSurfaceVariant, marginTop: "1rem" }}>
                Awaiting campaign verification
              </p>
            </div>

            {/* Card 3 */}
            <div style={{ background: S.primary, padding: "2rem", borderRadius: "0.75rem", boxShadow: "0px 12px 32px rgba(151,69,62,0.06)", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "12rem", color: S.onPrimary, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: "-1rem", top: "-1rem", width: "8rem", height: "8rem", background: "rgba(242,141,131,0.2)", borderRadius: "999px" }} />
              <div>
                <p style={{ fontSize: "0.625rem", fontWeight: 700, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Available for Withdrawal
                </p>
                <h3 style={{ fontSize: "2.5rem", fontWeight: 800, marginTop: "1rem", letterSpacing: "-0.02em", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                  12,300{" "}
                  <span style={{ fontSize: "1.125rem", fontWeight: 500, opacity: 0.7 }}>PHP</span>
                </h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 600 }}>Ready to transfer</span>
                <ArrowRight size={20} />
              </div>
            </div>
          </div>

            {/* Content Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "2rem" }}>
              {/* Transactions */}
              <div style={{ gridColumn: "span 8" }}>
              <div style={{ background: S.surfaceContainerLowest, borderRadius: "0.75rem", boxShadow: "0px 12px 32px rgba(151,69,62,0.06)", overflow: "hidden" }}>
                <div style={{ padding: "2rem", borderBottom: `1px solid ${S.outlineVariant}1a`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                    Transaction History
                  </h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: S.surfaceContainerLow }}>
                        {["Date", "Source Campaign", "Reference ID", "Amount", "Status"].map((h, i) => {
                          let textAlign: "left" | "right" | "center" = "left";
                          if (h === "Amount") textAlign = "right";
                          if (h === "Status") textAlign = "center";
                          
                          return (
                            <th
                              key={h}
                              style={{
                                padding: "1rem 2rem",
                                fontSize: "0.625rem",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                color: S.onSurfaceVariant,
                                textAlign,
                              }}
                            >
                              {h}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {TRANSACTIONS.map((tx) => (
                        <TransactionRow key={tx.id} tx={tx} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Withdrawals Sidebar */}
            <div style={{ gridColumn: "span 4" }}>
              <div style={{ background: `${S.surfaceContainerHigh}66`, padding: "2rem", borderRadius: "0.75rem", boxShadow: "0px 12px 32px rgba(151,69,62,0.04)", border: `1px solid ${S.outlineVariant}1a` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, fontFamily: "Plus Jakarta Sans, sans-serif" }}>Withdrawals</h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                  {WITHDRAWALS.map((w) => (
                    <WithdrawalItem key={w.id} w={w} />
                  ))}
                </div>
                <button 
                  type="button"
                  style={{ 
                    width: "100%", 
                    marginTop: "2.5rem", 
                    color: S.primary, 
                    fontWeight: 700, 
                    fontSize: "0.8125rem", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    gap: "0.5rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "Plus Jakarta Sans, sans-serif",
                    transition: "opacity 0.15s"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  View Full Report
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FundManagement;
