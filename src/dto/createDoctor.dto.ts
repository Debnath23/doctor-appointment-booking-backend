import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class CreateDoctorDto {
  @ApiProperty({ required: true })
  @IsString()
  readonly name: string;

  @ApiProperty({ required: true })
  @IsEmail()
  readonly email: string;

  @ApiProperty({ required: true })
  @IsString()
  profileImg: string;

  @ApiProperty({ required: true })
  @IsString()
  readonly degree: string;

  @ApiProperty({ required: true })
  @IsString()
  readonly speciality: string;

  @ApiProperty({ required: true })
  @IsString()
  readonly experience: string;

  @ApiProperty({ required: true })
  @IsString()
  readonly about: string;

  @ApiProperty({ required: true })
  @IsString()
  readonly fees: string;

  @ApiProperty({ required: true })
  @IsString()
  readonly password: string;
}
