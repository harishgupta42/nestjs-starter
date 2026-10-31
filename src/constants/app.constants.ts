export const inactivityTimeoutDurationInSeconds = 900;

export const accessTokenHeaderName = 'x-auth-token';

export const otpValidityInSeconds = 300;

export enum deviceTypeEnum {
  ios = 'ios',
  web = 'web',
  android = 'android',
}

export enum channelVerificationStatusEnum {
  pending = 'pending',
  initiated = 'initiated',
  completed = 'completed',
  failed = 'failed',
}

export enum loginTypeEnum {
  password = 'password',
  mobile = 'mobile',
  google = 'google',
  facebook = 'facebook',
}

export enum userType {
  admin = 'admin',
  user = 'user',
}
