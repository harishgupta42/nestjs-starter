import { Strategy, VerifyCallback } from 'passport-facebook';

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3000/user/auth/facebook/redirect',
      profileFields: ['id', 'name', 'displayName', 'photos', 'emails'],
    });
  }

  /**
   * Maps the Facebook profile ({ id, displayName, name: { givenName, familyName }, emails?, photos: [{ value }] })
   * onto the shape the user controller expects. Facebook may withhold the email, so a synthetic
   * <id>@facebook.com address is used as the stable identifier in that case.
   */
  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { id, name, emails, photos } = profile;
    const user = {
      email: emails?.[0]?.value || `${id}@facebook.com`,
      firstName: name?.givenName,
      lastName: name?.familyName,
      profilePhoto: photos?.[0]?.value,
      accessToken,
    };
    done(null, user);
  }
}
