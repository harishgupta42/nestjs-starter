import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { AdminService } from './admin.service';
import { Admin } from './schemas/admin.schema';

describe('AdminService', () => {
  let service: AdminService;
  const adminModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService, { provide: getModelToken(Admin.name), useValue: adminModel }],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    delete process.env.ADMIN_SEED_PASSWORD;
    process.env.NODE_ENV = 'test';
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('detects disposable email domains', () => {
    expect(service.isDisposableEmailDomain('someone@mailinator.com')).toBe(true);
    expect(service.isDisposableEmailDomain('someone@example.com')).toBe(false);
  });

  it('skips admin seeding outside production when ADMIN_SEED_PASSWORD is unset', async () => {
    delete process.env.ADMIN_SEED_PASSWORD;
    adminModel.findOne.mockResolvedValue(null);
    await service.onApplicationBootstrap();
    expect(adminModel.create).not.toHaveBeenCalled();
  });

  it('throws in production when ADMIN_SEED_PASSWORD is unset', async () => {
    delete process.env.ADMIN_SEED_PASSWORD;
    process.env.NODE_ENV = 'production';
    adminModel.findOne.mockResolvedValue(null);
    await expect(service.onApplicationBootstrap()).rejects.toThrow(/ADMIN_SEED_PASSWORD/);
  });

  it('seeds a hashed admin when ADMIN_SEED_PASSWORD is set', async () => {
    process.env.ADMIN_SEED_PASSWORD = 'change-me';
    adminModel.findOne.mockResolvedValue(null);
    adminModel.create.mockResolvedValue({});
    await service.onApplicationBootstrap();
    expect(adminModel.create).toHaveBeenCalledTimes(1);
    const created = adminModel.create.mock.calls[0][0];
    expect(created.email).toBe('admin@example.com');
    expect(created.password).not.toBe('change-me');
  });
});
