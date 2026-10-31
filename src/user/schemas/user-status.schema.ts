import { HydratedDocument, Schema as schema } from 'mongoose';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { channelVerificationStatusEnum } from '../../constants/app.constants';
import { UserDocument } from './user.schema';

export type UserStatusDocument = HydratedDocument<UserStatus>;

class MobileVerification {
  attemptCount: number;
  otp: number | null;
  status: channelVerificationStatusEnum;
  initiatedAt?: Date;
  verifiedAt?: Date;
}

class MobileLogin {
  attemptCount: number;
  otp: number | null;
  status: channelVerificationStatusEnum;
  initiatedAt?: Date;
  verifiedAt?: Date;
}

class EmailVerification {
  attemptCount: number;
  otp: number | null;
  status: channelVerificationStatusEnum;
  initiatedAt?: Date;
  verifiedAt?: Date;
}

class ResetPassword {
  attemptCount: number;
  otp: number | null;
  status: channelVerificationStatusEnum;
  initiatedAt?: Date;
  verifiedAt?: Date;
}

@Schema({ timestamps: true, versionKey: false })
export class UserStatus {
  @Prop({ type: schema.Types.ObjectId, ref: 'User' })
  userId: UserDocument['_id'] | UserDocument;

  @Prop()
  isPasswordSet: boolean;

  @Prop({ type: MobileVerification })
  mobileVerification: MobileVerification;

  @Prop({ type: MobileLogin })
  mobileLogin: MobileLogin;

  @Prop({ type: EmailVerification })
  emailVerification: EmailVerification;

  @Prop({ type: ResetPassword })
  resetPassword?: ResetPassword;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const UserStatusSchema = SchemaFactory.createForClass(UserStatus);
