import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BookAppointmentDto } from 'src/dto/bookAppointment.dto';
import { UpdateUserDto } from 'src/dto/updateUser.dto';
import { AppointmentEntity } from 'src/entities/appointment.entity';
import { DoctorEntity } from 'src/entities/doctor.entity';
import { UserEntity } from 'src/entities/user.entity';
import { EmailService } from 'src/utils/email.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
    @InjectModel(DoctorEntity.name) private doctorModel: Model<DoctorEntity>,
    @InjectModel(AppointmentEntity.name)
    private appointmentModel: Model<AppointmentEntity>,
    private readonly emailService: EmailService,
  ) {}

  async bookAppointment(
    bookAppointmentDto: BookAppointmentDto,
    userId: Types.ObjectId,
  ) {
    const {
      doctorId,
      appointmentDate,
      appointmentTime,
      amountToPay,
      name,
      email,
      phoneNumber,
      age,
      bloodGroup,
    } = bookAppointmentDto;

    const [existingUser, existingDoctor] = await Promise.all([
      this.userModel.findById(userId),
      this.doctorModel.findById(doctorId),
    ]);

    if (!existingUser) throw new NotFoundException('User does not exist!');
    if (!existingDoctor) throw new NotFoundException('Doctor does not exist!');

    const existingAppointment = await this.appointmentModel.findOne({
      userId,
      doctorId,
      appointmentDate,
      appointmentTime,
    });

    if (existingAppointment) {
      throw new UnprocessableEntityException(
        'Appointment already exists for the selected date and time.',
      );
    }

    const appointment = await this.appointmentModel.create({
      userId,
      doctorId,
      appointmentDate,
      appointmentTime,
      amountToPay,
      name,
      email,
      phoneNumber,
      age,
      bloodGroup,
    });

    await Promise.all([
      this.doctorModel.updateOne(
        { _id: doctorId },
        { $push: { appointments: appointment._id } },
      ),
      this.userModel.updateOne(
        { _id: userId },
        { $push: { appointments: appointment._id } },
      ),
    ]);

    await this.emailService.sendEmail(
      existingUser.email,
      'Appointment Successful! - Bookify',
      appointment,
    );

    return { appointment, message: 'Appointment booked successfully!' };
  }

  async userDetails(userId: Types.ObjectId) {
    const user = await this.userModel
      .findById(userId)
      .select('-password -refreshToken -appointments');

    if (!user) throw new NotFoundException('User does not exist!');

    return { user, message: 'User details fetched successfully!' };
  }

  async userAppointmentsDetails(
    userId: Types.ObjectId,
    limitVal: number,
    offsetVal: number,
  ) {
    const [totalCount, appointments] = await Promise.all([
      this.appointmentModel.countDocuments({ userId }).exec(),
      this.appointmentModel
        .find({ userId })
        .populate('doctorId', 'name speciality profileImg')
        // .limit(limitVal)
        // .skip(offsetVal)
        .sort({ appointmentDate: -1 })
        .exec(),
    ]);

    return {
      appointments,
      totalCount,
      limitVal,
      offsetVal,
      message: appointments.length
        ? 'Appointment details fetched successfully!'
        : 'No appointments found!',
    };
  }

  async userAppointmentDetailsService(
    appointment_id: Types.ObjectId,
    userId: Types.ObjectId,
  ) {
    const appointment = await this.appointmentModel
      .findOne({
        _id: appointment_id,
        userId,
      })
      .populate(
        'doctorId',
        'name email profileImg degree speciality experience about fees',
      )
      .exec();

    if (!appointment) {
      throw new NotFoundException('Appointment not found for this user.');
    }

    return {
      appointment,
      message: 'Appointment details fetched successfully!',
    };
  }

  async cancelAppointmentService(
    appointment_id: Types.ObjectId,
    userId: Types.ObjectId,
  ) {
    const appointment = await this.appointmentModel.findOneAndDelete({
      _id: appointment_id,
      userId,
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found or already canceled.');
    }

    await Promise.all([
      this.doctorModel.updateOne(
        { _id: appointment.doctorId },
        { $pull: { appointments: appointment._id } },
      ),
      this.userModel.updateOne(
        { _id: userId },
        { $pull: { appointments: appointment._id } },
      ),
    ]);

    return { message: 'Appointment Canceled!' };
  }

  async updateUserDetailsService(
    updateUserDetails: UpdateUserDto,
    userId: Types.ObjectId,
  ) {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, updateUserDetails, {
        new: true,
        runValidators: true,
      })
      .select('-appointments -userType -isActive -refreshToken -__v');

    if (!updatedUser) {
      throw new NotFoundException('User does not exist!');
    }

    return {
      updatedUser,
      message: 'User updated successfully!',
    };
  }
}
