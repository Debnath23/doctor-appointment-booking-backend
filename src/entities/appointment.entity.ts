import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class AppointmentEntity {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'DoctorEntity', required: true })
  doctorId: Types.ObjectId;

  @Prop({ required: true })
  appointmentDate: Date;

  @Prop({ required: true })
  appointmentTime: string;
}

const AppointmentEntitySchema = SchemaFactory.createForClass(AppointmentEntity);

AppointmentEntitySchema.pre('save', function (next) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (this.appointmentDate < today) {
    const error = new Error('Cannot book for past dates.');
    return next(error);
  }

  next();
});

export { AppointmentEntitySchema };
