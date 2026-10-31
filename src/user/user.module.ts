import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthenticateModule } from '../authenticate/authenticate.module';
import { EmailService } from '../email/email.service';
import { SessionLogModule } from '../session-log/session-log.module';
import { SmsService } from '../sms/sms.service';
import { UtilsService } from '../utils/utils.service';
import { UserStatus, UserStatusSchema } from './schemas/user-status.schema';
import { User, UserSchema } from './schemas/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserStatus.name, schema: UserStatusSchema },
    ]),
    SessionLogModule,
    forwardRef(() => AuthenticateModule),
  ],
  controllers: [UserController],
  providers: [UserService, UtilsService, EmailService, SmsService],
  exports: [UserService],
})
export class UserModule {}
