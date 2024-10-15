import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { UserEntity } from 'src/entities/user.entity';
import { JwtAuthGuard } from './jwt.guard';

@Injectable()
export class AdminGuard extends JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthorized = await super.canActivate(context);
    if (!isAuthorized) {
      return false;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'] as UserEntity;

    if (user.userType !== 1) {
      throw new HttpException('Forbidden: Admins only', HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
