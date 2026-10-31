import { IsEmail, IsMobilePhone, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class ValidateAdminDTO {
  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  countryCode: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @IsMobilePhone()
  mobileNumber: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  email: string;
}
