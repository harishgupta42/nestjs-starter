import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SessionLog, SessionLogSchema } from './schemas/session-log.schema';
import { SessionLogController } from './session-log.controller';
import { SessionLogService } from './session-log.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: SessionLog.name, schema: SessionLogSchema }])],
  controllers: [SessionLogController],
  providers: [SessionLogService],
  exports: [SessionLogService],
})
export class SessionLogModule {}
