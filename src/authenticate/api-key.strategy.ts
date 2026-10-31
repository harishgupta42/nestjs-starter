import { HeaderAPIKeyStrategy } from 'passport-headerapikey';

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { AuthenticateService } from './authenticate.service';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy) {
  constructor(private authenticateService: AuthenticateService) {
    super({ header: 'x-api-key', prefix: '' }, true, (apiKey: string, done: any) => {
      const checkKey = authenticateService.validateApiKey(apiKey);

      if (!checkKey) return done(new HttpException('Invalid API key', HttpStatus.UNAUTHORIZED));
      return done(null, true);
    });
  }
}
