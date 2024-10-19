import { Document, Types } from 'mongoose';
import { BookAppointmentDto } from 'src/dto/bookAppointment.dto';

export interface UserInterface extends Document {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  gender?: string;
  dob?: string;
  password: string;
  appointments: Types.ObjectId[];
  userType: number;
  isActive: boolean;
  refreshToken?: string;
  _id: Types.ObjectId;

  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}
