import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { UserStatus } from './schemas/user-status.schema';
import { User } from './schemas/user.schema';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: {} },
        { provide: getModelToken(UserStatus.name), useValue: {} },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('detects disposable email domains', () => {
    expect(service.isDisposableEmailDomain('a@mailinator.com')).toBe(true);
    expect(service.isDisposableEmailDomain('a@example.com')).toBe(false);
  });
});
