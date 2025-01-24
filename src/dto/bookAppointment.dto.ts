import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Types } from 'mongoose';

export class BookAppointmentDto {
  @ApiProperty({ required: true })
  @IsString()
  readonly doctorId: Types.ObjectId;

  @ApiProperty({ required: true })
  readonly appointmentDate: Date;

  @ApiProperty({ required: true })
  @IsString()
  readonly appointmentTime: string;

  @ApiProperty({ required: true })
  @IsString()
  readonly amountToPay: string;

  @ApiProperty({ required: true })
  @IsString()
  readonly paymentType: string;
}
