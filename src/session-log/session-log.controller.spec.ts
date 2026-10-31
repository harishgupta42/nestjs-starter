import { Test, TestingModule } from '@nestjs/testing';

import { SessionLogController } from './session-log.controller';
import { SessionLogService } from './session-log.service';

describe('SessionLogController', () => {
  let controller: SessionLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionLogController],
      providers: [{ provide: SessionLogService, useValue: {} }],
    }).compile();

    controller = module.get<SessionLogController>(SessionLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
