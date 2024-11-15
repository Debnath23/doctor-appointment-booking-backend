import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { LoginDto } from 'src/dto/login.dto';
import { AppointmentEntity } from 'src/entities/appointment.entity';
import { DoctorEntity } from 'src/entities/doctor.entity';
import { UserEntity } from 'src/entities/user.entity';

@Injectable()
export class DoctorService {
  constructor(
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
    @InjectModel(DoctorEntity.name) private doctorModel: Model<DoctorEntity>,
    @InjectModel(AppointmentEntity.name)
    private appointmentModel: Model<AppointmentEntity>,
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

  async allDoctors(limitVal: number, offsetVal: number) {
    try {
      const totalCount = await this.doctorModel.countDocuments().exec();

      const doctors = await this.doctorModel
        .find()
        .select('-appointments')
        .limit(limitVal)
        .skip(offsetVal)
        .exec();

      if (!doctors || doctors.length === 0) {
        throw new NotFoundException('No doctors found!');
      }

      return {
        doctors,
        totalCount,
        limitVal,
        offsetVal,
        message: 'List of doctors data fetch successfully!',
      };
    } catch (error) {
      throw error;
    }
  }

  async doctorDetails(docId: number) {
    try {
      const doctor = await this.doctorModel
        .findById(docId)
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

  async searchDoctorByName(name: string) {
    try {
      let query: any;

      if (mongoose.Types.ObjectId.isValid(name)) {
        query = { _id: name };
      } else {
        query = { name: { $regex: name, $options: 'i' } };
      }
      const doctor = await this.doctorModel
        .findOne(query)
        .select('-password -refreshToken -appointments');

      if (!doctor) {
        throw new NotFoundException('Doctor does not exist!');
      }

      return {
        doctor,
        message: 'Doctor details fetched successfully!',
      };
    } catch (error) {
      console.error('Error getting doctor details:', error);
      throw new HttpException(
        'An error occurred while getting doctor details. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async doctorAppointmentDetailsService(docId: Types.ObjectId) {
    try {
      const doctor = await this.doctorModel.findById(docId);

      if (!doctor) {
        throw new NotFoundException('User does not exist!');
      }

      const appointments = await this.appointmentModel
        .find({ doctorId: doctor._id })
        .populate('userId', 'name phone gender dob')
        .sort({ appointmentDate: -1 });

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
        'An error occurred while getting doctor details. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async cancelAppointmentService(
    appointment_id: Types.ObjectId,
    doctor_id: Types.ObjectId,
    userId: Types.ObjectId,
  ) {
    try {
      const existingUser = await this.userModel.findById(userId);
      if (!existingUser) {
        throw new NotFoundException('User does not exist!');
      }

      const existingDoctor = await this.doctorModel.findById(doctor_id);
      if (!existingDoctor) {
        throw new NotFoundException('Doctor does not exist!');
      }

      const existingAppointment =
        await this.appointmentModel.findById(appointment_id);
      if (!existingAppointment) {
        throw new UnprocessableEntityException(
          'Appointment does not exist for the selected date and time.',
        );
      }

      await existingAppointment.deleteOne();

      await this.doctorModel.findByIdAndUpdate(existingDoctor._id, {
        $pull: { appointments: existingAppointment._id },
      });

      await this.userModel.findByIdAndUpdate(existingUser._id, {
        $pull: { appointments: existingAppointment._id },
      });

      return { message: 'Appointment deleted successfully!' };
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while deleting the appointment.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // async doctorAppointmentDetails(doctorId: Types.ObjectId) {
  //   try {
  //     const doctor = await this.doctorModel.findById(doctorId);

  //     if (!doctor) {
  //       throw new NotFoundException('Doctor does not exist!');
  //     }

  //     const usersWithAppointments = await this.userModel.find(
  //       {
  //         _id: { $in: doctor.appointments },
  //         'appointments.doctorId': doctor._id,
  //       },
  //       'appointments',
  //     );

  //     const appointments = usersWithAppointments
  //       .map((user) => {
  //         return user.appointments.filter((appointment) =>
  //           appointment.doctorId.equals(doctorId),
  //         );
  //       })
  //       .flat();

  //     return {
  //       appointments,
  //       message: 'Appointment details fetched successfully!',
  //     };
  //   } catch (error) {
  //     console.error('Error getting Appointment details:', error);
  //     throw new HttpException(
  //       'An error occurred while getting Appointment details. Please try again later.',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
}
