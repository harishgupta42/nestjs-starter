import * as moment from 'moment';
import { AggregateOptions, FilterQuery, Model, PipelineStage, QueryOptions } from 'mongoose';

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { SessionLog, SessionLogDocument } from './schemas/session-log.schema';

@Injectable()
export class SessionLogService {
  constructor(@InjectModel(SessionLog.name) private sessionLogModel: Model<SessionLog>) {}
  async create(data: SessionLog): Promise<SessionLog> {
    const [sessionLog] = await Promise.all([
      this.sessionLogModel.create({
        ...data,
      }),
      this.updateOne(
        { userId: data.userId, deviceToken: { $ne: data.deviceToken } },
        { lastActivityAt: moment().utc().toDate(), isActive: false },
      ),
    ]);
    return sessionLog;
  }

  async upsert(filter: FilterQuery<SessionLogDocument>, data: Partial<SessionLog>): Promise<void> {
    this.sessionLogModel.findOneAndUpdate({ ...filter }, data, { upsert: true });
  }

  async updateMany(filter: FilterQuery<SessionLogDocument>, data: Partial<SessionLog>): Promise<void> {
    this.sessionLogModel.updateMany({ ...filter }, data);
  }

  async updateOne(filter: FilterQuery<SessionLogDocument>, data: Partial<SessionLog>): Promise<SessionLogDocument> {
    return this.sessionLogModel.findOneAndUpdate({ ...filter }, data, { new: true });
  }

  async findOne(filter: FilterQuery<SessionLogDocument>): Promise<SessionLogDocument | null> {
    return this.sessionLogModel.findOne(filter).sort({ createdAt: -1 });
  }

  async find(
    filter: FilterQuery<SessionLogDocument>,
    options?: QueryOptions<SessionLogDocument>,
  ): Promise<SessionLogDocument[] | []> {
    return this.sessionLogModel.find(filter, null, options);
  }

  async aggregate(pipeline: PipelineStage[], options?: AggregateOptions): Promise<SessionLogDocument[] | []> {
    return this.sessionLogModel.aggregate(pipeline, options);
  }
}
