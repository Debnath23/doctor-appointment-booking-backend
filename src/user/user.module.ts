import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserEntity, UserEntitySchema } from 'src/entities/user.entity';
import { DoctorEntity, DoctorEntitySchema } from 'src/entities/doctor.entity';
import { AppointmentEntity, AppointmentEntitySchema } from 'src/entities/appointment.entity';
import { JwtAuthGuard } from 'src/guard/jwt.guard';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserEntity.name, schema: UserEntitySchema },
      { name: DoctorEntity.name, schema: DoctorEntitySchema },
      { name: AppointmentEntity.name, schema: AppointmentEntitySchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, JwtAuthGuard],
})
export class UserModule {}
