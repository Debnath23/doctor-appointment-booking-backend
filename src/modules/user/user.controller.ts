import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
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
@ApiTags('User')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async userDetails(@Req() req: Request) {
    const userId = this.getUserId(req);
    return this.userService.userDetails(userId);
  }

  @Post('book-appointment')
  @UseGuards(JwtAuthGuard)
  async bookAppointment(
    @Body() bookAppointmentDto: BookAppointmentDto,
    @Req() req: Request,
  ) {
    const userId = this.getUserId(req);

    const appointmentDateUTC = new Date(bookAppointmentDto.appointmentDate);
    if (isNaN(appointmentDateUTC.getTime())) {
      throw new BadRequestException('Invalid booking date format.');
    }

    return this.userService.bookAppointment(
      { ...bookAppointmentDto, appointmentDate: appointmentDateUTC },
      userId,
    );
  }

  @Get('appointments-details')
  @UseGuards(JwtAuthGuard)
  async userAppointmentsDetails(
    @Req() req: Request,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const userId = this.getUserId(req);
    return this.userService.userAppointmentsDetails(
      userId,
      Number(limit) || 10,
      Number(offset) || 0,
    );
  }

  @Get('appointment-details/:appointment_id')
  @UseGuards(JwtAuthGuard)
  async userAppointmentDetails(
    @Param('appointment_id') appointment_id: string,
    @Req() req: Request,
  ) {
    const userId = this.getUserId(req);
    const appointmentObjId = this.validateObjectId(
      appointment_id,
      'Invalid appointment ID format.',
    );
    return this.userService.userAppointmentDetailsService(
      appointmentObjId,
      userId,
    );
  }

  @Delete('cancel-appointment')
  @UseGuards(JwtAuthGuard)
  async cancelAppointment(
    @Query('appointment_id') appointment_id: string,
    @Req() req: Request,
  ) {
    const userId = this.getUserId(req);
    const appointmentObjId = this.validateObjectId(
      appointment_id,
      'Invalid appointment ID format.',
    );
    return this.userService.cancelAppointmentService(appointmentObjId, userId);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  async updateUserDetails(
    @Body() updateUserDetails: UpdateUserDto,
    @Req() req: Request,
  ) {
    const userId = this.getUserId(req);
    return this.userService.updateUserDetailsService(updateUserDetails, userId);
  }

  private getUserId(req: Request): Types.ObjectId {
    if (!req.user) throw new NotFoundException('User not found!');
    return req.user._id as Types.ObjectId;
  }

  private validateObjectId(id: string, errorMessage: string): Types.ObjectId {
    if (!isValidObjectId(id)) throw new BadRequestException(errorMessage);
    return new Types.ObjectId(id);
  }
}
