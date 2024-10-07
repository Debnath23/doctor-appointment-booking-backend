import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { hash } from 'bcrypt';
import { Document, Types } from 'mongoose';


@Schema({timestamps: true})
export class DoctorEntity extends Document {
  @Prop({unique: true, required: true})
  name: string;

  @Prop({required: true})
  email: string;

  @Prop({required: true})
  speciality: string;

  @Prop({required: true})
  experience: string;

  @Prop({required: true})
  about: string;

  @Prop({required: true})
  fees: string;

  @Prop({ select: false, required: true})
  password: string;

  @Prop([{ type: Types.ObjectId, ref: 'AppointmentEntity' }])
  appointments: Types.ObjectId[];

  @Prop({ required: true, default: 3})
  usersType: number;

  @Prop({ default: true})
  isActive: boolean;

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