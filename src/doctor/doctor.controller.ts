import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DoctorService } from './doctor.service';
import { JwtAuthGuard } from 'src/guard/jwt.guard';
import { Request } from 'express';
import { SetCookiesInterceptor } from 'src/interceptor/set-cookies.interceptor';
import { LoginDto } from 'src/dto/login.dto';
import { ApiError } from 'src/utils/ApiError';

@Controller('doctor')
@ApiTags('Doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post('login')
  @UseInterceptors(SetCookiesInterceptor)
  async login(@Body() loginDto: LoginDto) {
    try {
      if (!loginDto) {
        throw new ApiError(400, 'All fields are required');
      }

      return await this.doctorService.loginDoctor(loginDto);
    } catch (error: any) {
      console.error('Error during doctor login:', error);

      throw new InternalServerErrorException(
        'Something went wrong while logging in the doctor.',
      );
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async doctorDetails(@Req() req: Request) {
    try {
      if (!req.user) {
        throw new NotFoundException('Doctor is not found!');
      }

      const doctorId = req.user._id;

      const response = await this.doctorService.doctorDetails(doctorId);

      return response;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        'Something went wrong while fetching doctor details.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('appointment-details')
  @UseGuards(JwtAuthGuard)
  async doctorAppointmentDetails(@Req() req: Request) {
    try {
      if (!req.user) {
        throw new NotFoundException('Doctor is not found!');
      }

      const doctorId = req.user._id;

      const response =
        await this.doctorService.doctorAppointmentDetails(doctorId);

      return response;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        'Something went wrong while fetching doctor details.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
