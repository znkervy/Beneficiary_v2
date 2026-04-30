# Campaigns Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded data across the `/campaigns` section with real Supabase data, backed by five new API routes and wired up across three frontend pages.

**Architecture:** Five Next.js App Router route handlers authenticate via the `@/utils/supabase/server` async client, then use a service-role client for all DB queries. Three frontend client-component pages fetch from these routes on mount and replace their hardcoded constants with live state. The `campaign_invitations` table drives the invite flow; `campaign_beneficiaries` is the enrollment table; `beneficiary_disbursements` is the payout history.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (supabase-js v2 + @supabase/ssr), Tailwind CSS

---

## File Map

| Action | Path |
|---|---|
| Modify | `app/api/campaigns/route.ts` |
| Create | `app/api/campaigns/[id]/route.ts` |
| Create | `app/api/campaigns/invitations/route.ts` |
| Create | `app/api/campaigns/invitations/[id]/accept/route.ts` |
| Create | `app/api/campaigns/invitations/[id]/decline/route.ts` |
| Modify | `app/campaigns/page.tsx` |
| Modify | `app/campaigns/[id]/page.tsx` |
| Modify | `app/campaigns/invitations/page.tsx` |

---

## Auth Pattern (used in every API route)

```typescript
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";

// 1. Verify session
const supabase = await createServerClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

// 2. Service-role client for all DB ops
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 3. Resolve beneficiary profile ID
const { data: profile } = await admin
  .from("beneficiary_profiles")
  .select("id")
  .eq("auth_user_id", user.id)
  .single();
if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
```

---

## Task 1: `GET /api/campaigns`

Returns enrolled campaigns + impact summary for the campaigns listing page.

**Files:**
- Modify: `app/api/campaigns/route.ts`

- [ ] **Step 1: Replace the file with the new implementation**

```typescript
// app/api/campaigns/route.ts
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from("beneficiary_profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { data: enrollments } = await admin
    .from("campaign_beneficiaries")
    .select("campaign_id")
    .eq("beneficiary_profile_id", profile.id);

  const campaignIds = (enrollments ?? []).map((e: { campaign_id: string }) => e.campaign_id);

  const { count: pendingInvitations } = await admin
    .from("campaign_invitations")
    .select("id", { count: "exact", head: true })
    .eq("beneficiary_profile_id", profile.id)
    .eq("status", "pending");

  if (campaignIds.length === 0) {
    return NextResponse.json({
      campaigns: [],
      summary: { total_support: 0, active_count: 0, pending_invitations: pendingInvitations ?? 0 },
    });
  }

  const [{ data: campaigns }, { data: disbursements }] = await Promise.all([
    admin
      .from("hc_campaigns")
      .select("id, title, description, category, status, target_amount, collected_amount")
      .in("id", campaignIds),
    admin
      .from("beneficiary_disbursements")
      .select("campaign_id, amount")
      .eq("beneficiary_profile_id", profile.id)
      .eq("status", "approved"),
  ]);

  const receivedByCampaign: Record<string, number> = {};
  let totalSupport = 0;
  for (const d of disbursements ?? []) {
    receivedByCampaign[d.campaign_id] = (receivedByCampaign[d.campaign_id] ?? 0) + Number(d.amount);
    totalSupport += Number(d.amount);
  }

  const activeCount = (campaigns ?? []).filter((c: { status: string }) => c.status === "active").length;

  return NextResponse.json({
    campaigns: (campaigns ?? []).map((c: {
      id: string; title: string; description: string | null;
      category: string | null; status: string;
      target_amount: number; collected_amount: number;
    }) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      status: c.status,
      target_amount: Number(c.target_amount),
      collected_amount: Number(c.collected_amount),
      total_received: receivedByCampaign[c.id] ?? 0,
    })),
    summary: {
      total_support: totalSupport,
      active_count: activeCount,
      pending_invitations: pendingInvitations ?? 0,
    },
  });
}
```

- [ ] **Step 2: Verify the route responds correctly**

Start the dev server if not running: `npm run dev`

In a browser or curl (with a valid session cookie), hit `GET /api/campaigns`. If not logged in, expect:
```json
{ "error": "Unauthorized" }
```
If logged in with no enrollments, expect:
```json
{ "campaigns": [], "summary": { "total_support": 0, "active_count": 0, "pending_invitations": 0 } }
```

- [ ] **Step 3: Commit**

```bash
git add app/api/campaigns/route.ts
git commit -m "feat: replace GET /api/campaigns with enrolled campaigns + impact summary"
```

---

## Task 2: `GET /api/campaigns/[id]`

Returns campaign details, manager info, and disbursement history for one enrolled campaign.

**Files:**
- Create: `app/api/campaigns/[id]/route.ts`

- [ ] **Step 1: Create the directory and file**

