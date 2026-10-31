import { HydratedDocument, Schema as schema } from 'mongoose';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { UserDocument } from '../../user/schemas/user.schema';
import { AdminDocument } from '../../admin/schemas/admin.schema';

export type SessionLogDocument = HydratedDocument<SessionLog>;

@Schema({ timestamps: true, versionKey: false })
export class SessionLog {
  @Prop({ type: schema.Types.ObjectId, ref: 'User', required: false })
  userId?: UserDocument['_id'] | UserDocument;

  @Prop({ type: schema.Types.ObjectId, ref: 'Admin', required: false })
  adminId?: AdminDocument['_id'] | AdminDocument;

  @Prop()
  ipAddress: string;

  @Prop()
  deviceType: string;

  @Prop()
  deviceToken: string;

  @Prop()
  lastActivityAt: Date;

  @Prop()
  isActive: boolean;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const SessionLogSchema = SchemaFactory.createForClass(SessionLog);
