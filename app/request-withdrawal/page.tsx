"use client";

import React, { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BankOption {
  value: string;
  label: string;
}

interface WithdrawalFormState {
  amount: string;
  bank: string;
  notes: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const BANK_OPTIONS: BankOption[] = [
  { value: "chase", label: "Chase Bank •••• 4219 (Primary)" },
  { value: "wells", label: "Wells Fargo •••• 9802" },
  { value: "add", label: "+ Link New Bank Account" },
];

const GUIDELINES = [
  {
    icon: "schedule",
    title: "Processing Time",
    desc: "Requests before 2 PM EST are reviewed same-day. Funds arrive in 1-3 business days.",
  },
  {
    icon: "info",
    title: "Limit Thresholds",
    desc: "Daily limit of $5,000 for standard accounts. Contact support for higher volume transfers.",
  },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navItems = [
    { icon: "dashboard", label: "Overview", active: false, href: "/dashboard" },
    { icon: "payments", label: "Funds", active: false, href: "/fund-management" },
    { icon: "account_balance", label: "Banking", active: true, href: "/banking-details" },
    { icon: "badge", label: "Identity", active: false, href: "/dashboard" },
    { icon: "person", label: "Profile", active: false, href: "/dashboard" },
    { icon: "security", label: "Security", active: false, href: "/dashboard" },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col gap-2 fixed left-0 top-0 pt-24 h-screen bg-[#fae3e1] z-40 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        collapsed ? "w-20" : "w-[220px]"
      }`}
    >
      {!collapsed && (
        <div className="px-6 mb-8">
          <p className="text-[#554240] uppercase tracking-wider text-[10px] font-bold mb-2">
            Beneficiary Portal
          </p>
          <div className="p-4 bg-white rounded-lg">
            <p className="text-xs font-bold text-[#97453e]">Verified Member</p>
            <p className="text-[10px] text-[#554240]">Active since 2023</p>
          </div>
        </div>
      )}

      <nav className="flex flex-col gap-1">
        {navItems.map((item) =>
          item.active ? (
            <a
              key={item.label}
              href={item.href}
              style={{ textDecoration: "none" }}
              className={`bg-white text-[#97453e] rounded-l-full shadow-sm font-bold flex items-center gap-3 py-3 transition-all ${
                collapsed
                  ? "justify-center mx-3 px-0 rounded-full"
                  : "ml-4 pl-8"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </a>
          ) : (
            <a
              key={item.label}
              href={item.href}
              style={{ textDecoration: "none" }}
              className={`text-stone-600 py-3 hover:text-[#97453e] hover:translate-x-1 transition-all flex items-center gap-3 font-medium text-sm ${
                collapsed ? "justify-center mx-3 px-0 rounded-full" : "pl-8"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </a>
          )
        )}
      </nav>

      <div className="mt-auto px-6 pb-8">
        <button
          className={`bg-[#97453e] text-white rounded-full font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 ${
            collapsed ? "w-12 h-12 mx-auto p-0" : "w-full py-3"
          }`}
        >
          <span className="material-symbols-outlined text-lg">help</span>
          {!collapsed && <span>Request Support</span>}
        </button>
      </div>
    </aside>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const RequestWithdrawal: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [form, setForm] = useState<WithdrawalFormState>({
    amount: "",
    bank: "chase",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // handle submit
  };

  return (
    <div className="bg-[#fff8f7] text-[#241918] min-h-screen font-[Plus_Jakarta_Sans] overflow-x-hidden">
      {/* TopNav */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-[0px_12px_32px_rgba(151,69,62,0.06)] flex justify-between items-center w-full px-8 h-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-2 -ml-2 text-stone-600 hover:bg-[#fae3e1] rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">
              {collapsed ? "menu_open" : "menu"}
            </span>
          </button>
          <span className="text-2xl font-bold tracking-tight text-[#97453e] hidden sm:inline">
            HOPECARD
          </span>
        </div>
        <button className="p-2 text-stone-500 hover:bg-[#fae3e1] transition-colors rounded-full relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#ba1a1a] rounded-full" />
        </button>
      </nav>

      <div className="flex">
        <Sidebar collapsed={collapsed} />

        <main
          className={`flex-1 pt-12 px-8 pb-12 min-h-screen transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            collapsed ? "ml-20" : "ml-[220px]"
          }`}
        >
          <div className="max-w-4xl mx-auto px-4">
            {/* Header */}
            <div className="mb-12 text-center md:text-left">
              <div className="max-w-xl mx-auto md:mx-0">
                <span className="text-[#97453e] font-bold tracking-[0.1em] uppercase block mb-2 text-sm">
                  Banking &amp; Withdrawals
                </span>
                <h1 className="text-4xl md:text-5xl font-bold text-[#241918] tracking-tight leading-none mb-4">
                  Request Withdrawal
                </h1>
                <p className="text-lg text-[#554240] leading-relaxed">
                  Securely transfer your accumulated benefits to your verified
                  bank account. Most requests are processed within 24-48
                  business hours.
                </p>
              </div>
            </div>

            <div className="space-y-8 flex flex-col items-center">
              {/* Form Card */}
              <div className="w-full bg-white p-10 rounded-xl shadow-[0px_12px_32px_rgba(151,69,62,0.06)]">
                <form className="space-y-8" onSubmit={handleSubmit}>
                  {/* Amount */}
                  <div>
                    <label
                      htmlFor="amount"
                      className="block text-xs font-bold text-[#554240] uppercase tracking-widest mb-3"
                    >
                      Amount to Withdraw
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-[#877270]">
                        $
                      </span>
                      <input
                        id="amount"
                        type="number"
                        value={form.amount}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="w-full bg-[#fff0ef] rounded-lg py-5 pl-12 pr-6 text-2xl font-bold text-[#241918] border border-[#dac1be]/15 focus:outline-none focus:border-[#97453e] focus:ring-4 focus:ring-[#ffbdbd]/20 transition-all placeholder:text-[#877270]/40"
                      />
                    </div>
                    <div className="mt-3 flex justify-between text-xs">
                      <span className="text-[#554240]">Min: $100.00</span>
                      <button
                        type="button"
                        className="text-[#97453e] font-bold hover:underline"
                      >
                        Withdraw Max Funds
                      </button>
                    </div>
                  </div>

                  {/* Bank Select */}
                  <div>
                    <label
                      htmlFor="bank"
                      className="block text-xs font-bold text-[#554240] uppercase tracking-widest mb-3"
                    >
                      Select Bank Account
                    </label>
                    <div className="relative">
                      <select
                        id="bank"
                        value={form.bank}
                        onChange={handleChange}
                        className="w-full bg-[#fff0ef] rounded-lg py-4 px-6 text-[#241918] font-medium appearance-none border border-[#dac1be]/15 focus:outline-none focus:border-[#97453e] focus:ring-4 focus:ring-[#ffbdbd]/20 transition-all"
                      >
                        {BANK_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#554240] pointer-events-none">
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label
                      htmlFor="notes"
                      className="block text-xs font-bold text-[#554240] uppercase tracking-widest mb-3"
                    >
                      Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      rows={4}
                      value={form.notes}
                      onChange={handleChange}
                      placeholder="Briefly describe the purpose of this withdrawal..."
                      className="w-full bg-[#fff0ef] rounded-lg p-6 text-[#241918] font-medium border border-[#dac1be]/15 focus:outline-none focus:border-[#97453e] focus:ring-4 focus:ring-[#ffbdbd]/20 transition-all placeholder:text-[#877270]/40"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-[#f28d83] text-[#6e2621] font-bold py-5 rounded-full hover:brightness-95 active:scale-95 transition-all text-lg shadow-sm"
                    >
                      Submit Request
                    </button>
                    <button
                      type="button"
                      className="sm:w-1/3 bg-transparent text-[#97453e] font-bold py-5 rounded-full hover:bg-[#f4dddc]/30 active:scale-95 transition-all text-lg border border-[#97453e]/20"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>

              {/* Guidelines Card */}
              <div className="w-full bg-[#fae3e1]/50 p-8 rounded-xl border border-[#dac1be]/10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-[#97453e]">
                    verified_user
                  </span>
                  <h3 className="text-xl font-semibold text-[#241918]">
                    Withdrawal Guidelines
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {GUIDELINES.map((g) => (
                    <div key={g.title} className="flex gap-4">
                      <div className="w-10 h-10 shrink-0 bg-white rounded-full flex items-center justify-center text-[#97453e]">
                        <span className="material-symbols-outlined">
                          {g.icon}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#241918] mb-1">
                          {g.title}
                        </p>
                        <p className="text-sm text-[#554240] leading-relaxed">
                          {g.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#fff8f7] px-6 py-4 flex justify-around items-center z-50 shadow-[0px_-8px_24px_rgba(151,69,62,0.08)]">
        {[
          { icon: "home", label: "Home", active: false, href: "/dashboard" },
          { icon: "account_balance", label: "Banking", active: true, href: "/banking-details" },
          { icon: "add", label: "", fab: true, href: "/connect-bank" },
          { icon: "payments", label: "Funds", active: false, href: "/fund-management" },
          { icon: "person", label: "Profile", active: false, href: "/dashboard" },
        ].map((item, idx) =>
          item.fab ? (
            <a
              key={`fab-${idx}`}
              href={item.href}
              className="bg-[#f28d83] text-[#6e2621] w-12 h-12 rounded-full flex items-center justify-center -mt-10 shadow-lg active:scale-95 duration-150"
            >
              <span className="material-symbols-outlined">add</span>
            </a>
          ) : (
            <a
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 ${
                item.active ? "text-[#97453e]" : "text-[#554240]"
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
              <span className="text-[10px] font-bold uppercase tracking-tighter">
                {item.label}
              </span>
            </a>
          )
        )}
      </nav>
    </div>
  );
};

export default RequestWithdrawal;
