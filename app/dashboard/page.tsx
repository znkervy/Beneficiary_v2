import { redirect } from "next/navigation";
import { Bell, Settings, TrendingUp, Clock } from "lucide-react";

import { createClient } from "@/utils/supabase/server";
import { UserMenu } from "@/app/dashboard/user-menu";

type BeneficiaryAmountRow = {
  total_amount_received: number | string | null;
};

function parseAmount(value: BeneficiaryAmountRow["total_amount_received"]) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsedValue = Number(value.replace(/,/g, ""));

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return 0;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName =
    user.user_metadata.full_name ??
    user.user_metadata.name ??
    user.email ??
    "Beneficiary";

  const firstName = displayName.split(" ")[0];

  const { data: beneficiaryRows } = await supabase
    .from("beneficiaries")
    .select("total_amount_received")
    .eq("auth_user_id", user.id);

  const totalAmountReceived = (beneficiaryRows ?? []).reduce((total, row) => {
    return total + parseAmount((row as BeneficiaryAmountRow).total_amount_received);
  }, 0);

  const formattedTotalAmountReceived = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(totalAmountReceived);

  async function logout() {
    "use server";

    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="h-screen flex flex-col bg-[#FAF8F3] overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="bg-[#A64D4D] px-6 py-3 text-white shadow-md">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Navigation */}
          <div className="flex items-center space-x-12">
            <div className="flex items-center space-x-3">
              <img
                src="/images/logo_h.png"
                alt="HOPECARD Logo"
                className="h-10 w-10 object-contain"
              />
              <span className="text-xl font-bold tracking-tighter leading-none">HOPECARD</span>
            </div>
            
            <nav className="flex space-x-6">
              <a href="#" className="border-b border-white text-sm font-medium text-white hover:opacity-80 transition">
                Dashboard
              </a>
            </nav>
          </div>

          {/* Right: Icons and User Menu */}
          <div className="flex items-center space-x-6">
            <button className="relative transition hover:opacity-80">
              <Bell className="h-6 w-6" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-xs font-bold text-[#A64D4D]">
                3
              </span>
            </button>
            
            <button className="transition hover:opacity-80">
              <Settings className="h-6 w-6" />
            </button>

            {/* Vertical Divider */}
            <div className="h-12 w-px bg-white opacity-30"></div>

            <UserMenu displayName={displayName} logoutAction={logout} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col items-center px-6 py-12">
        {/* Welcome Message */}
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-5xl font-extrabold text-black font-[family-name:var(--font-plus-jakarta-sans)] tracking-tight">
            Welcome back, <span className="italic font-extrabold text-[#6B2C2C]">{firstName}</span>
          </h1>
          <p className="text-base text-gray-600">
            We are continuing to process assistance for your community.
          </p>
          <p className="text-base text-gray-600">Here is your current relief summary.</p>
        </div>

        {/* Relief Summary Card */}
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-xl">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FF8A80]">
              <svg
                className="h-8 w-8 text-[#6B2C2C]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          {/* Total Amount */}
          <div className="mb-6 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 font-[family-name:var(--font-manrope)]">
              Total Amount Received
            </p>
            <div className="flex items-center justify-center gap-1 font-[family-name:var(--font-plus-jakarta-sans)]">
              <span className="text-4xl font-extrabold text-[#6B2C2C] opacity-40">₱</span>
              <p className="text-5xl font-extrabold text-[#6B2C2C]">
                {formattedTotalAmountReceived.replace('₱', '').trim()}
              </p>
            </div>
          </div>

          {/* Latest Grant & Next Disbursal */}
          <div className="mb-6 flex justify-center gap-8 border-y border-gray-200 py-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <div className="text-left">
                <p className="text-xs font-medium uppercase text-gray-500 font-[family-name:var(--font-manrope)]">Latest Grant</p>
                <p className="text-sm font-extrabold text-gray-900 font-[family-name:var(--font-plus-jakarta-sans)]">₱15,000</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <div className="text-left">
                <p className="text-xs font-medium uppercase text-gray-500 font-[family-name:var(--font-manrope)]">Next Disbursal</p>
                <p className="text-sm font-extrabold text-gray-900 font-[family-name:var(--font-plus-jakarta-sans)]">₱10,000</p>
              </div>
            </div>
          </div>

          {/* View Allocation Details Button */}
          <button className="mb-4 w-full rounded-full bg-[#6B2C2C] py-3 text-sm font-semibold text-white transition hover:bg-[#5a2424]">
            View Allocation Details
          </button>

          {/* Download Statement Link */}
          <div className="text-center">
            <button className="text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700">
              Download Statement
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
