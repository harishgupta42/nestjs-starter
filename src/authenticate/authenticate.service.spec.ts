import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { SessionLogService } from '../session-log/session-log.service';
import { AuthenticateService } from './authenticate.service';

describe('AuthenticateService', () => {
  let service: AuthenticateService;

  beforeEach(async () => {
    process.env.API_KEYS = 'key-one, key-two';
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticateService,
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('signed') } },
        { provide: SessionLogService, useValue: { create: jest.fn().mockResolvedValue({}) } },
      ],
    }).compile();

    service = module.get<AuthenticateService>(AuthenticateService);
  });

  afterAll(() => {
    delete process.env.API_KEYS;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('accepts only configured API keys', () => {
    expect(service.validateApiKey('key-one')).toBe(true);
    expect(service.validateApiKey('key-two')).toBe(true);
    expect(service.validateApiKey('nope')).toBe(false);
  });
});
