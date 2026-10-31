import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
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
import { FacebookAuthGuard } from '../authenticate/facebook.auth.guard';
import { GoogleAuthGuard } from '../authenticate/google.auth.guard';
import { JwtAuthGuard } from '../authenticate/jwt-auth.guard';
import {
  channelVerificationStatusEnum,
  deviceTypeEnum,
  loginTypeEnum,
  otpValidityInSeconds,
  userType,
} from '../constants/app.constants';
import { EmailService } from '../email/email.service';
import { ApiResponse } from '../interfaces/api-response';
import { SessionLogService } from '../session-log/session-log.service';
import { SmsService } from '../sms/sms.service';
import { UtilsService } from '../utils/utils.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignUpUsingEmailDto } from './dto/sign-up-using-email.dto';
import { SignUpUsingMobileDto } from './dto/sign-up-using-mobile.dto';
import { ValidateUserDTO } from './dto/validate-user.dto';
import { VerifyChannelDto } from './dto/verify-channel.dto';
import { VerifyMobileDto } from './dto/verify-mobile.dto';
import { UserService } from './user.service';

@Catch()
@ApiTags('user')
@Controller('user')
export class UserController {
  private logger = new Logger(UserController.name);
  constructor(
    private readonly userService: UserService,
    private readonly authenticateService: AuthenticateService,
    private readonly utilsService: UtilsService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly sessionLogService: SessionLogService,
  ) {}

  @ApiOperation({ summary: 'Check user email or phone number' })
  @Post('/validate')
  async validate(@Query() query: ValidateUserDTO, @I18n() i18n: I18nContext): Promise<ApiResponse> {
    if (query.mobileNumber) {
      if (!query.countryCode) throw new HttpException(await i18n.t('message.countryCodeMissing'), HttpStatus.FORBIDDEN);

      const user = await this.userService.findOne({
        mobileNumber: query.mobileNumber,
        countryCode: query.countryCode,
      });

      if (user) throw new HttpException(await i18n.t('message.mobileNumberAlreadyExists'), HttpStatus.FORBIDDEN);
    }

    if (query.email) {
      if (this.userService.isDisposableEmailDomain(query.email))
        throw new HttpException(await i18n.t('message.notAcceptable'), HttpStatus.FORBIDDEN);
      const user = await this.userService.findOne({
        email: query.email,
      });

      if (user) throw new HttpException(await i18n.t('message.emailAlreadyExists'), HttpStatus.FORBIDDEN);
    }

    throw new HttpException(await i18n.t('message.notFound'), HttpStatus.NOT_FOUND);
  }

  @ApiOperation({ summary: 'User sign-up using email' })
  @Post('/signup/email')
  async signUpUsingEmail(
    @Req() request: Request,
    @Body() body: SignUpUsingEmailDto,
    @I18n() i18n: I18nContext,
  ): Promise<ApiResponse> {
    if (this.userService.isDisposableEmailDomain(body.email))
      throw new HttpException(await i18n.t('message.notAcceptable'), HttpStatus.FORBIDDEN);
    let user = await this.userService.findOne({ email: body.email });

    if (user) throw new HttpException(await i18n.t('message.alreadyExists'), HttpStatus.FORBIDDEN);

    user = await this.userService.create({ ...body, loginType: loginTypeEnum.password });

    const otp = this.utilsService.generateOtp();
    const [token] = await Promise.all([
      this.authenticateService.generateJwtToken({
        _id: user._id,
        deviceType: body.deviceType,
        deviceToken: body.deviceToken,
        ipAddress: request.socket.remoteAddress,
        type: userType.user,
      }),
      this.userService.updateOneStatus(
        { userId: user._id },
        {
          $set: {
            isPasswordSet: true,
            emailVerification: {
              otp,
              initiatedAt: moment().utc().toDate(),
              status: channelVerificationStatusEnum.initiated,
              attemptCount: 1,
            },
          },
        },
      ),
    ]);

    this.emailService.send(user.email, 'email-otp', { otp }, i18n);
    return {
      statusCode: HttpStatus.OK,
      message: await i18n.t('message.success'),
      data: { token },
    };
  }

