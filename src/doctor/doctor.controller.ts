import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
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
import { isValidObjectId, Types } from 'mongoose';

@Controller('doctor')
@ApiTags('Doctor')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post('login')
  @UseInterceptors(SetCookiesInterceptor)
  async login(@Body() loginDto: LoginDto) {
    try {
      if (!loginDto) {
        throw new BadRequestException('All fields are required');
      }

      return await this.doctorService.loginDoctor(loginDto);
    } catch (error: any) {
      throw error;
    }
  }

  @Get('all-doctors-details')
  async allDoctors(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    try {
      const limitVal = limit ? parseInt(limit.toString(), 10) : 10;
      const offsetVal = offset ? parseInt(offset.toString(), 10) : 0;

      return await this.doctorService.allDoctors(limitVal, offsetVal);
    } catch (error) {
      throw error;
    }
  }

  @Get('/:docId')
  async doctorDetails(@Param('docId') docId: number) {
    try {
      return await this.doctorService.doctorDetails(docId);
    } catch (error) {
      throw error;
    }
  }

  @Get('/search')
  async searchDoctor(@Query('query') query: string) {
    try {
      return await this.doctorService.searchDoctor(query);
    } catch (error) {
      throw error;
    }
  }

  @Get('appointment-details')
  @UseGuards(JwtAuthGuard)
  async doctorAppointmentDetails(@Req() req: Request) {
    try {
      if (!req.user || !req.user._id) {
        throw new NotFoundException('Doctor not found!');
      }

      const docId = req.user._id as Types.ObjectId;

      return await this.doctorService.doctorAppointmentDetailsService(docId);
    } catch (error) {
      throw error;
    }
  }

  @Delete('cancel-appointment')
  @UseGuards(JwtAuthGuard)
  async cancelAppointment(
    @Query('appointment_id') appointment_id: string,
    @Query('user_id') user_id: string,
    @Req() req: Request,
  ) {
    try {
      if (!req.user) {
        throw new NotFoundException('Doctor not found!');
      }

      const docId = req.user._id as Types.ObjectId;

      if (!isValidObjectId(appointment_id) || !isValidObjectId(user_id)) {
        throw new BadRequestException(
          'Invalid appointment or doctor ID format.',
        );
      }

      const appointmentObjId = new Types.ObjectId(appointment_id);
      const userObjId = new Types.ObjectId(user_id);

      return await this.doctorService.cancelAppointmentService(
        appointmentObjId,
        userObjId,
        docId,
      );
    } catch (error) {
      throw error;
    }
  }
}
