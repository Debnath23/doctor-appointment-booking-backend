import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateDoctorDto } from 'src/dto/createDoctor.dto';
import { DoctorEntity } from 'src/entities/doctor.entity';
import { uploadOnCloudinary } from 'src/utils/cloudinary';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(DoctorEntity.name) private doctorModel: Model<DoctorEntity>,
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
      console.error('Error creating doctor:', error);

      if (error instanceof ConflictException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Something went wrong while registering the doctor',
      );
    }
  }
}
