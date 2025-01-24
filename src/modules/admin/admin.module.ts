import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DoctorEntity, DoctorEntitySchema } from 'src/entities/doctor.entity';
import { AdminGuard } from 'src/guard/admin.guard';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from 'src/guard/jwt.guard';
import { UserEntity, UserEntitySchema } from 'src/entities/user.entity';
import { AppointmentEntity, AppointmentEntitySchema } from 'src/entities/appointment.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DoctorEntity.name, schema: DoctorEntitySchema },
      { name: UserEntity.name, schema: UserEntitySchema },
      { name: AppointmentEntity.name, schema: AppointmentEntitySchema },
    ]),
    JwtModule.register({
      secret: process.env.ACCESS_TOKEN_SECRET,
      signOptions: { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard, JwtAuthGuard],
})
export class AdminModule {}
