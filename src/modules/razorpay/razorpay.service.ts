import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppointmentEntity } from 'src/entities/appointment.entity';
import { UserEntity } from 'src/entities/user.entity';
import { instanceOfRazorpay } from 'src/main';

@Injectable()
export class RazorpayService {
  constructor(
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
    @InjectModel(AppointmentEntity.name)
    private appointmentModel: Model<AppointmentEntity>,
  ) {}

  async checkoutService(userId: Types.ObjectId, appointmentId: Types.ObjectId) {
    try {
      // Fetch User and validate existence
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User does not exist!');
      }

      // Fetch Appointment and validate existence
      const appointment = await this.appointmentModel.findById(appointmentId);
      if (!appointment) {
        throw new UnprocessableEntityException(
          'Appointment does not exist for the selected date and time.',
        );
      }

      // Check if the user is authorized to make the payment
      if (!user._id.equals(appointment.userId)) {
        throw new ForbiddenException(
          'Sorry, this payment process is forbidden for you.',
        );
      }

      // Proceed only if payment type is 'online'
      if (appointment.paymentType !== 'online') {
        throw new UnprocessableEntityException('Invalid payment type.');
      }

      // Prepare payment options
      const options = {
        amount: appointment.amountToPay,
        currency: 'INR',
        receipt: `payment_receiptId_${appointment._id}`,
      };

      // Create Razorpay order
      const payment = await instanceOfRazorpay.orders.create(options);
      if (!payment) {
        throw new Error('Failed to create payment order.');
      }

      // Update appointment payment details
      await this.appointmentModel.findByIdAndUpdate(appointment._id, {
        paymentStatus: 'completed',
        payment_id: payment.id,
        secret_id: payment.id,
      });

      return { message: 'Payment completed successfully!' };
    } catch (error) {
      throw new Error(error.message || 'An error occurred during checkout.');
    }
  }
}
