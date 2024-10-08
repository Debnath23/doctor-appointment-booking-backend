import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ required: true })
  @IsString()
  readonly name: string;

  @ApiProperty({ required: true })
  @IsEmail()
  readonly email: string;

  @ApiProperty({ required: true })
  @IsString()
  readonly password: string;
}
