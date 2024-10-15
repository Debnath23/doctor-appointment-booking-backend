import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserEntity } from 'src/entities/user.entity';
import { TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(UserEntity.name) private readonly userModel: Model<UserEntity>,
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

      const user = await this.userModel
        .findById(decodedToken._id)
        .select('-password -refreshToken');

      if (!user) {
        throw new HttpException(
          'Invalid Access Token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      request['user'] = user;

      return true;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Access token has expired');
      }
      throw new UnauthorizedException(error?.message || 'Invalid access token');
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
