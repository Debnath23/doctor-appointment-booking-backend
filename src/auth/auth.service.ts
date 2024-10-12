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
import { Model, Types } from 'mongoose';
import { CreateUserDto } from '../dto/createUser.dto';
import { LoginDto } from '../dto/login.dto';
import { UserEntity } from '../entities/user.entity';
import { ApiError } from 'src/utils/ApiError';
import { ApiResponse } from 'src/utils/ApiResponse';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
  ) {}

  async generateAccessAndRefreshTokens(userId: Types.ObjectId) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      return { accessToken, refreshToken };
    } catch (error) {
      throw new ApiError(
        500,
        'Something went wrong while generating refresh and access token',
      );
    }
  }

  async createUser(createUserDto: CreateUserDto, res: Response) {
    try {
      const existedUser = await this.userModel.findOne({
        $or: [{ username: createUserDto.name }, { email: createUserDto.email }],
      });

      if (existedUser) {
        throw new ApiError(
          400,
          'Username or Email is already taken',
        );
      }

      const user = new this.userModel(createUserDto);
      const createdUser = await user.save();

      if (!createdUser) {
        throw new ApiError(
          500,
          'Something went wrong while registering the user',
        );
      }

      const { password, refreshToken, ...userWithoutSensitiveInfo } =
        createdUser;

      return res
        .status(201)
        .json(
          new ApiResponse(
            200,
            userWithoutSensitiveInfo,
            'User registered Successfully',
          ),
        );
    } catch (error: any) {
      console.error('Error creating user:', error);
      throw new ApiError(
        500,
        'Something went wrong while registering the user',
      );
    }
  }

  async login(loginDto: LoginDto, res: Response) {
    try {
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
        secure: true,
        maxAge: 60 * 60 * 1000,
        sameSite: 'strict',
      });

      return {
        status: 200,
        message: 'Login successful!',
      };
    } catch (error) {
      console.log(error);
      throw new Error(error.message);
    }
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

      return jwt.sign(payload, secret, { expiresIn: '1h' });
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
