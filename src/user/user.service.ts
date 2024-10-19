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
import { AppointmentEntity } from 'src/entities/appointment.entity';
import { DoctorEntity } from 'src/entities/doctor.entity';
import { UserEntity } from 'src/entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
    @InjectModel(DoctorEntity.name) private doctorModel: Model<DoctorEntity>,
    @InjectModel(AppointmentEntity.name)
    private appointmentModel: Model<AppointmentEntity>,
  ) {}

  async bookAppointment(
    bookAppointmentDto: BookAppointmentDto,
    userId: Types.ObjectId,
  ) {
    try {
      // Check if user exists
      const existingUser = await this.userModel.findById(userId);
      if (!existingUser) {
        throw new NotFoundException('User does not exist!');
      }

      // Check if doctor exists
      const existingDoctor = await this.doctorModel.findById(
        bookAppointmentDto.doctorId,
      );
      if (!existingDoctor) {
        throw new NotFoundException('Doctor does not exist!');
      }

      // Check if an appointment already exists for the same time slot
      const existingAppointment = await this.appointmentModel.findOne({
        userId: userId,
        doctorId: bookAppointmentDto.doctorId,
        appointmentDate: bookAppointmentDto.appointmentDate,
        appointmentTime: bookAppointmentDto.appointmentTime,
      });

      if (existingAppointment) {
        throw new UnprocessableEntityException(
          'Appointment already exists for the selected date and time.',
        );
      }

      // Create new appointment
      const appointment = new this.appointmentModel({
        userId: userId,
        doctorId: bookAppointmentDto.doctorId,
        appointmentDate: bookAppointmentDto.appointmentDate,
        appointmentTime: bookAppointmentDto.appointmentTime,
      });

      await appointment.save();

      // Push appointment to doctor and user appointments array
      existingDoctor.appointments.push(appointment._id);
      await existingDoctor.save();

      existingUser.appointments.push(appointment._id);
      await existingUser.save();

      return {
        appointment: appointment,
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
      const user = await this.userModel.findById(userId);

      if (!user) {
        throw new NotFoundException('User does not exist!');
      }

      const appointments = await this.appointmentModel
        .find({ userId: userId })
        .populate('doctorId', 'name speciality profileImg');

      if (!appointments || appointments.length === 0) {
        throw new NotFoundException('No appointments found!');
      }

      return {
        appointments,
        message: 'Appointment details fetched successfully!',
      };
    } catch (error) {
      console.error('Error getting appointment details:', error);
      throw new HttpException(
        'An error occurred while getting user details. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
