import { Body, Controller, Post, Res } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../dto/createUser.dto';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ApiError } from 'src/utils/ApiError';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      if (!createUserDto) {
        throw new ApiError(400, 'All fields are required');
      }

      const response = await this.authService.createUser(createUserDto, res);

      return response;
    } catch (error: any) {
      console.error('Error during user registration:', error);

      return res.status(500).json({
        success: false,
        message: 'Something went wrong while registering the user.',
      });
    }
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await this.authService.login(loginDto, res);

    return response;
  }
}
