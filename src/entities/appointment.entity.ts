import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class AppointmentEntity {
  _id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'UserEntity',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'DoctorEntity',
    required: true,
    index: true,
  })
  doctorId: Types.ObjectId;

  @Prop({ required: true })
  appointmentDate: Date;

  @Prop({ required: true })
  appointmentTime: string;

  @Prop({ required: true, default: '100' })
  amountToPay: string;

  @Prop({ required: true, default: 'online', enum: ['online', 'cash'] })
  paymentType: string;

  @Prop({ default: 'pending', enum: ['completed', 'pending'] })
  paymentStatus: string;

  @Prop()
  payment_id?: string;

  @Prop()
  secret_id?: string;
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
