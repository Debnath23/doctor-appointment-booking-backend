import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../dto/createUser.dto';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ApiError } from 'src/utils/ApiError';
import { JwtAuthGuard } from 'src/guard/auth.guard';
import { SetCookiesInterceptor } from 'src/interceptor/set-cookies.interceptor';
import { ApiResponse } from 'src/utils/ApiResponse';
import { ClearCookiesInterceptor } from 'src/interceptor/clear-cookies.interceptor';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    try {
      const result = await this.authService.createUser(createUserDto);
      return new ApiResponse(201, result.user, result.message);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        'Something went wrong while registering the user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('login')
  @UseInterceptors(SetCookiesInterceptor)
  async login(@Body() loginDto: LoginDto) {
    try {
      if (!loginDto) {
        throw new ApiError(400, 'All fields are required');
      }

      return await this.authService.loginUser(loginDto);
    } catch (error: any) {
      console.error('Error during user login:', error);

      throw new InternalServerErrorException(
        'Something went wrong while logging in the user.',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @UseInterceptors(ClearCookiesInterceptor)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('Unauthorized');
      }

      return await this.authService.logoutUser(req.user._id, res);
    } catch (error) {
      console.error('Error during user logout:', error);
      throw new InternalServerErrorException(
        'Something went wrong while logging out.',
      );
    }
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  async verifyToken(@Req() req: Request) {
    return { isValid: true, user: req.user };
  }
}
