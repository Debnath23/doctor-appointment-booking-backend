import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BookAppointmentDto } from 'src/dto/bookAppointment.dto';
import { JwtAuthGuard } from 'src/guard/jwt.guard';
import { UserService } from './user.service';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

@Controller('user')
@ApiTags('Appointment Booking')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async userDetails(
    @Req() req: Request,
  ) {
    try {
      if (!req.user) {
        throw new NotFoundException('User not found!');
      }

      const userId = req.user._id;

      const response = await this.userService.userDetails(
        userId
      );

      return response;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        'Something went wrong while fetching user details.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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

      const response = await this.userService.bookAppointment(
        bookAppointmentDto,
        userId,
      );
      
      return response;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        'Something went wrong while booking an appointment',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('appointment-details')
  @UseGuards(JwtAuthGuard)
  async userAppointmentDetails(
    @Req() req: Request,
  ) {
    try {
      if (!req.user) {
        throw new NotFoundException('User not found!');
      }

      const userId = req.user._id;

      const response = await this.userService.userAppointmentDetails(
        userId
      );

      return response;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        'Something went wrong while fetching user appointment details.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
