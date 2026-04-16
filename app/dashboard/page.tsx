import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { DashboardClient } from "./dashboard-client";

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

  const { data: beneficiaryRows } = await supabase
    .from("beneficiaries")
    .select("total_amount_received, verification_status")
    .eq("auth_user_id", user.id);

  const totalAmountReceived = (beneficiaryRows ?? []).reduce((total, row) => {
    return total + parseAmount((row as BeneficiaryAmountRow).total_amount_received);
  }, 0);

  const formattedTotalAmountReceived = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(totalAmountReceived);

  // Get verification status from first beneficiary record
  const verificationStatus = beneficiaryRows?.[0]?.verification_status ?? "pending";

  async function logout() {
    "use server";

    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <DashboardClient 
      displayName={displayName}
      totalAmount={formattedTotalAmountReceived}
      verificationStatus={verificationStatus}
      logoutAction={logout}
    />
  );
}
