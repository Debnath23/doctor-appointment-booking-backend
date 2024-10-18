import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BookAppointmentDto } from 'src/dto/bookAppointment.dto';
import { DoctorEntity } from 'src/entities/doctor.entity';
import { UserEntity } from 'src/entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
    @InjectModel(DoctorEntity.name) private doctorModel: Model<DoctorEntity>,
  ) {}

  async bookAppointment(
    bookAppointmentDto: BookAppointmentDto,
    userId: Types.ObjectId,
  ) {
    try {
      const existingUser = await this.userModel.findById(userId);
      if (!existingUser) {
        throw new NotFoundException('User does not exist!');
      }

      const existingAppointment = await this.userModel.findOne({
        _id: userId,
        'appointments.doctorId': bookAppointmentDto.doctorId,
        'appointments.appointmentDate': bookAppointmentDto.appointmentDate,
        'appointments.appointmentTime': bookAppointmentDto.appointmentTime,
      });

      if (existingAppointment) {
        throw new UnprocessableEntityException(
          'Appointment already exists for the selected date and time.',
        );
      }

      const newAppointment = {
        doctorId: bookAppointmentDto.doctorId,
        appointmentDate: bookAppointmentDto.appointmentDate,
        appointmentTime: bookAppointmentDto.appointmentTime,
      };

      existingUser.appointments.push(newAppointment);
      await existingUser.save();

      const doctor = await this.doctorModel.findById(
        bookAppointmentDto.doctorId,
      );
      if (!doctor) {
        throw new NotFoundException('Doctor does not exist!');
      }

      doctor.appointments.push(existingUser._id);
      await doctor.save();

      return {
        appointment: newAppointment,
        message: 'Appointment booked successfully!',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while booking the appointment.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async userDetails(userId: Types.ObjectId) {
    try {
      const user = await this.userModel
        .findById(userId)
        .select('-password -refreshToken -appointments');

      if (!user) {
        throw new NotFoundException('User does not exist!');
      }

      return {
        user: user,
        message: 'User details fetch Successfully!',
      };
    } catch (error) {
      console.error('Error getting user details:', error);
      throw new HttpException(
        'An error occurred while getting user details. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async userAppointmentDetails(userId: Types.ObjectId) {
    try {
      const user = await this.userModel
        .findById(userId)
        // .select(
        //   '-_id -email -password -isActive -userType -createdAt -updatedAt -refreshToken -__v',
        // )
        .select('appointments')
        .lean()
        .exec();

      if (!user) {
        throw new NotFoundException('User does not exist!');
      }

      return {
        user,
        message: 'User details fetch Successfully!',
      };
    } catch (error) {
      console.error('Error getting user details:', error);
      throw new HttpException(
        'An error occurred while getting user details. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
