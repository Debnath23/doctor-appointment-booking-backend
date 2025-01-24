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
import { instanceOfRazorpay } from 'src/utils/instance';
import nodemailer from 'nodemailer';

@Injectable()
export class RazorpayService {
  constructor(
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
    @InjectModel(AppointmentEntity.name)
    private appointmentModel: Model<AppointmentEntity>,
  ) {}

  async checkoutService(userId: Types.ObjectId, appointmentId: Types.ObjectId) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        console.error('User not found!');
        throw new NotFoundException('User does not exist!');
      }

      const appointment = await this.appointmentModel.findById(appointmentId);
      if (!appointment) {
        throw new UnprocessableEntityException(
          'Appointment does not exist for the selected date and time.',
        );
      }

      if (!user._id.equals(appointment.userId)) {
        throw new ForbiddenException(
          'Sorry, this payment process is forbidden for you.',
        );
      }

      if (appointment.paymentType !== 'online') {
        console.error('Invalid payment type!');
        throw new UnprocessableEntityException('Invalid payment type.');
      }

      const options = {
        amount: Number(appointment.amountToPay),
        currency: 'INR',
        receipt: `${appointment._id}`,
      };

      if (!Number.isInteger(options.amount) || options.amount <= 0) {
        throw new UnprocessableEntityException('Invalid payment amount.');
      }

      let payment: any;
      try {
        payment = await instanceOfRazorpay.orders.create(options);
        if (!payment) {
          throw new Error('Failed to create payment order.');
        }
      } catch (razorpayError) {
        throw new Error(
          razorpayError.message ||
            JSON.stringify(razorpayError) ||
            'Failed to create payment order.',
        );
      }

      await this.appointmentModel.findByIdAndUpdate(appointment._id, {
        paymentStatus: 'completed',
        payment_id: payment.id,
        secret_id: payment.id,
      });

      if (payment) {
        const transporter = nodemailer.createTransport({
          host: 'live.smtp.mailtrap.io',
          port: 587,
          auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASS,
          },
        });

        await transporter.sendMail({
          from: '"Bookify" <noreply@demomailtrap.com>',
          to: user.email,
          subject: 'Payment Confirmation - Bookify',
          text: `
Payment Completed Successfully!

Appointment Details:
Appointment Date : ${appointment.appointmentDate.toLocaleDateString()}
Appointment Time : ${appointment.appointmentTime}

Thank you for choosing Bookify!
          `.trim(),
        });
      }

      return { message: 'Payment completed successfully!' };
    } catch (error) {
      throw new Error(
        error.message ||
          JSON.stringify(error) ||
          'An error occurred during checkout.',
      );
    }
  }
}
