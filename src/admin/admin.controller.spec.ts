import { Test, TestingModule } from '@nestjs/testing';

import { AuthenticateService } from '../authenticate/authenticate.service';
import { SessionLogService } from '../session-log/session-log.service';
import { UtilsService } from '../utils/utils.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  let controller: AdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        UtilsService,
        { provide: AdminService, useValue: { findOne: jest.fn(), isDisposableEmailDomain: jest.fn() } },
        { provide: AuthenticateService, useValue: { generateJwtToken: jest.fn() } },
        { provide: SessionLogService, useValue: { find: jest.fn(), updateOne: jest.fn() } },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
