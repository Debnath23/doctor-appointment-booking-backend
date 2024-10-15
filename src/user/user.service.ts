import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BookAppointmentDto } from 'src/dto/bookAppointment.dto';
import { AppointmentEntity } from 'src/entities/appointment.entity';
import { DoctorEntity } from 'src/entities/doctor.entity';
import { UserEntity } from 'src/entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
    @InjectModel(DoctorEntity.name) private doctorModel: Model<DoctorEntity>,
    @InjectModel(AppointmentEntity.name) private appointmentModel: Model<AppointmentEntity>,
  ) {}

  async bookAppointment(bookAppointmentDto: BookAppointmentDto, userId: Types.ObjectId) {
    try {
      const existingUser = await this.userModel.findById(userId);

      if (!existingUser) {
        throw new NotFoundException('User does not exist!');
      }

      existingUser.appointments.findOne({
        
      })

      
      const appointmentIds = userEntity.appointments as Types.ObjectId[];
      const existingAppointment = await this.userModel.find({ _id: { $in: appointmentIds } });












    }
    catch(error){}
  }
}
