import { IsNotEmpty } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class VerifyChannelDto {
  @ApiProperty()
  @IsNotEmpty()
  otp: number;
}
