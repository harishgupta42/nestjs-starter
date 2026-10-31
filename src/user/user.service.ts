import * as bcrypt from 'bcrypt';
import * as domains from 'disposable-email-domains';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import * as moment from 'moment';
import { FilterQuery, Model, QueryOptions, UpdateQuery } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { channelVerificationStatusEnum, loginTypeEnum } from '../constants/app.constants';
import { UserStatus, UserStatusDocument } from './schemas/user-status.schema';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserStatus.name) private userStatusModel: Model<UserStatus>,
  ) {}

  isDisposableEmailDomain(email: string): boolean {
    return domains.includes(email.trim().split('@')[1]);
  }

  async create(data: User): Promise<UserDocument> {
    if (data.password) data.password = bcrypt.hashSync(data.password, parseInt(process.env.SALT_ROUNDS) || 10);
    const user = await this.userModel.create(data);

    await this.createStatus(
      data.loginType === loginTypeEnum.facebook || data.loginType === loginTypeEnum.google
        ? {
            userId: user._id,
            isPasswordSet: false,
            mobileVerification: { attemptCount: 0, status: channelVerificationStatusEnum.pending, otp: null },
            emailVerification: {
              attemptCount: 0,
              status: channelVerificationStatusEnum.completed,
              otp: null,
              verifiedAt: moment().utc().toDate(),
            },
            mobileLogin: { attemptCount: 0, status: channelVerificationStatusEnum.completed, otp: null },
          }
        : {
            userId: user._id,
            isPasswordSet: false,
            mobileVerification: { attemptCount: 0, status: channelVerificationStatusEnum.pending, otp: null },
            emailVerification: {
              attemptCount: 0,
              status: channelVerificationStatusEnum.pending,
              otp: null,
            },
            mobileLogin: { attemptCount: 0, status: channelVerificationStatusEnum.completed, otp: null },
          },
    );
    return user;
  }

  async updateOne(filter: FilterQuery<UserDocument>, data: UpdateQuery<User>): Promise<UserDocument> {
    if (data['$set'] && data['$set']['password'])
      data['$set']['password'] = bcrypt.hashSync(data['$set']['password'], parseInt(process.env.SALT_ROUNDS) || 10);
    const user = await this.userModel.findOneAndUpdate({ ...filter }, data, {
      new: true,
    });

    return user;
  }

  async findOne(filter: FilterQuery<UserDocument>): Promise<UserDocument | null> {
    return this.userModel.findOne(filter);
  }

  async find(filter: FilterQuery<UserDocument>, options?: QueryOptions<UserDocument>): Promise<UserDocument[] | []> {
    return this.userModel.find(filter, null, options);
  }

  async count(filter: FilterQuery<UserDocument>): Promise<number> {
    return this.userModel.countDocuments(filter);
  }

  async createStatus(data: UserStatus): Promise<UserStatus> {
    return this.userStatusModel.create({
      ...data,
    });
  }

  async updateOneStatus(
    filter: FilterQuery<UserStatusDocument>,
    data: UpdateQuery<UserStatusDocument>,
  ): Promise<UserStatusDocument> {
    return this.userStatusModel.findOneAndUpdate({ ...filter }, data, { new: true });
  }

  async findOneStatus(filter: FilterQuery<UserStatusDocument>): Promise<UserStatusDocument | null> {
    return this.userStatusModel.findOne(filter);
  }

  async googleAuthVerify(token: string): Promise<TokenPayload> {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
  }
}
