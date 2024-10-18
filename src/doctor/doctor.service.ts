import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LoginDto } from 'src/dto/login.dto';
import { DoctorEntity } from 'src/entities/doctor.entity';
import { UserEntity } from 'src/entities/user.entity';

@Injectable()
export class DoctorService {
  constructor(
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
    @InjectModel(DoctorEntity.name) private doctorModel: Model<DoctorEntity>,
  ) {}

  async generateAccessAndRefreshTokens(userId: Types.ObjectId) {
    try {
      const user = await this.doctorModel.findById(userId);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      return { accessToken, refreshToken };
    } catch (error) {
      throw new InternalServerErrorException(
        'Something went wrong while generating refresh and access token',
      );
    }
  }

  async loginDoctor(loginDto: LoginDto) {
    try {
      const doctor = await this.doctorModel
        .findOne({ email: loginDto.email })
        .select('+password');

      if (!doctor) {
        throw new NotFoundException('Doctor does not exist');
      }

      const isPasswordValid = await doctor.isPasswordCorrect(loginDto.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid doctor credentials');
      }

      const { accessToken, refreshToken } =
        await this.generateAccessAndRefreshTokens(doctor._id);

      const loggedInDoctor = await this.doctorModel
        .findById(doctor._id)
        .select(
          '-password -refreshToken -appointments -profileImg -degree -speciality -experience -about -fees -createdAt -updatedAt -__v',
        );

      return {
        doctor: loggedInDoctor,
        accessToken,
        refreshToken,
        message: 'Doctor logged In Successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  async doctorDetails(doctorId: Types.ObjectId) {
    try {
      const doctor = await this.doctorModel
        .findById(doctorId)
        .select('-password -refreshToken -appointments');

      if (!doctor) {
        throw new NotFoundException('Doctor does not exist!');
      }

      return {
        user: doctor,
        message: 'Doctor details fetch Successfully!',
      };
    } catch (error) {
      console.error('Error getting user details:', error);
      throw new HttpException(
        'An error occurred while getting doctor details. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async doctorAppointmentDetails(doctorId: Types.ObjectId) {
    try {
      const doctor = await this.doctorModel.findById(doctorId);

      if (!doctor) {
        throw new NotFoundException('Doctor does not exist!');
      }

      const usersWithAppointments = await this.userModel.find(
        {
          _id: { $in: doctor.appointments },
          'appointments.doctorId': doctor._id,
        },
        'appointments',
      );

      const appointments = usersWithAppointments
        .map((user) => {
          return user.appointments.filter((appointment) =>
            appointment.doctorId.equals(doctorId),
          );
        })
        .flat();

      return {
        appointments,
        message: 'Appointment details fetched successfully!',
      };
    } catch (error) {
      console.error('Error getting Appointment details:', error);
      throw new HttpException(
        'An error occurred while getting Appointment details. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
