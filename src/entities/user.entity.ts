import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { compare, hash } from 'bcrypt';
import { Document, Types } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { HttpException, HttpStatus } from '@nestjs/common';
import { UserInterface } from '../interfaces/user.interface';
import { BookAppointmentDto } from 'src/dto/bookAppointment.dto';

@Schema({ _id: false })
export class AppointmentEntity {
  @Prop({ required: true })
  doctorId: Types.ObjectId;

  @Prop({ required: true })
  appointmentDate: Date;

  @Prop({ required: true })
  appointmentTime: string;
}

export const AppointmentEntitySchema =
  SchemaFactory.createForClass(AppointmentEntity);

  AppointmentEntitySchema.pre('save', function (next) {
    const now = new Date();
  
    // Assuming appointmentDate is in "YYYY-MM-DD" format
    const appointmentDateStr = this.appointmentDate;
  
    // Assuming appointmentTime is in "HH:mm" format
    const appointmentTimeStr = this.appointmentTime;
  
    // Combine date and time into a single Date object
    const appointmentDateTime = new Date(`${appointmentDateStr}T${appointmentTimeStr}:00`);
  
    // Compare the full appointment date and time with current date and time
    if (appointmentDateTime < now) {
      const error = new Error('Cannot book for past dates or times.');
      return next(error);
    }
  
    next();
  });
  

@Schema({ timestamps: true })
export class UserEntity extends Document implements UserInterface {
  @Prop({
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({ required: false, trim: true })
  phone?: string;

  @Prop({ required: false, trim: true })
  address?: string;

  @Prop({
    required: false,
    enum: ['male', 'female', 'others'],
    lowercase: true,
    trim: true,
  })
  gender?: string;

  @Prop({ required: false })
  dob?: string;

  @Prop({ select: false, required: true })
  password: string;

  @Prop([{ type: Types.ObjectId, ref: 'AppointmentEntity' }])
  appointments: BookAppointmentDto[];

  @Prop({ required: true, default: 2 })
  userType: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: false })
  refreshToken?: string;

  _id: Types.ObjectId;

  async isPasswordCorrect(password: string): Promise<boolean> {
    if (!password || !this.password) {
      console.error('Password or hash missing during comparison');
      throw new HttpException(
        'An error occurred while verifying the password. Please try again.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      return await compare(password, this.password);
    } catch (error) {
      console.error('Error during password comparison:', error);
      throw new HttpException(
        'An error occurred while verifying the password. Please try again.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  generateAccessToken(): string {
    try {
      const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
      const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY;

      if (!accessTokenSecret || !accessTokenExpiry) {
        throw new Error(
          'Access token secret or expiry not set in environment variables.',
        );
      }

      return jwt.sign(
        {
          _id: this._id,
          email: this.email,
          name: this.name,
        },
        accessTokenSecret,
        {
          expiresIn: accessTokenExpiry,
        },
      );
    } catch (error) {
      console.error('Error generating access token:', error);
      throw new HttpException(
        'Failed to generate access token.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  generateRefreshToken(): string {
    try {
      return jwt.sign(
        {
          _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
          expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        },
      );
    } catch (error) {
      console.error('Error generating refresh token:', error);
      throw new HttpException(
        'Failed to generate refresh token.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const UserEntitySchema = SchemaFactory.createForClass(UserEntity);

UserEntitySchema.pre<UserEntity>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    console.log('Hashing password before save');
    this.password = await hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

UserEntitySchema.methods.isPasswordCorrect =
  UserEntity.prototype.isPasswordCorrect;
UserEntitySchema.methods.generateAccessToken =
  UserEntity.prototype.generateAccessToken;
UserEntitySchema.methods.generateRefreshToken =
  UserEntity.prototype.generateRefreshToken;
