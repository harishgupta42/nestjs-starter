import * as bcrypt from 'bcrypt';
import * as domains from 'disposable-email-domains';
import { FilterQuery, Model, QueryOptions, UpdateQuery } from 'mongoose';

import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { loginTypeEnum } from '../constants/app.constants';
import { Admin, AdminDocument } from './schemas/admin.schema';

@Injectable()
export class AdminService implements OnApplicationBootstrap {
  private logger = new Logger(AdminService.name);

  constructor(@InjectModel(Admin.name) private adminModel: Model<Admin>) {}

  /**
   * Seeds the first admin account on boot. Credentials come from env:
   * ADMIN_SEED_EMAIL (default admin@example.com) and ADMIN_SEED_PASSWORD (required).
   * In production a missing ADMIN_SEED_PASSWORD is a hard failure; elsewhere seeding is skipped.
   */
  async onApplicationBootstrap() {
    const email = process.env.ADMIN_SEED_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_SEED_PASSWORD;

    const admin = await this.findOne({ email });
    if (admin) return;

    if (!password) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ADMIN_SEED_PASSWORD must be set to seed the initial admin account in production');
      }
      this.logger.warn(`ADMIN_SEED_PASSWORD not set; skipping admin seed for ${email}`);
      return;
    }

    await this.create({
      firstName: 'Admin',
      lastName: 'Admin',
      email,
      password,
      loginType: loginTypeEnum.password,
    });
    this.logger.log(`seeded admin account ${email}`);
  }

  isDisposableEmailDomain(email: string): boolean {
    return domains.includes(email.trim().split('@')[1]);
  }

  async create(data: Admin): Promise<AdminDocument> {
    if (data.password) data.password = bcrypt.hashSync(data.password, parseInt(process.env.SALT_ROUNDS) || 10);
    return await this.adminModel.create(data);
  }

  async updateOne(filter: FilterQuery<AdminDocument>, data: UpdateQuery<Admin>): Promise<AdminDocument> {
    if (data['$set'] && data['$set']['password'])
      data['$set']['password'] = bcrypt.hashSync(data['$set']['password'], parseInt(process.env.SALT_ROUNDS) || 10);
    return await this.adminModel.findOneAndUpdate({ ...filter }, data, {
      new: true,
    });
  }

  async findOne(filter: FilterQuery<AdminDocument>): Promise<AdminDocument | null> {
    return this.adminModel.findOne(filter);
  }

  async find(filter: FilterQuery<AdminDocument>, options?: QueryOptions<AdminDocument>): Promise<AdminDocument[] | []> {
    return this.adminModel.find(filter, null, options);
  }

  async count(filter: FilterQuery<AdminDocument>): Promise<number> {
    return this.adminModel.countDocuments(filter);
  }
}
