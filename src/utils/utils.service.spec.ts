import { Test, TestingModule } from '@nestjs/testing';

import { UtilsService } from './utils.service';

describe('UtilsService', () => {
  let service: UtilsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UtilsService],
    }).compile();

    service = module.get<UtilsService>(UtilsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('generates a six digit otp', () => {
    process.env.NODE_ENV = 'test';
    const otp = service.generateOtp();
    expect(otp).toBeGreaterThanOrEqual(100000);
    expect(otp).toBeLessThan(1000000);
  });

  it('strips sensitive keys when used as a JSON reviver', () => {
    const out = JSON.parse(JSON.stringify({ email: 'a@example.com', password: 'x', otp: 1 }), service.omitData);
    expect(out).toEqual({ email: 'a@example.com' });
  });

  it('camelizes snake_case keys', () => {
    expect(service.camelize({ first_name: 'a', nested: { last_name: 'b' } })).toEqual({
      firstName: 'a',
      nested: { lastName: 'b' },
    });
  });
});
