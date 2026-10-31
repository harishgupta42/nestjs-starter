import { Strategy, VerifyCallback } from 'passport-google-oauth20';

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET_ID,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/user/auth/google/redirect',
      scope: ['email', 'profile'],
    });
  }

  /**
   * Maps the Google profile ({ id, displayName, name: { givenName, familyName }, emails: [{ value, verified }],
   * photos: [{ value }] }) onto the shape the user controller expects.
   */
  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails?.[0]?.value,
      firstName: name?.givenName,
      lastName: name?.familyName,
      profilePhoto: photos?.[0]?.value,
      accessToken,
    };
    done(null, user);
  }
}
