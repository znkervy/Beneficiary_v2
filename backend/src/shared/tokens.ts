export const HEALTH_SERVICE = 'HEALTH_SERVICE';
export const AUTH_SERVICE = 'AUTH_SERVICE';
export const CAMPAIGN_SERVICE = 'CAMPAIGN_SERVICE';

export const HEALTH_PATTERN = { cmd: 'health.check' };

export const AUTH_PATTERNS = {
  FORGOT_PASSWORD: { cmd: 'auth.forgotPassword' },
  VERIFY_OTP: { cmd: 'auth.verifyOtp' },
  RESET_PASSWORD: { cmd: 'auth.resetPassword' },
};

export const CAMPAIGN_PATTERNS = {
  GET_ALL: { cmd: 'campaigns.getAll' },
  GET_ONE: { cmd: 'campaigns.getOne' },
  GET_INVITATIONS: { cmd: 'campaigns.getInvitations' },
};
