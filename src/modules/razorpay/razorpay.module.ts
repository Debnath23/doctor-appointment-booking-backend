import { Module } from '@nestjs/common';
import { RazorpayController } from './razorpay.controller';
import { RazorpayService } from './razorpay.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserEntity, UserEntitySchema } from 'src/entities/user.entity';
import { DoctorEntity, DoctorEntitySchema } from 'src/entities/doctor.entity';
import { JwtAuthGuard } from 'src/guard/jwt.guard';
import { JwtModule } from '@nestjs/jwt';
import { JwtService } from '@nestjs/jwt';
import {
  AppointmentEntity,
  AppointmentEntitySchema,
} from 'src/entities/appointment.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserEntity.name, schema: UserEntitySchema },
      { name: DoctorEntity.name, schema: DoctorEntitySchema },
      { name: AppointmentEntity.name, schema: AppointmentEntitySchema },
    ]),
    JwtModule.register({
      secret: process.env.ACCESS_TOKEN_SECRET,
      signOptions: { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
    }),
  ],
  controllers: [RazorpayController],
  providers: [RazorpayService, JwtAuthGuard, JwtService],
  exports: [JwtService],
})
export class RazorpayModule {}
