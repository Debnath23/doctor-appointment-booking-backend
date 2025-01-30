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
  readonly appointmentType: string;

  @ApiProperty({ required: true })
  @IsString()
  readonly name: string;

  @ApiProperty({ required: true })
  @IsString()
  readonly email: string;

  @ApiProperty({ required: true })
  @IsString()
  readonly phoneNumber: string;

  @ApiProperty({ required: true })
  @IsString()
  readonly age: string;

  @ApiProperty({ required: true })
  @IsString()
  readonly bloodGroup: string;

  @ApiProperty({ required: true })
  @IsString()
  readonly amountToPay: string;
}
