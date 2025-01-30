import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PaymentDto {
  @ApiProperty({ required: true })
  @IsString()
  readonly amountToPay: string;

  @ApiProperty({ required: true })
  @IsString()
  readonly appointmentId: string;
}
