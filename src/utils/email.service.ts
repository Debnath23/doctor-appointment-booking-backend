import { BadRequestException, Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_EMAIL_API_KEY;
    if (!apiKey) {
      throw new Error('Missing RESEND_EMAIL_API_KEY in .env file');
    }
    this.resend = new Resend(apiKey);
  }

  async sendEmail(email: string, subject: string, appointment: any) {
    try {
      await this.resend.emails.send({
        from: 'Bookify <onboarding@resend.dev>',
        to: [email],
        subject: subject,
        html: `<h1>Bookify</h1>
<p>Appointment Details:</p>
<p>Appointment Date : ${appointment.appointmentDate.toLocaleDateString()}</p>
<p>Appointment Time : ${appointment.appointmentTime}</p>
<p>Thank you for choosing Bookify!</p>`,
      });
    } catch (error) {
      throw error;
    }
  }

  async sendOtpEmail(email: string, otp: string) {
    try {
      await this.resend.emails.send({
        from: 'Bookify <onboarding@resend.dev>',
        to: [email],
        subject: 'Your Bookify OTP Code',
        html: `<h1>Bookify</h1>
<p>Your OTP Code: <strong>${otp}</strong></p>
<p>This OTP is valid for 10 minutes.</p>`,
      });
    } catch (error) {
      throw new BadRequestException('Failed to send OTP email.');
    }
  }
}
