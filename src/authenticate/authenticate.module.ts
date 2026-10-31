import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AdminModule } from '../admin/admin.module';
import { inactivityTimeoutDurationInSeconds } from '../constants/app.constants';
import { SessionLogModule } from '../session-log/session-log.module';
import { UserModule } from '../user/user.module';
import { ApiKeyStrategy } from './api-key.strategy';
import { AuthenticateService } from './authenticate.service';
import { FacebookStrategy } from './facebook.strategy';
import { GoogleStrategy } from './google.strategy';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './role.guard';

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => AdminModule),
    SessionLogModule,
    PassportModule,
    JwtModule.register({
      secret: <string>process.env.JWT_SECRET,
      signOptions: { expiresIn: `${inactivityTimeoutDurationInSeconds}s` },
    }),
  ],
  providers: [AuthenticateService, GoogleStrategy, JwtStrategy, FacebookStrategy, ApiKeyStrategy, RolesGuard],
  exports: [AuthenticateService, RolesGuard],
})
export class AuthenticateModule {}
