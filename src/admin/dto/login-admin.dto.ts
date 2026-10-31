import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { deviceTypeEnum } from '../../constants/app.constants';

export class LoginAdminDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ enum: deviceTypeEnum })
  @IsEnum(deviceTypeEnum)
  @IsNotEmpty()
  deviceType: deviceTypeEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  deviceToken: string;
}
