import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { hash } from 'bcrypt';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class UserEntity extends Document {
  @Prop({ unique: true, required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: false })
  phone?: string;

  @Prop({ required: false })
  address?: string;

  @Prop({ required: false, enum: ['Male', 'Female', 'Others'] })
  gender?: string;

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

  _id: Types.ObjectId;
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