```typescript
// app/api/campaigns/[id]/route.ts
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from("beneficiary_profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { data: enrollment } = await admin
    .from("campaign_beneficiaries")
    .select("campaign_id")
    .eq("campaign_id", id)
    .eq("beneficiary_profile_id", profile.id)
    .single();
  if (!enrollment) return NextResponse.json({ error: "Not enrolled in this campaign" }, { status: 403 });

  const [
    { data: campaign, error: campError },
    { data: disbursements },
  ] = await Promise.all([
    admin
      .from("hc_campaigns")
      .select("id, title, description, category, status, target_amount, collected_amount, start_date, end_date, created_by")
      .eq("id", id)
      .single(),
    admin
      .from("beneficiary_disbursements")
      .select("id, reference_id, amount, status, disbursed_at, created_at")
      .eq("campaign_id", id)
      .eq("beneficiary_profile_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  if (campError || !campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const { data: manager } = await admin
    .from("campaign_manager_profiles")
    .select("first_name, last_name, organization_name, email, phone")
    .eq("auth_user_id", campaign.created_by)
    .single();

  const totalReceived = (disbursements ?? [])
    .filter((d: { status: string }) => d.status === "approved")
    .reduce((sum: number, d: { amount: number }) => sum + Number(d.amount), 0);

  return NextResponse.json({
    campaign: {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      category: campaign.category,
      status: campaign.status,
      target_amount: Number(campaign.target_amount),
      collected_amount: Number(campaign.collected_amount),
      start_date: campaign.start_date,
      end_date: campaign.end_date,
    },
    manager: manager
      ? {
          full_name: `${manager.first_name} ${manager.last_name}`.trim(),
          organization_name: manager.organization_name,
          email: manager.email,
          phone: manager.phone,
        }
      : null,
    disbursements: (disbursements ?? []).map((d: {
      id: string; reference_id: string; amount: number;
      status: string; disbursed_at: string | null; created_at: string;
    }) => ({
      id: d.id,
      reference_id: d.reference_id,
      amount: Number(d.amount),
      status: d.status,
      disbursed_at: d.disbursed_at,
      created_at: d.created_at,
    })),
    total_received: totalReceived,
  });
}
```

- [ ] **Step 2: Verify**

Hit `GET /api/campaigns/<valid-campaign-id>` while logged in as a non-enrolled beneficiary. Expect `403`. Hit it while enrolled. Expect campaign + manager + disbursements JSON.

- [ ] **Step 3: Commit**

```bash
git add "app/api/campaigns/[id]/route.ts"
git commit -m "feat: add GET /api/campaigns/[id] with manager and disbursement history"
```

---

## Task 3: `GET /api/campaigns/invitations`

Returns pending invitations for the authenticated beneficiary, joined with campaign and organization data.

**Files:**
- Create: `app/api/campaigns/invitations/route.ts`

- [ ] **Step 1: Create the file**

```typescript
// app/api/campaigns/invitations/route.ts
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from("beneficiary_profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { data: invitations, error } = await admin
    .from("campaign_invitations")
    .select("id, campaign_id, invited_at")
    .eq("beneficiary_profile_id", profile.id)
    .eq("status", "pending")
    .order("invited_at", { ascending: false });

  if (error) {
    console.error("[invitations] fetch error:", error.message);
    return NextResponse.json({ error: "Failed to load invitations" }, { status: 500 });
  }

  if (!invitations || invitations.length === 0) {
    return NextResponse.json({ invitations: [] });
  }

  const campaignIds = invitations.map((i: { campaign_id: string }) => i.campaign_id);

  const { data: campaigns } = await admin
    .from("hc_campaigns")
    .select("id, title, category, description, target_amount, created_by")
    .in("id", campaignIds);

  const createdBys = [...new Set((campaigns ?? []).map((c: { created_by: string }) => c.created_by))];

  const { data: managers } = await admin
    .from("campaign_manager_profiles")
    .select("auth_user_id, organization_name")
    .in("auth_user_id", createdBys);

  const campaignMap = new Map((campaigns ?? []).map((c: { id: string; title: string; category: string | null; description: string | null; target_amount: number; created_by: string }) => [c.id, c]));
  const managerMap = new Map((managers ?? []).map((m: { auth_user_id: string; organization_name: string | null }) => [m.auth_user_id, m]));

  return NextResponse.json({
    invitations: invitations.map((inv: { id: string; campaign_id: string; invited_at: string }) => {
      const campaign = campaignMap.get(inv.campaign_id);
      const manager = campaign ? managerMap.get(campaign.created_by) : null;
      return {
        id: inv.id,
        campaign_id: inv.campaign_id,
        title: campaign?.title ?? "Unknown Campaign",
        category: campaign?.category ?? null,
        description: campaign?.description ?? null,
        organization_name: manager?.organization_name ?? null,
        target_amount: campaign ? Number(campaign.target_amount) : 0,
        invited_at: inv.invited_at,
      };
    }),
  });
}
```

- [ ] **Step 2: Verify**

Hit `GET /api/campaigns/invitations` while authenticated. Expect `{ invitations: [] }` if no pending invitations exist. If a row exists in `campaign_invitations` with `status='pending'` for this beneficiary, it should appear in the response.

