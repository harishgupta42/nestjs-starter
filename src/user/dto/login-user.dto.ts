import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { deviceTypeEnum } from '../../constants/app.constants';

export class LoginUserDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  countryCode?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  mobileNumber?: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  email: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  password?: string;

  @ApiProperty({ enum: deviceTypeEnum })
  @IsEnum(deviceTypeEnum)
  @IsNotEmpty()
  deviceType: deviceTypeEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  deviceToken: string;
}
