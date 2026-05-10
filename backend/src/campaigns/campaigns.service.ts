import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class CampaignsService {
  private get admin() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }

  async getAll(authUserUserId: string) {
    const admin = this.admin;

    const { data: profile, error: profileError } = await admin
      .from('beneficiary_profiles')
      .select('id')
      .eq('auth_user_id', authUserUserId)
      .single();

    if (profileError || !profile) {
      throw new NotFoundException('Profile not found');
    }

    const { data: enrollments, error: enrollmentsError } = await admin
      .from('campaign_beneficiaries')
      .select('campaign_id')
      .eq('beneficiary_profile_id', profile.id);

    if (enrollmentsError) {
      throw new InternalServerErrorException('Failed to load enrollments');
    }

    const campaignIds = (enrollments ?? []).map((e) => e.campaign_id);

    const { count: pendingInvitations } = await admin
      .from('campaign_invitations')
      .select('id', { count: 'exact', head: true })
      .eq('beneficiary_profile_id', profile.id)
      .eq('status', 'pending');

    if (campaignIds.length === 0) {
      return {
        campaigns: [],
        summary: {
          total_support: 0,
          active_count: 0,
          pending_invitations: pendingInvitations ?? 0,
        },
      };
    }

    const [
      { data: campaigns, error: campaignsError },
      { data: disbursements, error: disbursementsError },
    ] = await Promise.all([
      admin
        .from('hc_campaigns')
        .select('id, title, description, category, status, target_amount, collected_amount')
        .in('id', campaignIds),
      admin
        .from('beneficiary_disbursements')
        .select('campaign_id, amount')
        .eq('beneficiary_profile_id', profile.id)
        .eq('status', 'approved'),
    ]);

    if (campaignsError || disbursementsError) {
      throw new InternalServerErrorException('Failed to load campaigns or disbursements');
    }

    const receivedByCampaign: Record<string, number> = {};
    let totalSupport = 0;
    for (const d of disbursements ?? []) {
      receivedByCampaign[d.campaign_id] = (receivedByCampaign[d.campaign_id] ?? 0) + Number(d.amount);
      totalSupport += Number(d.amount);
    }

    const activeCount = (campaigns ?? []).filter((c) => c.status === 'active').length;

    return {
      campaigns: (campaigns ?? []).map((c) => ({
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
    };
  }

  async getInvitations(authUserUserId: string) {
    const admin = this.admin;

    const { data: profile, error: profileError } = await admin
      .from('beneficiary_profiles')
      .select('id')
      .eq('auth_user_id', authUserUserId)
      .single();

    if (profileError || !profile) {
      throw new NotFoundException('Profile not found');
    }

    const { data: invitations, error } = await admin
      .from('campaign_invitations')
      .select('id, campaign_id, invited_at')
      .eq('beneficiary_profile_id', profile.id)
      .eq('status', 'pending')
      .order('invited_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException('Failed to load invitations');
    }

    if (!invitations || invitations.length === 0) {
      return { invitations: [] };
    }

    const campaignIds = invitations.map((i) => i.campaign_id);

    const { data: campaigns, error: campaignsError } = await admin
      .from('hc_campaigns')
      .select('id, title, category, description, target_amount, created_by')
      .in('id', campaignIds);

    if (campaignsError) {
      throw new InternalServerErrorException('Failed to load campaigns');
    }

    const createdBys = [...new Set((campaigns ?? []).map((c) => c.created_by))];

    let managers: any[] = [];
    if (createdBys.length > 0) {
      const { data: managersData, error: managersError } = await admin
        .from('campaign_manager_profiles')
        .select('auth_user_id, organization_name')
        .in('auth_user_id', createdBys);
      if (managersError) {
        throw new InternalServerErrorException('Failed to load managers');
      }
      managers = managersData ?? [];
    }

    const campaignMap = new Map((campaigns ?? []).map((c) => [c.id, c]));
    const managerMap = new Map(managers.map((m) => [m.auth_user_id, m]));

    return {
      invitations: invitations.map((inv) => {
        const campaign = campaignMap.get(inv.campaign_id);
        const manager = campaign ? managerMap.get(campaign.created_by) : null;
        return {
          id: inv.id,
          campaign_id: inv.campaign_id,
          title: campaign?.title ?? 'Unknown Campaign',
          category: campaign?.category ?? null,
          description: campaign?.description ?? null,
          organization_name: manager?.organization_name ?? null,
          target_amount: campaign ? Number(campaign.target_amount) : 0,
          invited_at: inv.invited_at,
        };
      }),
    };
  }
}
