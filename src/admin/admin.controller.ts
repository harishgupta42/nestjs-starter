import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import * as moment from 'moment';
import { I18n, I18nContext } from 'nestjs-i18n';

import {
  Body,
  Catch,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthenticateService } from '../authenticate/authenticate.service';
import { JwtAuthGuard } from '../authenticate/jwt-auth.guard';
import { userType } from '../constants/app.constants';
import { ApiResponse } from '../interfaces/api-response';
import { SessionLogService } from '../session-log/session-log.service';
import { UtilsService } from '../utils/utils.service';
import { AdminService } from './admin.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { ValidateAdminDTO } from './dto/validate-admin.dto';

@Catch()
@ApiTags('admin')
@Controller('admin')
export class AdminController {
  private logger = new Logger(AdminController.name);
  constructor(
    private readonly adminService: AdminService,
    private readonly authenticateService: AuthenticateService,
    private readonly utilsService: UtilsService,
    private readonly sessionLogService: SessionLogService,
  ) {}

  @ApiOperation({ summary: 'Check admin email or phone number' })
  @Post('/validate')
  async validate(@Query() query: ValidateAdminDTO, @I18n() i18n: I18nContext): Promise<ApiResponse> {
    if (query.mobileNumber) {
      if (!query.countryCode) throw new HttpException(await i18n.t('message.countryCodeMissing'), HttpStatus.FORBIDDEN);

      const admin = await this.adminService.findOne({
        mobileNumber: query.mobileNumber,
        countryCode: query.countryCode,
      });

      if (admin) throw new HttpException(await i18n.t('message.mobileNumberAlreadyExists'), HttpStatus.FORBIDDEN);
    }

    if (query.email) {
      if (this.adminService.isDisposableEmailDomain(query.email))
        throw new HttpException(await i18n.t('message.notAcceptable'), HttpStatus.FORBIDDEN);
      const admin = await this.adminService.findOne({
        email: query.email,
      });

      if (admin) throw new HttpException(await i18n.t('message.emailAlreadyExists'), HttpStatus.FORBIDDEN);
    }

    throw new HttpException(await i18n.t('message.notFound'), HttpStatus.NOT_FOUND);
  }

  @ApiOperation({ summary: 'Admin login using email or mobile' })
  @Post('/login')
  async login(@Req() request: Request, @Body() body: LoginAdminDto, @I18n() i18n: I18nContext): Promise<ApiResponse> {
    const admin = await this.adminService.findOne({ email: body.email });

    if (!admin) throw new HttpException(await i18n.t('message.adminNotFound'), HttpStatus.NOT_FOUND);

    if (body.password && !(await bcrypt.compare(body.password, admin.password)))
      throw new HttpException(await i18n.t('message.incorrectPassword'), HttpStatus.FORBIDDEN);

    const [token] = await Promise.all([
      this.authenticateService.generateJwtToken({
        _id: admin._id,
        deviceType: body.deviceType,
        deviceToken: body.deviceToken,
        ipAddress: request.socket.remoteAddress,
        type: userType.admin,
      }),
    ]);
    return {
      statusCode: HttpStatus.OK,
      message: await i18n.t('message.success'),
      data: { token },
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get admin information' })
  @ApiBearerAuth()
  @Get('/info')
  async getAdmin(@Req() request: Request, @I18n() i18n: I18nContext): Promise<ApiResponse> {
    let [admin, sessionArray] = await Promise.all([
      this.adminService.findOne({
        _id: request['user']['_id'],
      }),
      this.sessionLogService.find({ adminId: request['user']['_id'] }, { sort: { createdAt: -1 }, limit: 2 }),
    ]);
    admin = JSON.parse(JSON.stringify(admin), this.utilsService.omitData);

    return {
      statusCode: HttpStatus.OK,
      message: await i18n.t('message.success'),
      data: { admin: { ...admin, lastLoginAt: sessionArray[1]?.createdAt } },
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout' })
  @ApiBearerAuth()
  @Post('/logout')
  async logout(@Req() request: Request, @I18n() i18n: I18nContext): Promise<ApiResponse> {
    await this.sessionLogService.updateOne(
      {
        adminId: request['user']['_id'],
        deviceToken: request['user']['deviceToken'],
        deviceType: request['user']['deviceType'],
      },
      {
        isActive: false,
        lastActivityAt: moment().utc().toDate(),
      },
    );

    return {
      statusCode: HttpStatus.OK,
      message: await i18n.t('message.success'),
    };
  }
}