  @ApiOperation({ summary: 'User sign-up using mobile' })
  @Post('/signup/mobile')
  async signUpUsingMobile(@Body() body: SignUpUsingMobileDto, @I18n() i18n: I18nContext): Promise<ApiResponse> {
    let user = await this.userService.findOne({ countryCode: body.countryCode, mobileNumber: body.mobileNumber });

    // if user exists
    // check if mobile verification is completed or not
    if (user) {
      const userStatus = await this.userService.findOneStatus({ userId: user._id });
      if (userStatus && userStatus.mobileVerification.status === channelVerificationStatusEnum.completed)
        throw new HttpException(await i18n.t('message.alreadyExists'), HttpStatus.FORBIDDEN);
    }

    // if user does not exist, create the user
    if (!user)
      user = await this.userService.create({
        ...body,
        loginType: loginTypeEnum.mobile,
      });

    // generate OTP
    // if user is unverified
    // or if user is new
    const otp = this.utilsService.generateOtp();
    await Promise.all([
      this.userService.updateOneStatus(
        { userId: user._id },
        {
          $set: {
            mobileVerification: {
              otp,
              initiatedAt: moment().utc().toDate(),
              status: channelVerificationStatusEnum.initiated,
              attemptCount: 1,
            },
          },
        },
      ),
    ]);

    await this.smsService.send(
      `${user.countryCode}${user.mobileNumber}`,
      `${otp}${i18n.t('message.smsMobileVerification')}`,
    );
    return {
      statusCode: HttpStatus.OK,
      message: await i18n.t('message.success'),
    };
  }

