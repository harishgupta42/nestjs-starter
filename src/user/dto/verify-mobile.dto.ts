import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { deviceTypeEnum } from '../../constants/app.constants';

export class VerifyMobileDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  countryCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mobileNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  otp: number;

  @ApiProperty({ enum: deviceTypeEnum })
  @IsEnum(deviceTypeEnum)
  @IsNotEmpty()
  deviceType: deviceTypeEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  deviceToken: string;
}
