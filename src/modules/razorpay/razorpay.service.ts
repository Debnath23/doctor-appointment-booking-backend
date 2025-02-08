import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppointmentEntity } from 'src/entities/appointment.entity';
import { UserEntity } from 'src/entities/user.entity';
import { instanceOfRazorpay } from 'src/utils/instance';
import { validatePaymentVerification } from 'razorpay/dist/utils/razorpay-utils';
import { EmailHandler } from 'src/utils/emailHandler';

@Injectable()
export class RazorpayService {
  constructor(
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
    @InjectModel(AppointmentEntity.name)
    private appointmentModel: Model<AppointmentEntity>,
  ) {}

  async checkoutService(
    appointmentId: Types.ObjectId,
    amountToPay: string,
    userId: Types.ObjectId,
  ) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User does not exist!');
      }

      const appointment = await this.appointmentModel.findOne({
        _id: appointmentId,
      });

      if (!appointment) {
        throw new UnprocessableEntityException('Appointment not found!');
      }

      if (!user._id.equals(appointment.userId)) {
        throw new ForbiddenException(
          'You are not authorized to process this payment.',
        );
      }

      const amount = Number(amountToPay);
      if (!Number.isInteger(amount) || amount <= 0) {
        throw new UnprocessableEntityException('Invalid payment amount.');
      }

      const options = {
        amount: amount * 100,
        currency: 'INR',
        receipt: `${appointment._id}`,
      };

      let paymentOrder: any;
      try {
        paymentOrder = await instanceOfRazorpay.orders.create(options);
        if (!paymentOrder) {
          throw new Error('Failed to create Razorpay payment order.');
        }
      } catch (razorpayError) {
        throw new UnprocessableEntityException(
          'Failed to process the payment order.',
        );
      }

      await this.appointmentModel.findByIdAndUpdate(
        appointment._id,
        {
          paymentStatus: 'pending',
          payment_id: paymentOrder.id,
          secret_id: paymentOrder.id,
        },
        { new: true },
      );

      return {
        payment: paymentOrder,
        key: process.env.RAZORPAY_TEST_KEY_ID,
        message: 'Payment initiated successfully. Await confirmation.',
      };
    } catch (error) {
      console.error('Error during checkout:', error);
      throw new InternalServerErrorException(
        'An error occurred during checkout.',
      );
    }
  }

  async verifyPaymentService(
    appointmentId: Types.ObjectId,
    userId: Types.ObjectId,
    razorpaySignature: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
  ) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User does not exist.');
      }

      const appointment = await this.appointmentModel.findById(appointmentId);
      if (!appointment) {
        throw new UnprocessableEntityException(
          'Appointment does not exist for the selected date and time.',
        );
      }

      if (!user._id.equals(appointment.userId)) {
        throw new ForbiddenException(
          'Payment verification is not allowed for this user.',
        );
      }

      const isSignatureValid = validatePaymentVerification(
        { order_id: razorpayOrderId, payment_id: razorpayPaymentId },
        razorpaySignature,
        process.env.RAZORPAY_TEST_KEY_SECRET,
      );

      if (!isSignatureValid) {
        throw new UnprocessableEntityException(
          'Invalid payment signature verification.',
        );
      }

      await EmailHandler(
        user.email,
        'Payment Successful! - Bookify',
        appointment,
      );

      await this.appointmentModel.findByIdAndUpdate(
        appointmentId,
        {
          signature: razorpaySignature,
          paymentId: razorpayPaymentId,
          orderId: razorpayOrderId,
          paymentStatus: 'completed',
          paymentType: 'Online',
        },
        { new: true },
      );

      return {
        message: 'Payment verified successfully!',
      };
    } catch (error) {
      throw new Error(
        error.message || 'An error occurred while verifying payment.',
      );
    }
  }
}
