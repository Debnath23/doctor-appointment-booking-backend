import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateDoctorDto } from 'src/dto/createDoctor.dto';
import { AppointmentEntity } from 'src/entities/appointment.entity';
import { DoctorEntity } from 'src/entities/doctor.entity';
import { UserEntity } from 'src/entities/user.entity';
import { uploadOnCloudinary } from 'src/utils/cloudinary';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(DoctorEntity.name) private doctorModel: Model<DoctorEntity>,
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
    @InjectModel(AppointmentEntity.name)
    private appointmentModel: Model<AppointmentEntity>,
  ) {}

  async createDoctorAccount(createDoctorDto: CreateDoctorDto) {
    try {
      const existedDoctor = await this.doctorModel.findOne({
        $or: [{ name: createDoctorDto.name }, { email: createDoctorDto.email }],
      });

      if (existedDoctor) {
        throw new ConflictException('Username or Email is already taken');
      }

      const profileImgLocalPath = createDoctorDto.profileImg;
      if (!profileImgLocalPath) {
        throw new HttpException(
          'profileImg file is required.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      const profileImg = await uploadOnCloudinary(profileImgLocalPath);
      if (!profileImg) {
        throw new HttpException(
          'Failed to upload profileImg.',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const doctor = new this.doctorModel({
        ...createDoctorDto,
        profileImg: profileImg.url,
      });

      await doctor.save();

      const createdDoctor = await this.doctorModel
        .findById(doctor._id)
        .select('-password -refreshToken');

      return {
        doctor: createdDoctor,
        message: 'Doctor registered successfully',
      };
    } catch (error: any) {
      throw error;
    }
  }

  async getUsersDetailsService(limitVal: number, offsetVal: number) {
    try {
      const totalCount = await this.userModel.countDocuments().exec();

      const users = await this.userModel
        .find()
        .select('-appointments -refreshToken')
        .limit(limitVal)
        .skip(offsetVal)
        .exec();

      if (!users || users.length === 0) {
        throw new NotFoundException('No users found!');
      }

      return {
        users,
        totalCount,
        limitVal,
        offsetVal,
        message: 'List of users data fetch successfully!',
      };
    } catch (error: any) {
      throw error;
    }
  }

  async userAppointmentDetailsService(
    userId: string,
    limitVal: number,
    offsetVal: number,
  ) {
    try {
      const user = await this.userModel.findById(userId);

      if (!user) {
        throw new NotFoundException('User does not exist!');
      }

      const totalCount = await this.appointmentModel
        .countDocuments({ userId: user._id })
        .exec();

      const appointments = await this.appointmentModel
        .find({ userId: user._id })
        .populate('doctorId', 'name speciality profileImg')
        .limit(limitVal)
        .skip(offsetVal)
        .sort({ appointmentDate: -1 })
        .exec();

      if (!appointments || appointments.length === 0) {
        throw new NotFoundException('No appointments found!');
      }

      return {
        appointments,
        totalCount,
        limitVal,
        offsetVal,
        message: 'Appointment details fetched successfully!',
      };
    } catch (error) {
      throw error;
    }
  }

  async getdoctorsDetailsService(limitVal: number, offsetVal: number) {
    try {
      const totalCount = await this.doctorModel.countDocuments().exec();

      const doctors = await this.doctorModel
        .find()
        .select('-appointments -refreshToken')
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
    } catch (error: any) {
      throw error;
    }
  }

  async doctorAppointmentDetailsService(
    doctorId: string,
    limitVal: number,
    offsetVal: number,
  ) {
    try {
      const doctor = await this.doctorModel.findById(doctorId).exec();
      if (!doctor) {
        throw new NotFoundException('Doctor does not exist!');
      }

      const totalCount = await this.appointmentModel
        .countDocuments({ doctorId })
        .exec();

      const appointments = await this.appointmentModel
        .find({ doctorId })
        .populate('userId', 'name email phone gender')
        .limit(limitVal)
        .skip(offsetVal)
        .sort({ appointmentDate: -1 })
        .lean()
        .exec();

      return {
        appointments,
        totalCount,
        limit: limitVal,
        offset: offsetVal,
        message:
          appointments.length > 0
            ? 'Appointment details fetched successfully!'
            : 'No appointments found.',
      };
    } catch (error) {
      throw new error;
    }
  }
}
