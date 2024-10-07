import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class AppointmentEntity extends Document {
  @Prop({required: true})
  userId: Types.ObjectId;

  @Prop({required: true})
  doctorId: Types.ObjectId;

  @Prop({required: true})
  appointmentDate: Date;

  @Prop({required: true})
  appointmentTime: string;

  _id: Types.ObjectId;
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