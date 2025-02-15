import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateDoctorDto } from 'src/dto/createDoctor.dto';
import { AppointmentEntity } from 'src/entities/appointment.entity';
import { DoctorEntity } from 'src/entities/doctor.entity';
import { UserEntity } from 'src/entities/user.entity';
import { uploadOnCloudinary } from 'src/utils/cloudinary';

const doctors = [
  {
    name: 'Dr. Rajesh Sharma',
    email: 'rajesh@gmail.com',
    profileImg:
      'https://images.pexels.com/photos/4769130/pexels-photo-4769130.jpeg',
    speciality: 'Cardiologist',
    degree: 'MBBS, MD',
    experience: '10 Years',
    about:
      'Dr. Rajesh Sharma is a renowned cardiologist specializing in heart diseases, preventive cardiology, and cardiac rehabilitation.',
    fees: 500,
    password: 'rajesh@1234',
    address: {
      line1: '12th Avenue, Salt Lake',
      line2: 'Kolkata, West Bengal',
    },
  },
  {
    name: 'Dr. Priya Sinha',
    email: 'priya@gmail.com',
    profileImg:
      'https://images.pexels.com/photos/8376277/pexels-photo-8376277.jpeg',
    speciality: 'Neurologist',
    degree: 'MBBS, DM',
    experience: '8 Years',
    about:
      'Dr. Priya Sinha is an experienced neurologist specializing in brain disorders, stroke management, and neurotherapy.',
    fees: 200,
    password: 'priya@1234',
    address: {
      line1: 'Park Street, Central Kolkata',
      line2: 'Kolkata, West Bengal',
    },
  },
  {
    name: 'Dr. Anirban Das',
    email: 'anirban@gmail.com',
    profileImg:
      'https://images.pexels.com/photos/4769130/pexels-photo-4769130.jpeg',
    speciality: 'Orthopedic Surgeon',
    degree: 'MBBS, MS',
    experience: '7 Years',
    about:
      'Dr. Anirban Das specializes in joint replacement, sports injuries, and orthopedic trauma management.',
    fees: 250,
    password: 'anirban@1234',
    address: {
      line1: 'Ballygunge Circular Road',
      line2: 'Kolkata, West Bengal',
    },
  },
  {
    name: 'Dr. Sneha Chatterjee',
    email: 'sneha@gmail.com',
    profileImg:
      'https://images.pexels.com/photos/5407206/pexels-photo-5407206.jpeg',
    speciality: 'Gynecologist',
    degree: 'MBBS, MS',
    experience: '6 Years',
    about:
      "Dr. Sneha Chatterjee is an expert in women's reproductive health, pregnancy care, and infertility treatments.",
    fees: 300,
    password: 'sneha@1234',
    address: {
      line1: 'Sector V, Salt Lake',
      line2: 'Kolkata, West Bengal',
    },
  },
  {
    name: 'Dr. Amit Ghosh',
    email: 'amit@gmail.com',
    profileImg:
      'https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg',
    speciality: 'Pediatrician',
    degree: 'MBBS, MD',
    experience: '5 Years',
    about:
      'Dr. Amit Ghosh provides expert medical care for infants, children, and adolescents, including vaccination and growth monitoring.',
    fees: 400,
    password: 'amit@1234',
    address: {
      line1: 'Jadavpur, South Kolkata',
      line2: 'Kolkata, West Bengal',
    },
  },
];

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(DoctorEntity.name) private doctorModel: Model<DoctorEntity>,
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
    @InjectModel(AppointmentEntity.name)
    private appointmentModel: Model<AppointmentEntity>,
  ) {}

  async createDoctorAccount(createDoctorDto: CreateDoctorDto) {
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
  }

  async getUsersDetailsService(limitVal: number, offsetVal: number) {
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
  }

  async userAppointmentDetailsService(
    userId: string,
    limitVal: number,
    offsetVal: number,
  ) {
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
  }

  async getdoctorsDetailsService(limitVal: number, offsetVal: number) {
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
  }

  async doctorAppointmentDetailsService(
    doctorId: string,
    limitVal: number,
    offsetVal: number,
  ) {
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
  }

  async dataSeeding() {
    await this.doctorModel.insertMany(doctors);
    return { message: 'Doctors data inserted successfully!' };
  }
}
