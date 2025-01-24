import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Response } from 'express';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from '../../dto/createUser.dto';
import { LoginDto } from '../../dto/login.dto';
import { UserEntity } from '../../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
  ) {}

  async generateAccessAndRefreshTokens(userId: Types.ObjectId) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found!');
      }

      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      return { accessToken, refreshToken };
    } catch (error) {
      throw error;
    }
  }

  async createUser(createUserDto: CreateUserDto) {
    try {
      const existedUser = await this.userModel.findOne({
        $or: [{ username: createUserDto.name }, { email: createUserDto.email }],
      });

      if (existedUser) {
        throw new ConflictException('Username or Email is already taken');
      }

      const user = new this.userModel(createUserDto);
      await user.save();

      const { accessToken, refreshToken } =
        await this.generateAccessAndRefreshTokens(user._id);

      const createdUser = await this.userModel
        .findById(user._id)
        .select('-password -refreshToken -appointments');

      if (!createdUser) {
        throw new InternalServerErrorException(
          'Something went wrong while registering the user',
        );
      }

      return {
        user: createdUser,
        accessToken,
        refreshToken,
        message: 'User registered Successfully',
      };
    } catch (error: any) {
      throw error;
    }
  }

  async loginUser(loginDto: LoginDto) {
    try {
      const user = await this.userModel
        .findOne({ email: loginDto.email.trim().toLowerCase() })
        .select('+password')
        .exec();

      if (!user) {
        throw new NotFoundException('User does not exist');
      }

      const isPasswordValid = await user.isPasswordCorrect(loginDto.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid user credentials');
      }

      const { accessToken, refreshToken } =
        await this.generateAccessAndRefreshTokens(user._id);

      const loggedInUser = await this.userModel
        .findById(user._id)
        .select('-password -refreshToken -appointments');

      return {
        user: loggedInUser,
        accessToken,
        refreshToken,
        message: 'User logged In Successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  async logoutUser(userId: Types.ObjectId, res: Response) {
    try {
      await this.userModel.findByIdAndUpdate(
        userId,
        { $unset: { refreshToken: 1 } },
        { new: true },
      );

      const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none' as const,
        path: '/',
      };

      res.clearCookie('accessToken', options);
      res.clearCookie('refreshToken', options);

      return { success: true, message: 'User logged out successfully' };
    } catch (error) {
      throw error;
    }
  }
}
