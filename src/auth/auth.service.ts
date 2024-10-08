import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { compare } from 'bcrypt';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { Model } from 'mongoose';
import { CreateUserDto } from '../dto/createUser.dto';
import { LoginDto } from '../dto/login.dto';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
  ) {}

  async createUser(createUserDto: CreateUserDto, res: Response) {
    const user = await this.userModel.findOne({
      $or: [{ username: createUserDto.name }, { email: createUserDto.email }],
    });

    if (user) {
      throw new HttpException(
        'Username or Email is already taken',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const createdUser = new this.userModel(createUserDto);
    await createdUser.save();

    const token = this.generateJwt(createdUser);

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 * 10,
    });

    return {
      status: 200,
      message: 'Signup successful!',
    };
  }

  async login(loginDto: LoginDto, res: Response) {
    const user = await this.userModel
      .findOne({ email: loginDto.email })
      .select('+password');

    if (!user) {
      throw new HttpException(
        'User not found!',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const isPasswordCorrect = await compare(loginDto.password, user.password);

    if (!isPasswordCorrect) {
      throw new HttpException(
        'Invalid Password!',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const token = this.generateJwt(user);

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 * 10,
    });

    return {
      status: 200,
      message: 'Login successful!',
    };
  }

  generateJwt(user: UserEntity): string {
    try {
      const secret = process.env.TOKEN_SECRET;
  
      if (!secret) {
        throw new Error('JWT Secret is not defined');
      }
  
      if (!user || !user._id) {
        throw new Error('Invalid user data or missing user ID');
      }
  
      const payload = {
        id: user._id,
        username: user.name,
        email: user.email,
      };

      return jwt.sign(payload, secret, { expiresIn: '10d' });
    } catch (error) {
      throw new Error('Error generating JWT');
    }
  }
  

  async validateUserByEmail(email: string): Promise<UserEntity | null> {
    return this.userModel.findOne({ email });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userModel.findOne({ email });
  }

  getDataFromToken(request: Request): string {
    try {
      const token = request.cookies?.token || '';

      const decodedToken: any = jwt.verify(token, process.env.JWT_SECRET!);

      return decodedToken.id;
    } catch (error: any) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
