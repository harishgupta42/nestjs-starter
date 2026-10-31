import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { SessionLog } from './schemas/session-log.schema';
import { SessionLogService } from './session-log.service';

describe('SessionLogService', () => {
  let service: SessionLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionLogService, { provide: getModelToken(SessionLog.name), useValue: {} }],
    }).compile();

    service = module.get<SessionLogService>(SessionLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
