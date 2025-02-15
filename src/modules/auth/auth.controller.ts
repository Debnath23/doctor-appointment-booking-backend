import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { LoginDto } from '../../dto/login.dto';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../../dto/createUser.dto';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtAuthGuard } from 'src/guard/jwt.guard';
import { SetCookiesInterceptor } from 'src/interceptor/set-cookies.interceptor';
import { ClearCookiesInterceptor } from 'src/interceptor/clear-cookies.interceptor';
import * as jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return await this.authService.createUser(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('send-otp')
  async generateOTP(@Req() req: Request) {
    const userId = this.getUserId(req);
    return await this.authService.generateOTPService(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-otp')
  async verifyOTP(@Body() otp: { otp: string }, @Req() req: Request) {
    const userId = this.getUserId(req);
    return await this.authService.verifyOTPService(otp, userId);
  }

  @Post('login')
  @UseInterceptors(SetCookiesInterceptor)
  async login(@Body() loginDto: LoginDto) {
    if (!loginDto) {
      throw new BadRequestException('All fields are required');
    }
    return await this.authService.loginUser(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('logout')
  @UseInterceptors(ClearCookiesInterceptor)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (!req.user) {
      throw new UnauthorizedException('Unauthorized');
    }
    return await this.authService.logoutUser(req.user._id, res);
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  async verifyToken(@Req() req: Request) {
    return { isValid: true, user: req.user };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: Request, @Res() res: Response) {
    try {
      const token = req.cookies.accessToken;
      if (!token) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
        userId: string;
      };
      if (!decoded || !decoded.userId) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      const objectId = new Types.ObjectId(decoded.userId);

      const user = await this.authService.getMe(objectId);
      return res.json(user);
    } catch (error) {
      return res.status(401).json({ isAuthenticated: false });
    }
  }

  private getUserId(req: Request): Types.ObjectId {
    if (!req.user) throw new NotFoundException('User not found!');
    return req.user._id as Types.ObjectId;
  }
}
