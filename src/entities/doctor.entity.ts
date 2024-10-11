import { HttpException, HttpStatus } from '@nestjs/common';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { compare, hash } from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class DoctorEntity extends Document {
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
    trim: true })
  email: string;

  @Prop({ required: true, lowercase: true, trim: true })
  speciality: string;

  @Prop({ required: true })
  experience: string;

  @Prop({ required: true, trim: true })
  about: string;

  @Prop({ required: true, trim: true })
  fees: string;

  @Prop({ select: false, required: true })
  password: string;

  @Prop([{ type: Types.ObjectId, ref: 'AppointmentEntity' }])
  appointments: Types.ObjectId[];

  @Prop({ required: true, default: 3 })
  usersType: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true })
  refreshToken: string;

  _id: Types.ObjectId;
}

export const DoctorEntitySchema = SchemaFactory.createForClass(DoctorEntity);

DoctorEntitySchema.pre<DoctorEntity>('save', async function (next) {
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

DoctorEntitySchema.methods.isPasswordCorrect = async function (
  password: string,
) {
  try {
    return await compare(password, this.password);
  } catch (error) {
    console.error('Error during password comparison:', error);
    throw new HttpException(
      'An error occurred while verifying the password. Please try again.',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
};

DoctorEntitySchema.methods.generateAccessToken = function () {
  try {
    return jwt.sign(
      {
        _id: this._id,
        email: this.email,
        name: this.name,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      },
    );
  } catch (error) {
    console.error('Error generating access token:', error);
    throw new HttpException(
      'Failed to generate access token.',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
};

DoctorEntitySchema.methods.generateRefreshToken = function () {
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
};
