import { forwardRef, Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticateModule } from '../authenticate/authenticate.module';
import { UtilsService } from '../utils/utils.service';
import { Admin, AdminSchema } from './schemas/admin.schema';
import { SessionLogModule } from '../session-log/session-log.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
    SessionLogModule,
    forwardRef(() => AuthenticateModule),
  ],
  controllers: [AdminController],
  providers: [AdminService, UtilsService],
  exports: [AdminService],
})
export class AdminModule {}
