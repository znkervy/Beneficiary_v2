"use client";

import React, { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BankFormState {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
}

interface BankOption {
  value: string;
  label: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const BANK_OPTIONS: BankOption[] = [
  { value: "horizon", label: "Horizon Federal Credit Union" },
  { value: "pinnacle", label: "Pinnacle Global Banking" },
  { value: "sunrise", label: "Sunrise Mutual Trust" },
  { value: "unity", label: "Unity Community Bank" },
];

// ─── Modal Component ──────────────────────────────────────────────────────────

interface ConnectBankModalProps {
  onClose: () => void;
  onConnect: (form: BankFormState) => void;
}

const ConnectBankModal: React.FC<ConnectBankModalProps> = ({
  onClose,
  onConnect,
}) => {
  const [form, setForm] = useState<BankFormState>({
    bankName: "",
    accountHolder: "",
    accountNumber: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    onConnect(form);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#241918]/10 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-[0px_12px_32px_rgba(151,69,62,0.06)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-8 pb-4 text-center">
          <div className="w-16 h-16 rounded-xl bg-[#fae3e1] flex items-center justify-center text-[#97453e] shadow-sm mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">
              account_balance
            </span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#241918] mb-2">
            Connect New Bank Account
          </h2>
          <p className="text-[#554240] text-sm font-medium leading-relaxed max-w-sm mx-auto">
            Link your external accounts securely to manage all your funds in
            one place.
          </p>
        </div>

        {/* Form */}
        <div className="p-10 pt-4 space-y-8">
          {/* Bank Name */}
          <div className="space-y-2">
            <label
              htmlFor="bankName"
              className="block text-[10px] font-extrabold text-[#554240] uppercase tracking-widest"
            >
              Bank Name
            </label>
            <div className="relative">
              <select
                id="bankName"
                value={form.bankName}
                onChange={handleChange}
                className="w-full h-14 pl-4 pr-10 rounded-lg border border-[#dac1be]/30 bg-[#fff0ef]/30 appearance-none focus:ring-2 focus:ring-[#97453e]/20 focus:bg-[#fff0ef] transition-all text-[#241918] font-semibold text-sm"
              >
                <option value="" disabled>
                  Select your financial institution
                </option>
                {BANK_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#877270]">
                expand_more
              </span>
            </div>
          </div>

          {/* Account Holder */}
          <div className="space-y-2">
            <label
              htmlFor="accountHolder"
              className="block text-[10px] font-extrabold text-[#554240] uppercase tracking-widest"
            >
              Account Holder Name
            </label>
            <input
              id="accountHolder"
              type="text"
              value={form.accountHolder}
              onChange={handleChange}
              placeholder="Full legal name as on account"
              className="w-full h-14 px-4 rounded-lg border border-[#dac1be]/30 bg-[#fff0ef]/30 focus:ring-2 focus:ring-[#97453e]/20 focus:bg-[#fff0ef] transition-all text-[#241918] font-semibold text-sm placeholder:text-[#877270]/40 outline-none"
            />
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <label
              htmlFor="accountNumber"
              className="block text-[10px] font-extrabold text-[#554240] uppercase tracking-widest"
            >
              Account Number
            </label>
            <input
              id="accountNumber"
              type="text"
              value={form.accountNumber}
              onChange={handleChange}
              placeholder="Enter your numeric account number"
              className="w-full h-14 px-4 rounded-lg border border-[#dac1be]/30 bg-[#fff0ef]/30 focus:ring-2 focus:ring-[#97453e]/20 focus:bg-[#fff0ef] transition-all text-[#241918] font-semibold text-sm placeholder:text-[#877270]/40 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 pt-4">
            <button
              type="button"
              onClick={handleSubmit}
              className="bg-[#F28D83] text-white w-full py-4 rounded-xl font-bold shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Connect Account
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 text-[#554240] font-bold text-sm transition-all hover:bg-[#fff0ef] rounded-full"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-6 bg-[#fff0ef]/50 flex items-center justify-center gap-2 border-t border-[#dac1be]/10">
          <span
            className="material-symbols-outlined text-sm text-[#97453e]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            verified_user
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#554240]">
            Bank-grade 256-bit AES Encryption
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Background Shell (Blurred Banking Details page) ─────────────────────────

const BackgroundShell: React.FC = () => (
  <div className="relative w-full h-screen flex overflow-hidden blur-md saturate-50 brightness-95 pointer-events-none select-none">
    {/* Sidebar */}
    <aside className="hidden md:flex flex-col w-72 h-screen p-6 space-y-4 bg-[#fae3e1] rounded-r-[3rem]">
      <div className="mb-8 px-4">
        <span className="text-xl font-bold text-[#97453e]">HOPECARD</span>
      </div>
      <nav className="space-y-1">
        {[
          { icon: "grid_view", label: "Overview" },
          { icon: "volunteer_activism", label: "My Benefits" },
          { icon: "account_balance", label: "Banking Details", active: true },
          { icon: "contact_support", label: "Support" },
        ].map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-3 px-4 py-3 font-medium tracking-wide ${
              item.active
                ? "bg-white text-[#97453e] rounded-full shadow-sm"
                : "text-[#554240]"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>
      <div className="mt-auto pt-6">
        <div className="w-full py-4 bg-[#97453e] text-white rounded-full font-bold text-center">
          Apply for Funds
        </div>
      </div>
    </aside>

    {/* Main */}
    <main className="flex-1 overflow-y-auto px-12 py-10">
      <header className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#241918] mb-2">
            Banking Details
          </h1>
          <p className="text-[#554240] max-w-md leading-relaxed">
            Securely manage your fund transfers and external bank connections.
          </p>
        </div>
      </header>
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl p-10 shadow-[0px_12px_32px_rgba(151,69,62,0.06)]">
          <div className="flex justify-between items-center mb-8">
            <span className="text-sm font-bold uppercase tracking-widest text-[#554240]">
              Available Funds
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-10">
            <span className="text-5xl font-extrabold tracking-tighter text-[#97453e]">
              $12,450.00
            </span>
            <span className="text-[#554240] font-medium">USD</span>
          </div>
          <div className="grid grid-cols-3 gap-4 p-6 bg-[#fff0ef] rounded-lg">
            {[
              { label: "Monthly Allowance", value: "$3,200" },
              { label: "Spent This Month", value: "$842" },
              { label: "Auto-Replenish", value: "ACTIVE" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#554240] mb-1">
                  {stat.label}
                </p>
                <p className="text-lg font-semibold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ConnectBankPage: React.FC = () => {
  const [open, setOpen] = useState<boolean>(true);

  const handleConnect = (form: BankFormState) => {
    console.log("Connecting bank:", form);
    setOpen(false);
  };

  return (
    <div className="bg-[#fff8f7] text-[#241918] min-h-screen font-[Plus_Jakarta_Sans]">
      <BackgroundShell />

      {open && (
        <ConnectBankModal
          onClose={() => setOpen(false)}
          onConnect={handleConnect}
        />
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-6 pt-3 bg-white/80 backdrop-blur-xl border-t border-[#dac1be]/15">
        {[
          { icon: "home", label: "Home", active: false, href: "/dashboard" },
          { icon: "payments", label: "Funds", active: false, href: "/fund-management" },
          { icon: "account_balance", label: "Bank", active: true, href: "/banking-details" },
          { icon: "menu", label: "Menu", active: false, href: "/dashboard" },
        ].map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center p-2 ${
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
            <span className="text-[10px] font-bold uppercase mt-1">
              {item.label}
            </span>
          </a>
        ))}
      </nav>
    </div>
  );
};

export default ConnectBankPage;
