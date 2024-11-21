import { UserEntity } from 'src/entities/user.entity';
import { DoctorEntity } from 'src/entities/doctor.entity';

declare module 'express' {
  export interface Request {
    user?: UserEntity | DoctorEntity;
  }
}
