import { UserEntity } from 'src/entities/user.entity';

declare module 'express' {
  interface Request {
    user?: UserEntity;
  }
}
