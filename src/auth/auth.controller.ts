import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../dto/createUser.dto';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ApiError } from 'src/utils/ApiError';
import { JwtAuthGuard } from 'src/middlewares/auth.middleware';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async createUser(@Body() createUserDto: CreateUserDto, @Res() res: Response) {
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
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    try {
      if (!loginDto) {
        throw new ApiError(400, 'All fields are required');
      }

      const response = await this.authService.loginUser(loginDto, res);

      return response;
    } catch (error: any) {
      console.error('Error during user login:', error);

      return res.status(500).json({
        success: false,
        message: 'Something went wrong while login the user.',
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const response = await this.authService.logoutUser(req.user._id, res);

      return response;
    } catch (error) {
      console.error('Error during user logout:', error);

      return res.status(500).json({
        success: false,
        message: 'Something went wrong while logging out.',
      });
    }
  }
}
