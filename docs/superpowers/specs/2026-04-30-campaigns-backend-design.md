# Campaigns Backend Design
**Date:** 2026-04-30
**Status:** Approved

---

## Overview

Replace all hardcoded data across the `/campaigns` section of the HOPECARD Beneficiary Portal with real Supabase-backed data. Covers campaign listing, campaign details, invitation listing, and accept/decline flows.

---

## Context

The HOPECARD system has three portals: Campaign Manager, Beneficiary (this repo), and an Admin portal. The CM portal creates campaigns in `hc_campaigns` and now writes to `campaign_invitations` when inviting beneficiaries (updated as part of this work). The beneficiary portal is responsible for the accept/decline flow and all campaign-facing reads.

---

## Database — Migrations Applied

Three migrations were applied to Supabase (project `hycsbfugiboutvgbvueg`):

### 1. `campaign_invitations` (new)
Stores invitations sent by the CM portal to specific beneficiaries.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | auto |
| `campaign_id` | UUID FK → `hc_campaigns.id` | ON DELETE CASCADE |
| `beneficiary_profile_id` | UUID FK → `beneficiary_profiles.id` | ON DELETE CASCADE |
| `status` | TEXT | `pending` \| `accepted` \| `declined`, default `pending` |
| `invited_at` | TIMESTAMPTZ | default NOW() |
| `responded_at` | TIMESTAMPTZ | nullable, set on accept/decline |

UNIQUE constraint on `(campaign_id, beneficiary_profile_id)`. RLS enabled: beneficiaries read own rows; service role has full access.

### 2. `beneficiary_disbursements` (new)
Tracks payouts to a specific beneficiary from a specific campaign. Populated by admin/CM portals when funds are actually disbursed.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | auto |
| `campaign_id` | UUID FK → `hc_campaigns.id` | ON DELETE CASCADE |
| `beneficiary_profile_id` | UUID FK → `beneficiary_profiles.id` | ON DELETE CASCADE |
| `reference_id` | TEXT UNIQUE | e.g. `TXN-20260430-XXXXX` |
| `amount` | NUMERIC(12,2) | |
| `status` | TEXT | `pending` \| `approved` \| `rejected`, default `pending` |
| `disbursed_at` | TIMESTAMPTZ | nullable |
| `created_at` | TIMESTAMPTZ | default NOW() |
| `notes` | TEXT | nullable |

RLS enabled: beneficiaries read own rows; service role has full access.

### 3. RLS on `campaign_beneficiaries` (modified)
RLS enabled. Beneficiaries can SELECT their own enrollment rows. Service role has full access. This table is the enrollment table — a row here means the beneficiary has accepted an invitation and is enrolled in that campaign.

---

## API Routes

All routes are Next.js App Router route handlers (`app/api/...`). All require an authenticated Supabase session. Auth pattern: get `auth.uid()` → look up `beneficiary_profiles.id` WHERE `auth_user_id = uid`. All DB writes use the service role key. All reads use the user's session client where RLS allows, or service role where joins require it.

### `GET /api/campaigns`
Returns the authenticated beneficiary's enrolled campaigns plus summary data for the Impact Overview.

**Response shape:**
```ts
{
  campaigns: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    status: string;           // from hc_campaigns.status
    target_amount: number;
    collected_amount: number;
    total_received: number;   // SUM of approved disbursements for this beneficiary + campaign
  }[];
  summary: {
    total_support: number;    // SUM of all approved disbursements for this beneficiary
    active_count: number;     // count of enrolled campaigns with status = 'active'
    pending_invitations: number; // count of pending invitations (for badge)
  };
}
```

Source tables: `campaign_beneficiaries` → `hc_campaigns` → `beneficiary_disbursements`.

### `GET /api/campaigns/[id]`
Returns full details for one campaign. Verifies the beneficiary is enrolled (`campaign_beneficiaries` row exists).

