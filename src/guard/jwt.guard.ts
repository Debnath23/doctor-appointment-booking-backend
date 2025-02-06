import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserEntity } from 'src/entities/user.entity';
import { DoctorEntity } from 'src/entities/doctor.entity';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(UserEntity.name) private readonly userModel: Model<UserEntity>,
    @InjectModel(DoctorEntity.name)
    private readonly doctorModel: Model<DoctorEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromRequest(request);

    if (!token) {
      throw new HttpException('Unauthorized request', HttpStatus.UNAUTHORIZED);
    }

    try {
      const decodedToken = this.jwtService.verify(token, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });

      const objectId = new Types.ObjectId(decodedToken._id);

      const userOrDoctor =
        (await this.userModel
          .findOne({ _id: objectId })
          .select('-password -appointments -refreshToken')
          .lean()) ||
        (await this.doctorModel
          .findOne({ _id: objectId })
          .select(
            '-password -refreshToken -appointments -profileImg -degree -speciality -experience -about -fees -createdAt -updatedAt -__v',
          )
          .lean());

      if (!userOrDoctor) {
        throw new HttpException(
          'Invalid Access Token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      request['user'] = userOrDoctor;
      return true;
    } catch (error) {
      throw new HttpException(
        'Invalid or Expired Token',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  private extractTokenFromRequest(request: Request): string | undefined {
    return (
      request.cookies?.accessToken ||
      request.header('Authorization')?.replace('Bearer ', '')
    );
  }
}
