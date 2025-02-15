import {
  BadRequestException,
  Body,
  Controller,
  InternalServerErrorException,
  NotFoundException,
  Post,
  Query,
  Req,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RazorpayService } from './razorpay.service';
import { JwtAuthGuard } from 'src/guard/jwt.guard';
import { Request } from 'express';
import { Types } from 'mongoose';
import { PaymentDto } from 'src/dto/payment.dto';

@Controller('razorpay')
@ApiTags('Payment Gateway')
export class RazorpayController {
  constructor(private readonly razorpayService: RazorpayService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async userDetails(@Body() paymentDto: PaymentDto, @Req() req: Request) {
    if (!req.user) {
      throw new NotFoundException('User not found!');
    }

    if (!paymentDto) {
      throw new UnprocessableEntityException('Invalid payment details.');
    }

    if (!Types.ObjectId.isValid(paymentDto.appointmentId)) {
      throw new BadRequestException('Invalid Appointment ID format');
    }

    const userId = new Types.ObjectId(req.user._id);
    const appointmentObjId = new Types.ObjectId(paymentDto.appointmentId);
    const amountToPay = paymentDto.amountToPay;

    const response = await this.razorpayService.checkoutService(
      appointmentObjId,
      amountToPay,
      userId,
    );

    return response;
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(
    @Query('appointment_id') appointment_id: string,
    @Req() req: Request,
    @Body() body: any,
  ) {
    if (!req.user) {
      throw new NotFoundException('User not found!');
    }

    if (!appointment_id) {
      throw new UnprocessableEntityException('Appointment ID is required.');
    }

    if (!req.body) {
      throw new UnprocessableEntityException('Payment details are required.');
    }

    const userId = req.user._id;
    const appointmentObjId = new Types.ObjectId(appointment_id);

    const { razorpay_signature, razorpay_order_id, razorpay_payment_id } = body;

    const response = await this.razorpayService.verifyPaymentService(
      appointmentObjId,
      userId,
      razorpay_signature,
      razorpay_order_id,
      razorpay_payment_id,
    );

    return response;
  }
}
