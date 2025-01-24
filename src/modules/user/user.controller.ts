import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BookAppointmentDto } from 'src/dto/bookAppointment.dto';
import { JwtAuthGuard } from 'src/guard/jwt.guard';
import { UserService } from './user.service';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { isValidObjectId, Types } from 'mongoose';
import { UpdateUserDto } from 'src/dto/updateUser.dto';

@Controller('user')
@ApiTags('Appointment Booking')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async userDetails(@Req() req: Request) {
    try {
      if (!req.user) {
        throw new NotFoundException('User not found!');
      }

      const userId = req.user._id;

      const response = await this.userService.userDetails(userId);

      return response;
    } catch (error) {
      throw error;
    }
  }

  @Post('book-appointment')
  @UseGuards(JwtAuthGuard)
  async bookAppointment(
    @Body() bookAppointmentDto: BookAppointmentDto,
    @Req() req: Request,
  ) {
    try {
      if (!req.user) {
        throw new NotFoundException('User not found!');
      }

      const userId = req.user._id;

      const appointmentDateUTC = new Date(bookAppointmentDto.appointmentDate);
      if (isNaN(appointmentDateUTC.getTime())) {
        throw new BadRequestException('Invalid booking date format.');
      }

      return await this.userService.bookAppointment(
        {
          ...bookAppointmentDto,
          appointmentDate: appointmentDateUTC,
        },
        userId,
      );
    } catch (error) {
      throw error;
    }
  }

  @Get('appointment-details')
  @UseGuards(JwtAuthGuard)
  async userAppointmentDetails(
    @Req() req: Request,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    try {
      const limitVal = limit ? parseInt(limit.toString(), 10) : 10;
      const offsetVal = offset ? parseInt(offset.toString(), 10) : 0;

      if (!req.user) {
        throw new NotFoundException('User not found!');
      }

      const userId = req.user._id;

      return await this.userService.userAppointmentDetails(
        userId,
        limitVal,
        offsetVal,
      );
    } catch (error) {
      throw error;
    }
  }

  @Delete('cancel-appointment')
  @UseGuards(JwtAuthGuard)
  async cancelAppointment(
    @Query('appointment_id') appointment_id: string,
    @Query('doctor_id') doctor_id: string,
    @Req() req: Request,
  ) {
    try {
      if (!req.user) {
        throw new NotFoundException('User not found!');
      }

      const userId = req.user._id as Types.ObjectId;

      if (!isValidObjectId(appointment_id) || !isValidObjectId(doctor_id)) {
        throw new BadRequestException(
          'Invalid appointment or doctor ID format.',
        );
      }

      const appointmentObjId = new Types.ObjectId(appointment_id);
      const doctorObjId = new Types.ObjectId(doctor_id);

      return await this.userService.cancelAppointmentService(
        appointmentObjId,
        doctorObjId,
        userId,
      );
    } catch (error) {
      throw error;
    }
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  async updateUserDetails(
    @Body() updateUserDetails: UpdateUserDto,
    @Req() req: Request,
  ) {
    try {
      if (!req.user) {
        throw new NotFoundException('User not found!');
      }

      const userId = req.user._id;

      return await this.userService.updateUserDetailsService(
        updateUserDetails,
        userId,
      );
    } catch (error) {
      throw error;
    }
  }
}
