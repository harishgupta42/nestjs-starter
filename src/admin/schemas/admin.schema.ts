import { HydratedDocument } from 'mongoose';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { loginTypeEnum } from '../../constants/app.constants';

export type AdminDocument = HydratedDocument<Admin>;

@Schema({ timestamps: true, versionKey: false })
export class Admin {
  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  email?: string;

  @Prop()
  mobileNumber?: string;

  @Prop()
  countryCode?: string;

  @Prop()
  password?: string;

  @Prop()
  loginType: loginTypeEnum;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
