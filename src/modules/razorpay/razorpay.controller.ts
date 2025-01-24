import {
  Controller,
  NotFoundException,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RazorpayService } from './razorpay.service';
import { JwtAuthGuard } from 'src/guard/jwt.guard';
import { Request } from 'express';
import { Types } from 'mongoose';

@Controller('razorpay')
@ApiTags('Payment Gateway')
export class RazorpayController {
  constructor(private readonly razorpayService: RazorpayService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async userDetails(
    @Query('appointment_id') appointment_id: string,
    @Req() req: Request,
  ) {
    try {
      if (!req.user) {
        throw new NotFoundException('User not found!');
      }

      const userId = req.user._id;
      const appointmentObjId = new Types.ObjectId(appointment_id);

      const response = await this.razorpayService.checkoutService(
        userId,
        appointmentObjId,
      );

      return response;
    } catch (error) {
      throw new Error(
        error.message || 'An error occurred while fetching user details.',
      );
    }
  }
}
