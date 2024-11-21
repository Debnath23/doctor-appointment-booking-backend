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
import { DoctorEntity } from 'src/entities/doctor.entity';

@Injectable()
export class DoctorAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
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

      console.log('Decoded Token:', decodedToken);

      // Validate if the decoded token has a valid ObjectId
      if (!Types.ObjectId.isValid(decodedToken._id)) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }

      const doctor = await this.doctorModel
        .findById(decodedToken._id)
        .select('-password -refreshToken -appointments');

      if (!doctor) {
        throw new HttpException('Doctor not found', HttpStatus.UNAUTHORIZED);
      }

      request['user'] = doctor;
      return true;
    } catch (error) {
      console.error('Error in DoctorAuthGuard:', error);
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }

  private extractTokenFromRequest(request: Request): string | undefined {
    const tokenFromCookie = request.cookies?.accessToken;
    const tokenFromHeader = request
      .header('Authorization')
      ?.replace('Bearer ', '');
    return tokenFromCookie || tokenFromHeader;
  }
}
