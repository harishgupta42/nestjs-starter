import { Test, TestingModule } from '@nestjs/testing';

import { AuthenticateService } from '../authenticate/authenticate.service';
import { EmailService } from '../email/email.service';
import { SessionLogService } from '../session-log/session-log.service';
import { SmsService } from '../sms/sms.service';
import { UtilsService } from '../utils/utils.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UtilsService,
        { provide: UserService, useValue: {} },
        { provide: AuthenticateService, useValue: {} },
        { provide: EmailService, useValue: {} },
        { provide: SmsService, useValue: {} },
        { provide: SessionLogService, useValue: {} },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
