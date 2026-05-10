import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { CampaignsService } from './campaigns.service';
import { CAMPAIGN_PATTERNS } from '../shared/tokens';

@Controller()
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @MessagePattern(CAMPAIGN_PATTERNS.GET_ALL)
  getAll(@Payload() data: { authUserUserId: string }) {
    return this.campaignsService.getAll(data.authUserUserId);
  }

  @MessagePattern(CAMPAIGN_PATTERNS.GET_INVITATIONS)
  getInvitations(@Payload() data: { authUserUserId: string }) {
    return this.campaignsService.getInvitations(data.authUserUserId);
  }
}