- [ ] **Step 3: Commit**

```bash
git add app/api/campaigns/invitations/route.ts
git commit -m "feat: add GET /api/campaigns/invitations"
```

---

## Task 4: `POST /api/campaigns/invitations/[id]/accept`

Accepts a pending invitation: inserts into `campaign_beneficiaries` and marks the invitation accepted.

**Files:**
- Create: `app/api/campaigns/invitations/[id]/accept/route.ts`

- [ ] **Step 1: Create the file**

```typescript
// app/api/campaigns/invitations/[id]/accept/route.ts
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from("beneficiary_profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { data: invitation } = await admin
    .from("campaign_invitations")
    .select("id, campaign_id, status")
    .eq("id", id)
    .eq("beneficiary_profile_id", profile.id)
    .single();

  if (!invitation) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  if (invitation.status !== "pending") {
    return NextResponse.json({ error: "Invitation already responded to" }, { status: 409 });
  }

  const { error: enrollError } = await admin
    .from("campaign_beneficiaries")
    .insert({ campaign_id: invitation.campaign_id, beneficiary_profile_id: profile.id });

  if (enrollError && enrollError.code !== "23505") {
    console.error("[accept] enroll error:", enrollError.message);
    return NextResponse.json({ error: "Failed to enroll in campaign" }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from("campaign_invitations")
    .update({ status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) {
    console.error("[accept] update error:", updateError.message);
    return NextResponse.json({ error: "Failed to update invitation" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Verify**

```bash
curl -X POST http://localhost:3000/api/campaigns/invitations/<invitation-id>/accept \
  -H "Cookie: <paste your session cookie here>"
