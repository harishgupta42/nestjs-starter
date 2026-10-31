import * as moment from 'moment';

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { userType } from '../constants/app.constants';
import { AuthData } from '../interfaces/auth-data';
import { SessionLogService } from '../session-log/session-log.service';

@Injectable()
export class AuthenticateService {
  /** Comma-separated list of accepted keys for the x-api-key header (API_KEYS env). */
  private readonly validApiKeys: string[];

  constructor(private jwtService: JwtService, private sessionLogService: SessionLogService) {
    this.validApiKeys = (process.env.API_KEYS || '')
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean);
  }

  async generateJwtToken(payload: AuthData) {
    await this.sessionLogService.create({
      userId: payload.type && payload.type === userType.user ? payload._id : null,
      adminId: payload.type && payload.type === userType.admin ? payload._id : null,
      deviceType: payload.deviceType,
      deviceToken: payload.deviceToken,
      ipAddress: payload.ipAddress,
      lastActivityAt: moment().utc().toDate(),
      isActive: true,
    });
    return this.jwtService.sign(payload, { secret: process.env.JWT_SECRET });
  }

  validateApiKey(apiKey: string): boolean {
    return this.validApiKeys.some((validApiKey) => apiKey === validApiKey);
  }
}