**Response shape:**
```ts
{
  campaign: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    status: string;
    target_amount: number;
    collected_amount: number;
    start_date: string;
    end_date: string | null;
  };
  manager: {
    full_name: string;
    organization_name: string | null;
    email: string | null;
    phone: string | null;
  };
  disbursements: {
    id: string;
    reference_id: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    disbursed_at: string | null;
    created_at: string;
  }[];
  total_received: number;
}
```

Source tables: `campaign_beneficiaries`, `hc_campaigns`, `campaign_manager_profiles` (via `hc_campaigns.created_by` → `campaign_manager_profiles.auth_user_id`), `beneficiary_disbursements`.

### `GET /api/campaigns/invitations`
Returns pending invitations for the authenticated beneficiary.

**Response shape:**
```ts
{
  invitations: {
    id: string;
    campaign_id: string;
    title: string;
    category: string | null;
    description: string | null;
    organization_name: string | null;
    target_amount: number;
    invited_at: string;
  }[];
}
```

Source tables: `campaign_invitations` (status = 'pending') → `hc_campaigns` → `campaign_manager_profiles`.

### `POST /api/campaigns/invitations/[id]/accept`
Accepts a pending invitation. Validates: invitation exists, belongs to this beneficiary, status is `pending`. Then in a single service-role operation: inserts into `campaign_beneficiaries` and updates `campaign_invitations.status = 'accepted'`, `responded_at = NOW()`.

**Response:** `{ success: true }`

### `POST /api/campaigns/invitations/[id]/decline`
Declines a pending invitation. Same validation as accept. Updates `campaign_invitations.status = 'declined'`, `responded_at = NOW()`. Does NOT insert into `campaign_beneficiaries`.

**Response:** `{ success: true }`

---

## Frontend Updates

### `/campaigns/page.tsx`
- Remove `FEATURED_CAMPAIGNS` and `SECONDARY_CAMPAIGNS` constants.
- Fetch from `GET /api/campaigns` on mount.
- Empty state when `campaigns.length === 0`: show only the Impact Overview card (zeroed out) and the "View Invitations" button.
- "View Invitations" badge count comes from `summary.pending_invitations`.
- Impact Overview: `summary.total_support` and `summary.active_count`.
- Campaign cards: first two enrolled campaigns render as `LargeCampaignCard`, remaining as `SmallCampaignCard`.
- Remove "Join a New Cause" CTA card entirely.
- Progress ring in Impact Overview: `SUM(collected_amount) / SUM(target_amount)` across all enrolled active campaigns.

### `/campaigns/[id]/page.tsx`
- Read `params.id` (currently ignored).
- Fetch from `GET /api/campaigns/[id]`.
- Populate: campaign title, status badge, description, funding progress bar, manager card, disbursement table.
- If not enrolled or campaign not found: redirect to `/campaigns`.

### `/campaigns/invitations/page.tsx`
- Remove `INVITATIONS` constant.
- Fetch from `GET /api/campaigns/invitations` on mount.
- Accept button: calls `POST /api/campaigns/invitations/[id]/accept` → navigates to `/campaigns/invitation-accepted`.
- Decline button: calls `POST /api/campaigns/invitations/[id]/decline` → removes card from local state.
- Empty state when no pending invitations.

---

## Auth & Security

- All API routes verify the user session via `createClient` (server). Unauthenticated requests return 401.
- Beneficiary profile lookup is always by `auth_user_id = auth.uid()` — no user-supplied profile ID.
- All DB mutations use the service role key to bypass RLS safely server-side.
- The `[id]/accept` and `[id]/decline` routes verify `beneficiary_profile_id` ownership before mutating — a beneficiary cannot accept/decline another beneficiary's invitation.

---

## What This Does NOT Cover

- Admin UI for creating/approving disbursements — `beneficiary_disbursements` rows are created by admin/CM portals (future work).
- Pagination on disbursement history — initial implementation returns all rows ordered by `created_at DESC`.
- The `invitation-accepted` confirmation page — already exists and requires no backend changes.
