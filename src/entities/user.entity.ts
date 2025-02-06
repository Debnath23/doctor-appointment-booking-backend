import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { compare, hash } from 'bcrypt';
import { Document, Types } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import { HttpException, HttpStatus } from '@nestjs/common';
import { UserInterface } from '../interfaces/user.interface';

@Schema({ timestamps: true })
export class UserEntity extends Document implements UserInterface {
  @Prop({
    unique: true,
    required: true,
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

  @Prop({
    required: false,
    enum: ['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-'],
    uppercase: true,
    trim: true,
  })
  bloodGroup?: string;

  @Prop({ required: false })
  dob?: string;

  @Prop({ select: false, required: true })
  password: string;

  @Prop([{ type: Types.ObjectId, ref: 'AppointmentEntity' }])
  appointments: Types.ObjectId[];

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
