import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly phone: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly address: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly gender: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly dob: string;
}