```
Expected on first call: `{ "success": true }`. Expected on second call (already accepted): `{ "error": "Invitation already responded to" }`.

- [ ] **Step 3: Commit**

```bash
git add "app/api/campaigns/invitations/[id]/accept/route.ts"
git commit -m "feat: add POST /api/campaigns/invitations/[id]/accept"
```

---

## Task 5: `POST /api/campaigns/invitations/[id]/decline`

Declines a pending invitation without creating an enrollment.

**Files:**
- Create: `app/api/campaigns/invitations/[id]/decline/route.ts`

- [ ] **Step 1: Create the file**

```typescript
// app/api/campaigns/invitations/[id]/decline/route.ts
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from("beneficiary_profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { data: invitation } = await admin
    .from("campaign_invitations")
    .select("id, status")
    .eq("id", id)
    .eq("beneficiary_profile_id", profile.id)
    .single();

  if (!invitation) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  if (invitation.status !== "pending") {
    return NextResponse.json({ error: "Invitation already responded to" }, { status: 409 });
  }

  const { error } = await admin
    .from("campaign_invitations")
    .update({ status: "declined", responded_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[decline] update error:", error.message);
    return NextResponse.json({ error: "Failed to decline invitation" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Verify**

```bash
curl -X POST http://localhost:3000/api/campaigns/invitations/<invitation-id>/decline \
  -H "Cookie: <paste your session cookie here>"
```
Expected: `{ "success": true }`. Check Supabase table editor — the row's `status` should now be `declined` and `responded_at` should be set.

- [ ] **Step 3: Commit**

```bash
git add "app/api/campaigns/invitations/[id]/decline/route.ts"
git commit -m "feat: add POST /api/campaigns/invitations/[id]/decline"
```

---

## Task 6: Wire up `/campaigns/page.tsx`

Replace all hardcoded campaign constants with live data from `GET /api/campaigns`.

**Files:**
- Modify: `app/campaigns/page.tsx`

- [ ] **Step 1: Replace the Data section and add types + helpers at the top of the file**

Remove the `FEATURED_CAMPAIGNS` and `SECONDARY_CAMPAIGNS` constant arrays (lines 26–68). Replace the `// ─── Data ─────` section with:

```typescript
// ─── Types ────────────────────────────────────────────────────────────────────

interface CampaignRow {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  target_amount: number;
  collected_amount: number;
  total_received: number;
}

interface CampaignSummary {
  total_support: number;
  active_count: number;
  pending_invitations: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_ICON: Record<string, string> = {
  Education: "school",
  Health: "medical_services",
  Environment: "eco",
  Community: "volunteer_activism",
  Food: "restaurant",
  Energy: "electric_bolt",
  Housing: "home",
  Youth: "child_care",
  Disaster: "emergency",
};

function categoryToIcon(category: string | null): string {
  return (category && CATEGORY_ICON[category]) || "campaign";
}

function formatAmount(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
```

- [ ] **Step 2: Update the `LargeCampaignCard` and `SmallCampaignCard` prop types**

Replace the existing `Campaign` interface (lines 14–22) and update `LargeCampaignCardProps` / `SmallCampaignCardProps`. The card components receive a `CampaignRow` and derive the icon from `categoryToIcon`. Update the card render:

In `LargeCampaignCard`, replace `campaign.icon` with `categoryToIcon(campaign.category)` and `campaign.totalReceived` with `formatAmount(campaign.total_received)`. Replace the `status` badge comparison from `"Active"/"Completed"` to any truthy check on `campaign.status === "active"`.

In `SmallCampaignCard`, replace `campaign.icon` with `categoryToIcon(campaign.category)`, `campaign.totalReceived` with `formatAmount(campaign.total_received)`, and `campaign.status === "Completed"` with `campaign.status !== "active"`.

Full updated `LargeCampaignCard`:
```tsx
function LargeCampaignCard({ campaign }: { campaign: CampaignRow }) {
  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-[0px_12px_32px_rgba(151,69,62,0.06)] border border-[#dac1be]/10">
      <div className="flex justify-between items-start mb-6">
        <div className="w-14 h-14 bg-[#fae3e1] rounded-[1.25rem] flex items-center justify-center text-[#97453e] shadow-sm">
          <span className="material-symbols-outlined text-3xl">{categoryToIcon(campaign.category)}</span>
        </div>
        <span className="px-4 py-1.5 rounded-full bg-[#f4dddc] text-[#79342e] text-[10px] font-extrabold uppercase tracking-widest">
          {campaign.status}
        </span>
      </div>
      <h4 className="text-xl font-bold text-[#241918] mb-2">{campaign.title}</h4>
      <p className="text-sm text-[#554240] mb-8 line-clamp-2 font-medium">{campaign.description ?? ""}</p>
      <div className="space-y-4">
        <div className="flex justify-between text-sm font-medium pt-4 border-t border-[#dac1be]/10">
          <span className="text-[#554240]/70">Total Received</span>
          <span className="font-extrabold text-[#241918]">{formatAmount(campaign.total_received)}</span>
        </div>
        <a href={`/campaigns/${campaign.id}`} className="w-full py-3 bg-[#f28d83] text-[#6e2621] rounded-[1rem] font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
          View Details
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </a>
      </div>
    </div>
  );
}
```

Full updated `SmallCampaignCard`:
```tsx
function SmallCampaignCard({ campaign }: { campaign: CampaignRow }) {
  const isInactive = campaign.status !== "active";
  return (
    <div className={["bg-white rounded-[2rem] p-8 border border-[#dac1be]/10 shadow-sm", isInactive ? "opacity-90 grayscale-[0.2]" : ""].join(" ")}>
      <div className="flex justify-between items-start mb-6">
        <div className={["w-12 h-12 bg-[#fae3e1] rounded-lg flex items-center justify-center text-[#97453e]", isInactive ? "opacity-60" : ""].join(" ")}>
          <span className="material-symbols-outlined">{categoryToIcon(campaign.category)}</span>
        </div>
        <span className={["px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest", isInactive ? "bg-[#ffe9e7] text-[#554240]" : "bg-[#f4dddc] text-[#79342e]"].join(" ")}>
          {campaign.status}
        </span>
      </div>
      <h4 className="text-xl font-bold text-[#241918] mb-2">{campaign.title}</h4>
      <div className="flex justify-between items-center mt-8 pb-4 border-b border-[#dac1be]/10">
        <span className="text-xs font-bold text-[#554240]/70">Total Received</span>
        <span className="font-extrabold text-[#241918]">{formatAmount(campaign.total_received)}</span>
      </div>
      <a href={`/campaigns/${campaign.id}`} className="mt-6 text-[#97453e] font-extrabold text-xs inline-flex items-center gap-2 hover:underline">
        View Details <span className="material-symbols-outlined text-xs">open_in_new</span>
      </a>
    </div>
  );
}
```

- [ ] **Step 3: Update `CampaignsPage` state and `useEffect`**

Replace the existing state declarations and `useEffect` in `CampaignsPage` with:

```tsx
const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
const [summary, setSummary] = useState<CampaignSummary>({ total_support: 0, active_count: 0, pending_invitations: 0 });
const [loading, setLoading] = useState(true);
const [collapsed, setCollapsed] = useState<boolean>(false);
const [profileOpen, setProfileOpen] = useState<boolean>(false);
const [activeSince, setActiveSince] = useState<number | null>(null);

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

      const res = await fetch("/api/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, []);
```

- [ ] **Step 4: Update the Impact Overview and the Bento Grid in the JSX**

Replace the hardcoded `$12,450.00` and `82%` with real values. Replace the "Across 4 active programs" text. The progress percentage is `Math.round((sumCollected / sumTarget) * 100)` across active enrolled campaigns.

Add this derived value before the return:
```tsx
const activeCampaigns = campaigns.filter(c => c.status === "active");
const sumCollected = activeCampaigns.reduce((s, c) => s + c.collected_amount, 0);
const sumTarget = activeCampaigns.reduce((s, c) => s + c.target_amount, 0);
const progressPct = sumTarget > 0 ? Math.round((sumCollected / sumTarget) * 100) : 0;
```

Update the `BenefitBloom` component to accept a `pct` prop:
```tsx
function BenefitBloom({ pct }: { pct: number }) {
  return (
    <div
      className="w-20 h-20 flex items-center justify-center relative shadow-sm"
      style={{
        background: `conic-gradient(from 0deg, #97453e 0%, #f28d83 ${pct}%, transparent ${pct}%)`,
        borderRadius: "50%",
      }}
    >
      <div className="absolute inset-1.5 bg-[#fae3e1] rounded-full flex items-center justify-center">
        <span className="text-sm font-bold text-[#97453e]">{pct}%</span>
      </div>
    </div>
  );
}
```

Update the Impact Overview section in the JSX:
```tsx
<div className="lg:col-span-4 bg-[#fae3e1] rounded-[2rem] p-8 flex flex-col justify-between">
  <div>
    <span className="text-[10px] font-extrabold text-[#97453e] uppercase tracking-widest">
      Impact Overview
    </span>
    <h3 className="text-2xl font-bold text-[#241918] mt-4 mb-2">Total Support</h3>
    <p className="text-4xl font-black text-[#97453e]">
      {loading ? "…" : formatAmount(summary.total_support)}
    </p>
  </div>
  <div className="mt-12 flex items-center gap-6">
    <BenefitBloom pct={progressPct} />
    <div className="flex-1">
      <p className="text-sm font-bold text-[#241918]">Active Campaign Progress</p>
      <p className="text-xs text-[#554240] mt-1 font-medium">
        Across {summary.active_count} active program{summary.active_count !== 1 ? "s" : ""}
      </p>
    </div>
  </div>
</div>
```

- [ ] **Step 5: Update the campaign grid and remove "Join a New Cause"**

Replace the Bento Grid section (the large cards + bottom row) with:

```tsx
{loading ? (
  <div className="lg:col-span-12 flex items-center justify-center py-24">
    <p className="text-[#554240] font-medium">Loading campaigns…</p>
  </div>
) : campaigns.length === 0 ? (
  <div className="lg:col-span-12 flex flex-col items-center justify-center py-24 gap-4">
    <span className="material-symbols-outlined text-[4rem] text-[#dac1be]">campaign</span>
    <p className="text-[#554240] font-bold text-lg">No campaigns yet</p>
    <p className="text-[#554240]/70 text-sm">Accept an invitation to start receiving support.</p>
  </div>
) : (
  <>
    {/* Large Cards */}
    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      {campaigns.slice(0, 2).map((c) => (
        <LargeCampaignCard key={c.id} campaign={c} />
      ))}
    </div>
    {/* Bottom Row — remaining campaigns */}
    {campaigns.length > 2 && (
      <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {campaigns.slice(2).map((c) => (
          <SmallCampaignCard key={c.id} campaign={c} />
        ))}
      </div>
    )}
  </>
)}
```

Update the "View Invitations" badge to use `summary.pending_invitations`:
```tsx
<a href="/campaigns/invitations" className="bg-[#D1736A] text-white px-8 py-4 rounded-[1rem] font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap">
  <span>View Invitations</span>
  {summary.pending_invitations > 0 && (
    <div className="flex items-center justify-center bg-white w-5 h-5 rounded-full text-[10px] text-[#D1736A] font-bold">
      {summary.pending_invitations}
    </div>
  )}
</a>
```

- [ ] **Step 6: Verify in browser**

Navigate to `/campaigns` while logged in. Confirm:
- With no enrollments: empty state renders with "No campaigns yet" message
- "View Invitations" badge disappears when `pending_invitations === 0`
- Loading state shows briefly before data loads
- The "Join a New Cause" card is gone

- [ ] **Step 7: Commit**

```bash
git add app/campaigns/page.tsx
git commit -m "feat: wire up /campaigns page with real API data"
```

---

## Task 7: Wire up `/campaigns/[id]/page.tsx`

Replace all hardcoded campaign data with a fetch to `GET /api/campaigns/[id]`.

**Files:**
- Modify: `app/campaigns/[id]/page.tsx`

- [ ] **Step 1: Add types and imports to the top of the file**

Add `useParams` to the existing imports from `"next/navigation"` and add these types after the existing type definitions:

```typescript
import { useParams } from "next/navigation";

interface CampaignDetail {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  target_amount: number;
  collected_amount: number;
  start_date: string;
  end_date: string | null;
}

interface ManagerDetail {
  full_name: string;
  organization_name: string | null;
  email: string | null;
  phone: string | null;
}

interface DisbursementRow {
  id: string;
  reference_id: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  disbursed_at: string | null;
  created_at: string;
}
```

- [ ] **Step 2: Replace the hardcoded `DISBURSEMENTS` constant and `STATUS_STYLES`**

Remove the `DISBURSEMENTS` array (lines 26–32). Keep `STATUS_STYLES` as-is (it maps the same status values our API returns).

- [ ] **Step 3: Update `CampaignDetailsPage` state, fetch, and render**

Replace the existing state declarations and `useEffect` in `CampaignDetailsPage`:

```tsx
const params = useParams();
const campaignId = params.id as string;

const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
const [manager, setManager] = useState<ManagerDetail | null>(null);
const [disbursements, setDisbursements] = useState<DisbursementRow[]>([]);
const [totalReceived, setTotalReceived] = useState(0);
const [loading, setLoading] = useState(true);
const [collapsed, setCollapsed] = useState<boolean>(false);
const [profileOpen, setProfileOpen] = useState<boolean>(false);
const [activeSince, setActiveSince] = useState<number | null>(null);

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

      const res = await fetch(`/api/campaigns/${campaignId}`);
      if (res.status === 403 || res.status === 404) {
        window.location.href = "/campaigns";
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setCampaign(data.campaign);
        setManager(data.manager);
        setDisbursements(data.disbursements);
        setTotalReceived(data.total_received);
      }
    } catch (error) {
      console.error("Error fetching campaign details:", error);
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, [campaignId]);
```

- [ ] **Step 4: Replace the hardcoded campaign detail JSX with live data**

Replace the hardcoded header section:
```tsx
{/* Header */}
<div className="max-w-7xl mx-auto mb-12 w-full">
  <div className="flex items-center gap-3 mb-4">
    <span className="px-4 py-1.5 bg-[#f4dddc] text-[#79342e] text-[10px] font-extrabold uppercase tracking-widest rounded-full">
      {campaign?.status ?? "…"}
    </span>
  </div>
  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#241918] leading-tight mb-4">
    {loading ? "Loading…" : campaign?.title ?? "Campaign"}
  </h1>
  <p className="text-[#554240] max-w-2xl text-lg leading-relaxed font-medium">
    {campaign?.description ?? ""}
  </p>
</div>
```

Replace the Funding Status card:
```tsx
<div className="bg-white p-8 rounded-[2rem] shadow-[0px_12px_32px_rgba(151,69,62,0.06)] border border-[#dac1be]/10 flex flex-col justify-center min-h-[200px]">
  <p className="text-[10px] uppercase font-extrabold tracking-[0.2em] text-[#97453e] mb-4">
    Total Received
  </p>
  <div className="flex items-baseline gap-2">
    <span className="text-5xl font-extrabold text-[#241918]">
      ₱{totalReceived.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
    </span>
    <span className="text-[#554240] font-bold text-lg">
      / ₱{(campaign?.target_amount ?? 0).toLocaleString("en-PH")} goal
    </span>
  </div>
  {campaign && campaign.target_amount > 0 && (
    <>
      <div className="mt-8 w-full bg-[#fae3e1] rounded-full h-2 overflow-hidden">
        <div
          className="bg-[#f28d83] h-full"
          style={{ width: `${Math.min(100, Math.round((campaign.collected_amount / campaign.target_amount) * 100))}%` }}
        />
      </div>
      <p className="mt-4 text-[10px] font-extrabold text-[#554240] uppercase tracking-widest">
        {Math.min(100, Math.round((campaign.collected_amount / campaign.target_amount) * 100))}% of goal reached
      </p>
    </>
  )}
</div>
```

Replace the Campaign Manager card:
```tsx
<div className="bg-white rounded-[2rem] p-8 shadow-[0px_12px_32px_rgba(151,69,62,0.06)] border border-[#dac1be]/10 flex flex-col justify-between">
  <div>
    <h3 className="text-lg font-extrabold text-[#241918] mb-6 uppercase tracking-wider">
      Campaign Manager
    </h3>
    {manager ? (
      <>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-[#fae3e1] border-2 border-[#fff8f7] shadow-sm flex items-center justify-center">
            <User size={28} style={{ color: S.primary }} />
          </div>
          <div>
            <p className="font-extrabold text-[#241918]">{manager.full_name}</p>
            <p className="text-sm font-bold text-[#f28d83] uppercase tracking-wide">
              {manager.organization_name ?? "Organization"}
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {manager.email && (
            <div className="flex items-center gap-3 text-sm text-[#554240] font-medium">
              <span className="material-symbols-outlined text-[#f28d83] text-xl">mail</span>
              {manager.email}
            </div>
          )}
          {manager.phone && (
            <div className="flex items-center gap-3 text-sm text-[#554240] font-medium">
              <span className="material-symbols-outlined text-[#f28d83] text-xl">call</span>
              {manager.phone}
            </div>
          )}
        </div>
      </>
    ) : (
      <p className="text-sm text-[#554240]/70">Manager information unavailable.</p>
    )}
  </div>
  <button className="mt-8 py-3 w-full bg-[#f28d83] text-[#6e2621] rounded-full text-xs font-extrabold uppercase tracking-widest hover:opacity-90 transition-all shadow-sm">
    Contact Organization
  </button>
</div>
```

Replace the disbursement table `tbody` to use the `disbursements` state:
```tsx
<tbody className="divide-y divide-[#dac1be]/10">
  {disbursements.length === 0 ? (
    <tr>
      <td colSpan={4} className="px-8 py-12 text-center text-sm text-[#554240]/60 font-medium">
        No disbursements yet.
      </td>
    </tr>
  ) : (
    disbursements.map((d) => (
      <tr key={d.id} className="hover:bg-[#fff0ef]/30 transition-colors">
        <td className="px-8 py-6 text-sm font-bold">
          {d.disbursed_at
            ? new Date(d.disbursed_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
            : new Date(d.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
        </td>
        <td className="px-8 py-6 text-sm font-mono text-[#554240]">#{d.reference_id}</td>
        <td className="px-8 py-6">
          <StatusBadge status={d.status as DisbursementStatus} />
        </td>
        <td className="px-8 py-6 text-right font-extrabold text-[#241918]">
          ₱{d.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
        </td>
      </tr>
    ))
  )}
</tbody>
```

- [ ] **Step 5: Verify in browser**

Navigate to `/campaigns/<id>` for a campaign the beneficiary is enrolled in. Confirm the title, funding bar, manager card, and disbursements table all render with live data (or empty states). Navigate to `/campaigns/<id>` for a campaign they are NOT enrolled in — confirm redirect to `/campaigns`.

- [ ] **Step 6: Commit**

```bash
git add "app/campaigns/[id]/page.tsx"
git commit -m "feat: wire up /campaigns/[id] page with real campaign data"
```

---

## Task 8: Wire up `/campaigns/invitations/page.tsx`

Replace hardcoded `INVITATIONS` with real data and connect accept/decline to the API.

**Files:**
- Modify: `app/campaigns/invitations/page.tsx`

- [ ] **Step 1: Replace the `Invitation` interface and add helpers**

Replace the existing `Invitation` interface and `INVITATIONS` constant with:

```typescript
interface Invitation {
  id: string;
  campaign_id: string;
  title: string;
  category: string | null;
  description: string | null;
  organization_name: string | null;
  target_amount: number;
  invited_at: string;
}

const CATEGORY_ICON: Record<string, string> = {
  Education: "school",
  Health: "medical_services",
  Environment: "eco",
  Community: "volunteer_activism",
  Food: "restaurant",
  Energy: "electric_bolt",
  Housing: "home",
  Youth: "child_care",
  Disaster: "emergency",
};

function categoryToIcon(category: string | null): string {
  return (category && CATEGORY_ICON[category]) || "campaign";
}
```

- [ ] **Step 2: Update `FeaturedCard` and `StandardCard` to use the new `Invitation` shape**

The cards currently use `invitation.icon`, `invitation.org`, `invitation.amountLabel`, `invitation.amount`, and `invitation.featuredAmount`. Update them to use the new fields.

Full updated `FeaturedCard`:
```tsx
function FeaturedCard({ invitation, onAccept, onDecline }: InvitationCardProps) {
  return (
    <div className="lg:col-span-8 bg-white rounded-[2rem] p-8 shadow-[0px_12px_32px_rgba(151,69,62,0.06)] border border-[#dac1be]/10 flex flex-col md:flex-row gap-8 relative overflow-hidden group">
      <div className="flex-shrink-0 w-24 h-24 rounded-[1.5rem] bg-[#fae3e1] flex items-center justify-center text-[#97453e] shadow-sm">
        <span className="material-symbols-outlined text-[3rem]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {categoryToIcon(invitation.category)}
        </span>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <CategoryBadge label={invitation.category ?? "Campaign"} />
          <span className="text-[#97453e] font-bold text-lg">
            ₱{invitation.target_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })} Goal
          </span>
        </div>
        <h3 className="text-2xl font-extrabold text-[#241918] mb-1">{invitation.title}</h3>
        <p className="text-[#f28d83] font-bold text-xs mb-4 uppercase tracking-wide">
          {invitation.organization_name ?? ""}
        </p>
        <p className="text-[#554240] leading-relaxed mb-8 font-medium">{invitation.description ?? ""}</p>
        <div className="mt-auto flex items-center gap-4">
          <button
            onClick={() => onAccept(invitation.id)}
            className="bg-[#f28d83] text-[#6e2621] px-8 py-3 rounded-[1rem] font-bold text-sm hover:opacity-90 transition-all active:scale-95"
          >
            Accept Invitation
          </button>
          <button
            onClick={() => onDecline(invitation.id)}
            className="px-6 py-3 text-[#97453e] font-bold text-sm hover:bg-[#97453e]/5 rounded-[1rem] transition-all"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
```

Full updated `StandardCard`:
```tsx
function StandardCard({ invitation, onAccept, onDecline }: InvitationCardProps) {
  return (
    <div className="lg:col-span-4 bg-white rounded-[2rem] p-8 shadow-[0px_12px_32px_rgba(151,69,62,0.06)] border border-[#dac1be]/10 flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div className="w-14 h-14 bg-[#fae3e1] rounded-[1.25rem] flex items-center justify-center text-[#97453e] shadow-sm">
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            {categoryToIcon(invitation.category)}
          </span>
        </div>
        <CategoryBadge label={invitation.category ?? "Campaign"} />
      </div>
      <h3 className="text-xl font-bold text-[#241918] mb-1">{invitation.title}</h3>
      <p className="text-[#f28d83] font-bold text-xs mb-4 uppercase tracking-wide">
        {invitation.organization_name ?? ""}
      </p>
      {invitation.description && (
        <p className="text-[#554240] text-sm font-medium leading-relaxed mb-6">{invitation.description}</p>
      )}
      <div className="mt-auto space-y-4">
        <div className="flex justify-between text-sm font-medium pt-4 border-t border-[#dac1be]/10">
          <span className="text-[#554240]/70">Campaign Goal</span>
          <span className="font-extrabold text-[#241918]">
            ₱{invitation.target_amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <button
          onClick={() => onAccept(invitation.id)}
          className="w-full py-3 bg-[#f28d83] text-[#6e2621] rounded-[1rem] font-bold text-sm hover:opacity-90 transition-all"
        >
          Accept Invitation
        </button>
        <button
          onClick={() => onDecline(invitation.id)}
          className="w-full py-2 text-[#97453e] font-bold text-xs hover:opacity-80 transition-all"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update `CampaignInvitationsPage` state, fetch, and handlers**

Replace the existing state, `handleAccept`, `handleDecline`, and `useEffect` in `CampaignInvitationsPage`:

```tsx
const router = useRouter();
const [invitations, setInvitations] = useState<Invitation[]>([]);
const [loading, setLoading] = useState(true);
const [collapsed, setCollapsed] = useState<boolean>(false);
const [profileOpen, setProfileOpen] = useState<boolean>(false);
const [activeSince, setActiveSince] = useState<number | null>(null);

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

      const res = await fetch("/api/campaigns/invitations");
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations);
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, []);

const handleAccept = async (invitationId: string) => {
  const res = await fetch(`/api/campaigns/invitations/${invitationId}/accept`, { method: "POST" });
  if (res.ok) {
    router.push("/campaigns/invitation-accepted");
  }
};

const handleDecline = async (invitationId: string) => {
  const res = await fetch(`/api/campaigns/invitations/${invitationId}/decline`, { method: "POST" });
  if (res.ok) {
    setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
  }
};
```

- [ ] **Step 4: Update the grid JSX for loading and empty states**

Replace the Grid section:
```tsx
{/* Grid */}
{loading ? (
  <div className="flex items-center justify-center py-24">
    <p className="text-[#554240] font-medium">Loading invitations…</p>
  </div>
) : invitations.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-24 gap-4">
    <span className="material-symbols-outlined text-[4rem] text-[#dac1be]">mail</span>
    <p className="text-[#554240] font-bold text-lg">No pending invitations</p>
    <p className="text-[#554240]/70 text-sm">Check back later — campaign managers will notify you when you've been invited.</p>
  </div>
) : (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
    {invitations[0] && (
      <FeaturedCard invitation={invitations[0]} onAccept={handleAccept} onDecline={handleDecline} />
    )}
    {invitations.slice(1).map((inv) => (
      <StandardCard key={inv.id} invitation={inv} onAccept={handleAccept} onDecline={handleDecline} />
    ))}
  </div>
)}
```

- [ ] **Step 5: Remove the unused `const [featured, ...rest] = invitations;` line** (it was below the old handler functions — delete it)

- [ ] **Step 6: Verify in browser**

Navigate to `/campaigns/invitations`. Confirm:
- Loading state appears briefly
- Empty state renders when no pending invitations exist
- When invitations are present, they render with real titles, categories, and organization names
- Clicking "Decline" removes the card and marks the invitation declined in Supabase
- Clicking "Accept" calls the accept route and redirects to `/campaigns/invitation-accepted`
- After accepting, navigate to `/campaigns` — the accepted campaign should now appear in the list

- [ ] **Step 7: Commit**

```bash
git add app/campaigns/invitations/page.tsx
git commit -m "feat: wire up /campaigns/invitations page with real invite data and accept/decline"
```

---

## Self-Review Checklist

- [x] `GET /api/campaigns` returns enrolled campaigns + impact summary ✓
- [x] `GET /api/campaigns/[id]` verifies enrollment, returns campaign + manager + disbursements ✓
- [x] `GET /api/campaigns/invitations` returns pending invitations with campaign + org data ✓
- [x] `POST accept` inserts into `campaign_beneficiaries`, marks `campaign_invitations` accepted ✓
- [x] `POST decline` marks `campaign_invitations` declined, no enrollment created ✓
- [x] `/campaigns` page: empty state, real badge count, real totals, "Join a New Cause" removed ✓
- [x] `/campaigns/[id]` page: uses `useParams`, redirects on 403/404, real disbursements ✓
- [x] `/campaigns/invitations` page: loading + empty states, accept/decline wired to API ✓
- [x] Currency: all amounts use `₱` with `en-PH` locale ✓
- [x] All routes use `export const dynamic = "force-dynamic"` ✓
- [x] `params` uses `Promise<{ id: string }>` pattern (Next.js 15+) ✓
