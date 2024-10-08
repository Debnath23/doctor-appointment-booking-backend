import { Body, Controller, Post, Res } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../dto/createUser.dto';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async createUser(@Body() createUserDto: CreateUserDto, @Res({ passthrough: true }) res: Response) {
    const response = await this.authService.createUser(createUserDto, res);

    return response;
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const response = await this.authService.login(loginDto, res);

    return response;
  }
}