  @Get('/auth/google')
  @UseGuards(GoogleAuthGuard)
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async googleAuth() {}

  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'User sign-up using google' })
  @Get('/auth/google/redirect')
  async googleRedirect(@Req() request: any, @I18n() i18n: I18nContext): Promise<ApiResponse> {
    this.logger.log(`google auth user=${JSON.stringify(request.user)}`);
    const googleUser = request.user;

    let user = await this.userService.findOne({ email: googleUser.email });

    if (!user) {
      user = await this.userService.create({
        email: googleUser.email,
        loginType: loginTypeEnum.google,
      });
    }
    user = JSON.parse(JSON.stringify(user, this.utilsService.omitData));
    const deviceToken = randomUUID();
    const [token] = await Promise.all([
      this.authenticateService.generateJwtToken({
        _id: user._id,
        deviceType: deviceTypeEnum.web,
        deviceToken: deviceToken,
        ipAddress: request.socket.remoteAddress,
        type: userType.user,
      }),
    ]);
    return {
      statusCode: HttpStatus.CREATED,
      message: await i18n.t('message.success'),
      data: { ...user, token },
    };
  }

  @ApiOperation({ summary: 'Google token verify' })
  @Get('/auth/google/verify')
  async googleTokenVerify(@Req() request, @Query() query: any, @I18n() i18n: I18nContext): Promise<ApiResponse> {
    const idToken = query.idToken;

    const tokenPayload = await this.userService.googleAuthVerify(idToken);
    let user = await this.userService.findOne({ email: tokenPayload.email });

    if (!user) {
      user = await this.userService.create({
        email: tokenPayload.email,
        loginType: loginTypeEnum.google,
      });
    }
    user = JSON.parse(JSON.stringify(user, this.utilsService.omitData));
    const deviceToken = randomUUID();
    const [token] = await Promise.all([
      this.authenticateService.generateJwtToken({
        _id: user._id,
        deviceType: deviceTypeEnum.web,
        deviceToken: deviceToken,
        ipAddress: request.socket.remoteAddress,
        type: userType.user,
      }),
    ]);
    return {
      statusCode: HttpStatus.CREATED,
      message: await i18n.t('message.success'),
      data: { ...user, token },
    };
  }

  @Get('/auth/facebook')
  @UseGuards(FacebookAuthGuard)
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async facebookAuth() {}

  @UseGuards(FacebookAuthGuard)
  @ApiOperation({ summary: 'User sign-up using facebook' })
  @Get('/auth/facebook/redirect')
  async facebookRedirect(@Req() request: any, @I18n() i18n: I18nContext): Promise<ApiResponse> {
    this.logger.log(`facebook auth user=${JSON.stringify(request.user)}`);
    const facebookUser = request.user;

    let user = await this.userService.findOne({ email: facebookUser.email });

    if (!user) {
      user = await this.userService.create({
        email: facebookUser.email,
        loginType: loginTypeEnum.facebook,
      });
    }
    user = JSON.parse(JSON.stringify(user, this.utilsService.omitData));
    const deviceToken = randomUUID();
    const [token] = await Promise.all([
      this.authenticateService.generateJwtToken({
        _id: user._id,
        deviceType: deviceTypeEnum.web,
        deviceToken: deviceToken,
        ipAddress: request.socket.remoteAddress,
        type: userType.user,
      }),
    ]);
    return {
      statusCode: HttpStatus.CREATED,
      message: await i18n.t('message.success'),
      data: { ...user, token },
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify email' })
  @Post('/verify/email')
  async verifyEmail(
    @Req() request: Request,
    @Body() body: VerifyChannelDto,
    @I18n() i18n: I18nContext,
  ): Promise<ApiResponse> {
    const userStatus = await this.userService.findOneStatus({ userId: request['user']['_id'] });

    if (!userStatus) throw new HttpException(await i18n.t('message.userNotFound'), HttpStatus.NOT_FOUND);
    if (userStatus.emailVerification.status === channelVerificationStatusEnum.completed)
      return {
        statusCode: HttpStatus.OK,
        message: await i18n.t('message.success'),
      };

    if (
      userStatus.emailVerification.otp &&
      moment().utc().isAfter(moment(userStatus.emailVerification.initiatedAt).add(otpValidityInSeconds, 'seconds'))
    ) {
      await this.userService.updateOneStatus(
        { _id: userStatus._id },
        {
          $set: { 'emailVerification.status': channelVerificationStatusEnum.failed },
          $inc: { 'emailVerification.attemptCount': 1 },
        },
      );
      throw new HttpException(await i18n.t('message.otpMismatch'), HttpStatus.FORBIDDEN);
    }
    if (userStatus.emailVerification.otp && userStatus.emailVerification.otp !== body.otp)
      throw new HttpException(await i18n.t('message.otpMismatch'), HttpStatus.FORBIDDEN);

    if (userStatus.emailVerification.otp === body.otp)
      await this.userService.updateOneStatus(
        { _id: userStatus._id },
        {
          emailVerification: {
            otp: null,
            verifiedAt: moment().utc().toDate(),
            status: channelVerificationStatusEnum.completed,
            attemptCount: userStatus.emailVerification.attemptCount,
          },
        },
      );

    return {
      statusCode: HttpStatus.OK,
      message: await i18n.t('message.success'),
    };
  }

  @ApiOperation({ summary: 'Verify mobile' })
  @Post('/verify/mobile')
  async verifyMobile(
    @Req() request: any,
    @Body() body: VerifyMobileDto,
    @I18n() i18n: I18nContext,
  ): Promise<ApiResponse> {
    const user = await this.userService.findOne({ countryCode: body.countryCode, mobileNumber: body.mobileNumber });
    if (!user) throw new HttpException(await i18n.t('message.userNotFound'), HttpStatus.NOT_FOUND);
    const [userStatus] = await Promise.all([this.userService.findOneStatus({ userId: user._id })]);
    if (!userStatus) throw new HttpException(await i18n.t('message.userNotFound'), HttpStatus.NOT_FOUND);

    if (userStatus.mobileVerification.status === channelVerificationStatusEnum.completed)
      return {
        statusCode: HttpStatus.OK,
        message: await i18n.t('message.success'),
      };

    if (
      userStatus.mobileVerification.otp &&
      moment().utc().isAfter(moment(userStatus.mobileVerification.initiatedAt).add(otpValidityInSeconds, 'seconds'))
    ) {
      await this.userService.updateOneStatus(
        { _id: userStatus._id },
        {
          $set: { 'mobileVerification.status': channelVerificationStatusEnum.failed },
          $inc: { 'mobileVerification.attemptCount': 1 },
        },
      );
      throw new HttpException(await i18n.t('message.otpMismatch'), HttpStatus.FORBIDDEN);
    }
    if (userStatus.mobileVerification.otp && userStatus.mobileVerification.otp !== body.otp)
      throw new HttpException(await i18n.t('message.otpMismatch'), HttpStatus.FORBIDDEN);

    const [token] = await Promise.all([
      this.authenticateService.generateJwtToken({
        _id: user._id,
        deviceType: body.deviceType,
        deviceToken: body.deviceToken,
        ipAddress: request.socket.remoteAddress,
        type: userType.user,
      }),
      this.userService.updateOneStatus(
        { _id: userStatus._id },
        {
          mobileVerification: {
            otp: null,
            verifiedAt: moment().utc().toDate(),
            status: channelVerificationStatusEnum.completed,
            attemptCount: userStatus.mobileVerification.attemptCount,
          },
        },
      ),
    ]);
    return {
      statusCode: HttpStatus.OK,
      message: await i18n.t('message.success'),
      data: { token },
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend email verification' })
  @Post('/verify/email/resend')
  async resendEmailVerification(@Req() request: Request, @I18n() i18n: I18nContext): Promise<ApiResponse> {
    const [user, userStatus] = await Promise.all([
      this.userService.findOne({ _id: request['user']['_id'] }),
      this.userService.findOneStatus({ userId: request['user']['_id'] }),
    ]);

    if (!userStatus) throw new HttpException(await i18n.t('message.userNotFound'), HttpStatus.NOT_FOUND);
    if (userStatus.emailVerification.status === channelVerificationStatusEnum.completed)
      return {
        statusCode: HttpStatus.OK,
        message: await i18n.t('message.emailAlreadyVerified'),
      };

    const otp = this.utilsService.generateOtp();
    this.userService.updateOneStatus(
      { _id: userStatus._id },
      {
        $set: {
          emailVerification: {
            otp,
            initiatedAt: moment().utc().toDate(),
            status: channelVerificationStatusEnum.initiated,
            attemptCount: userStatus.emailVerification.attemptCount || 0 + 1,
          },
        },
      },
    );

    this.emailService.send(user.email, 'email-otp', { otp }, i18n);
    return {
      statusCode: HttpStatus.OK,
      message: await i18n.t('message.success'),
    };
  }

  @ApiOperation({ summary: 'User login using email or mobile' })
  @Post('/login')
  async login(@Req() request: Request, @Body() body: LoginUserDto, @I18n() i18n: I18nContext): Promise<ApiResponse> {
    if (
      (body.countryCode && body.mobileNumber && body.email) ||
      (!body.countryCode && !body.mobileNumber && !body.email) ||
      (!body.email && body.password) ||
      (body.email && !body.password)
    )
      throw new HttpException(await i18n.t('message.invalidDataInput'), HttpStatus.BAD_REQUEST);

    const user = await this.userService.findOne(
      body.email ? { email: body.email } : { countryCode: body.countryCode, mobileNumber: body.mobileNumber },
    );

    if (!user) throw new HttpException(await i18n.t('message.userNotFound'), HttpStatus.NOT_FOUND);

    if (body.countryCode && body.mobileNumber) {
      const otp = this.utilsService.generateOtp();
      await Promise.all([
        this.userService.updateOneStatus(
          { userId: user._id },
          {
            $set: {
              mobileLogin: {
                otp,
                initiatedAt: moment().utc().toDate(),
                status: channelVerificationStatusEnum.initiated,
                attemptCount: 1,
              },
            },
          },
        ),
      ]);

      await this.smsService.send(
        `${user.countryCode}${user.mobileNumber}`,
        `${otp}${i18n.t('message.smsMobileVerification')}`,
      );
      return {
        statusCode: HttpStatus.OK,
        message: await i18n.t('message.success'),
      };
    }

    if (body.password && !(await bcrypt.compare(body.password, user.password)))
      throw new HttpException(await i18n.t('message.incorrectPassword'), HttpStatus.FORBIDDEN);

    const [token] = await Promise.all([
      this.authenticateService.generateJwtToken({
        _id: user._id,
        deviceType: body.deviceType,
        deviceToken: body.deviceToken,
        ipAddress: request.socket.remoteAddress,
        type: userType.user,
      }),
    ]);
    return {
      statusCode: HttpStatus.OK,
      message: await i18n.t('message.success'),
      data: { token },
    };
  }

  @ApiOperation({ summary: 'Verify mobile OTP for login' })
  @Post('/login/verify/mobile')
  async verifyMobileForLogin(
    @Req() request: any,
    @Body() body: VerifyMobileDto,
    @I18n() i18n: I18nContext,
  ): Promise<ApiResponse> {
    const user = await this.userService.findOne({ countryCode: body.countryCode, mobileNumber: body.mobileNumber });
    if (!user) throw new HttpException(await i18n.t('message.userNotFound'), HttpStatus.NOT_FOUND);
    const [userStatus] = await Promise.all([this.userService.findOneStatus({ userId: user._id })]);
    if (!userStatus) throw new HttpException(await i18n.t('message.userNotFound'), HttpStatus.NOT_FOUND);

    if (userStatus.mobileLogin.status !== channelVerificationStatusEnum.initiated)
      throw new HttpException(await i18n.t('message.invalidDataInput'), HttpStatus.BAD_REQUEST);

    if (
      userStatus.mobileLogin.otp &&
      moment().utc().isAfter(moment(userStatus.mobileLogin.initiatedAt).add(otpValidityInSeconds, 'seconds'))
    ) {
      await this.userService.updateOneStatus(
        { _id: userStatus._id },
        {
          $set: { 'mobileLogin.status': channelVerificationStatusEnum.failed },
          $inc: { 'mobileLogin.attemptCount': 1 },
        },
      );
      throw new HttpException(await i18n.t('message.otpMismatch'), HttpStatus.FORBIDDEN);
    }
    if (userStatus.mobileLogin.otp && userStatus.mobileLogin.otp !== body.otp)
      throw new HttpException(await i18n.t('message.otpMismatch'), HttpStatus.FORBIDDEN);

    const [token] = await Promise.all([
      this.authenticateService.generateJwtToken({
        _id: user._id,
        deviceType: body.deviceType,
        deviceToken: body.deviceToken,
        ipAddress: request.socket.remoteAddress,
        type: userType.user,
      }),
      this.userService.updateOneStatus(
        { _id: userStatus._id },
        {
          mobileLogin: {
            otp: null,
            verifiedAt: moment().utc().toDate(),
            status: channelVerificationStatusEnum.completed,
            attemptCount: userStatus.mobileLogin.attemptCount,
          },
        },
      ),
    ]);
    return {
      statusCode: HttpStatus.OK,
      message: await i18n.t('message.success'),
      data: { token },
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user information' })
  @ApiBearerAuth()
  @Get('/info')
  async getUser(@Req() request: Request, @I18n() i18n: I18nContext): Promise<ApiResponse> {
    let [user, status] = await Promise.all([
      this.userService.findOne({
        _id: request['user']['_id'],
      }),
      this.userService.findOneStatus({ userId: request['user']['_id'] }),
    ]);
    user = JSON.parse(JSON.stringify(user), this.utilsService.omitData);
    status = JSON.parse(JSON.stringify(status), this.utilsService.omitData);

    return {
      statusCode: HttpStatus.OK,
      message: await i18n.t('message.success'),
      data: { user, status },
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Logout' })
  @ApiBearerAuth()
  @Post('/logout')
  async logout(@Req() request: Request, @I18n() i18n: I18nContext): Promise<ApiResponse> {
    await this.sessionLogService.updateOne(
      {
        userId: request['user']['_id'],
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

  @ApiOperation({ summary: 'Forgot password initiation' })
  @Post('/password/forgot')
  async forgotPassword(@Body() body: ForgotPasswordDto, @I18n() i18n: I18nContext): Promise<ApiResponse> {
    const user = await this.userService.findOne({ email: body.email });

    if (!user) throw new HttpException(await i18n.t('message.userNotFound'), HttpStatus.NOT_FOUND);

    const userStatus = await this.userService.findOneStatus({ userId: user._id });

    if (!userStatus) throw new HttpException(await i18n.t('message.userNotFound'), HttpStatus.NOT_FOUND);

    const otp = this.utilsService.generateOtp();
    this.userService.updateOneStatus(
      { _id: userStatus._id },
      {
        $set: {
          resetPassword: {
            otp,
            initiatedAt: moment().utc().toDate(),
            status: channelVerificationStatusEnum.initiated,
            attemptCount: userStatus.emailVerification.attemptCount || 0 + 1,
          },
        },
      },
    );

    this.emailService.send(user.email, 'email-otp', { otp }, i18n);
    return {
      statusCode: HttpStatus.OK,
      message: await i18n.t('message.success'),
    };
  }

  @ApiOperation({ summary: 'Reset forgot password' })
  @Post('/password/reset')
  async resetPassword(@Body() body: ResetPasswordDto, @I18n() i18n: I18nContext): Promise<ApiResponse> {
    const user = await this.userService.findOne({ email: body.email });

    if (!user) throw new HttpException(await i18n.t('message.userNotFound'), HttpStatus.NOT_FOUND);

    const userStatus = await this.userService.findOneStatus({ userId: user._id });

    if (!userStatus) throw new HttpException(await i18n.t('message.userNotFound'), HttpStatus.NOT_FOUND);

    if (
      userStatus.resetPassword &&
      userStatus.resetPassword.otp &&
      moment().utc().isAfter(moment(userStatus.resetPassword.initiatedAt).add(otpValidityInSeconds, 'seconds'))
    ) {
      await this.userService.updateOneStatus(
        { _id: userStatus._id },
        {
          $set: { 'resetPassword.status': channelVerificationStatusEnum.failed },
          $inc: { 'resetPassword.attemptCount': 1 },
        },
      );
      throw new HttpException(await i18n.t('message.otpMismatch'), HttpStatus.FORBIDDEN);
    }
    if (userStatus.resetPassword.otp && userStatus.resetPassword.otp !== body.otp)
      throw new HttpException(await i18n.t('message.otpMismatch'), HttpStatus.FORBIDDEN);

    if (userStatus.resetPassword.otp === body.otp)
      await Promise.all([
        this.userService.updateOneStatus(
          { _id: userStatus._id },
          {
            resetPassword: {
              otp: null,
              verifiedAt: moment().utc().toDate(),
              status: channelVerificationStatusEnum.completed,
              attemptCount: userStatus.emailVerification.attemptCount,
            },
          },
        ),
        this.userService.updateOne({ _id: userStatus.userId }, { $set: { password: body.password } }),
      ]);
    return {
      statusCode: HttpStatus.OK,
      message: await i18n.t('message.success'),
    };
  }
}
