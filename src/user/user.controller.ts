import { Body, ConflictException, Controller, HttpException, HttpStatus, NotFoundException, Post, Req, UseGuards } from '@nestjs/common';
import { BookAppointmentDto } from 'src/dto/bookAppointment.dto';
import { JwtAuthGuard } from 'src/guard/jwt.guard';
import { UserService } from './user.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiResponse } from 'src/utils/ApiResponse';
import { Request } from 'express';

@Controller('user')
@ApiTags('Appointment Booking')
export class UserController {
    constructor(private readonly userService: UserService) {}

  @Post('book-appointment')
  @UseGuards(JwtAuthGuard)
  async bookAppointment(@Body() bookAppointmentDto: BookAppointmentDto, @Req() req: Request) {
    try {
        if (!req.user) {
            throw new NotFoundException('User not found!');
        }

        const userId = req.user._id;

        const result = await this.userService.bookAppointment(bookAppointmentDto, userId);
        return new ApiResponse(201, result.user, result.message);
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
}
