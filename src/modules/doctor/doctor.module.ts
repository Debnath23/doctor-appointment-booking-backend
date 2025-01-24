import { Module } from '@nestjs/common';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { JwtAuthGuard } from 'src/guard/jwt.guard';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { envOptions } from 'src/config/envOptions';
import { MongooseModule } from '@nestjs/mongoose';
import { UserEntity, UserEntitySchema } from 'src/entities/user.entity';
import { DoctorEntity, DoctorEntitySchema } from 'src/entities/doctor.entity';
import { AppointmentEntity, AppointmentEntitySchema } from 'src/entities/appointment.entity';

@Module({
  imports: [
    ConfigModule.forRoot(envOptions),
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
  controllers: [DoctorController],
  providers: [DoctorService, JwtAuthGuard, JwtService],
  exports: [JwtService],
})
export class DoctorModule {}
