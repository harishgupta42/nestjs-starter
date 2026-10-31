import * as moment from 'moment';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { AdminService } from '../admin/admin.service';
import { accessTokenHeaderName, userType } from '../constants/app.constants';
import { AuthData } from '../interfaces/auth-data';
import { SessionLogService } from '../session-log/session-log.service';
import { UserService } from '../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private logger = new Logger(JwtStrategy.name);
  constructor(
    private readonly userService: UserService,
    private readonly sessionLogService: SessionLogService,
    private readonly adminService: AdminService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromHeader(accessTokenHeaderName),
      ]),
      ignoreExpiration: true,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: AuthData) {
    this.logger.log(`decoded token=${JSON.stringify(payload)}`);

    const [user, session] = await Promise.all([
      payload.type === userType.user
        ? this.userService.findOne({ _id: payload._id })
        : this.adminService.findOne({ _id: payload._id }),
      this.sessionLogService.findOne({
        $or: [{ adminId: payload._id }, { userId: payload._id }],
        deviceToken: payload.deviceToken,
        deviceType: payload.deviceType,
      }),
    ]);
    if (!user) throw new HttpException('Invalid token', HttpStatus.FORBIDDEN);

    if (!session) throw new HttpException('Invalid session', HttpStatus.UNAUTHORIZED);
    await this.sessionLogService.updateOne({ _id: session._id }, { lastActivityAt: moment().utc().toDate() });

    return { ...payload, email: user.email, mobileNumber: user.mobileNumber, countryCode: user.countryCode };
  }
}
