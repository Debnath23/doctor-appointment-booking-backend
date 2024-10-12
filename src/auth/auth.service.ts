import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Response } from 'express';
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
        throw new ApiError(400, 'Username or Email is already taken');
      }

      const user = new this.userModel(createUserDto);
      await user.save();

      const createdUser = await this.userModel
        .findById(user._id)
        .select('-password -refreshToken');

      if (!createdUser) {
        throw new ApiError(
          500,
          'Something went wrong while registering the user',
        );
      }

      return res
        .status(201)
        .json(
          new ApiResponse(200, createdUser, 'User registered Successfully'),
        );
    } catch (error: any) {
      console.error('Error creating user:', error);
      throw new ApiError(
        500,
        'Something went wrong while registering the user',
      );
    }
  }

  async loginUser(loginDto: LoginDto, res: Response) {
    try {
      const user = await this.userModel
        .findOne({ email: loginDto.email })
        .select('+password')
        .exec();

      if (!user) {
        throw new ApiError(404, 'User does not exist');
      }

      const isPasswordValid = await user.isPasswordCorrect(loginDto.password);

      if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid user credentials');
      }

      const { accessToken, refreshToken } =
        await this.generateAccessAndRefreshTokens(user._id);

      const loggedInUser = await this.userModel
        .findById(user._id)
        .select('-password -refreshToken');

      const options = {
        httpOnly: true,
        secure: true,
      };

      return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
          new ApiResponse(
            200,
            {
              user: loggedInUser,
              accessToken,
              refreshToken,
            },
            'User logged In Successfully',
          ),
        );
    } catch (error) {
      console.log('>>>>>>>>>>>>', error);
      throw new Error(error.message);
    }
  }

  async logoutUser(userId: Types.ObjectId, res: Response) {
    try {
      await this.userModel.findByIdAndUpdate(
        userId,
        { $unset: { refreshToken: 1 } },
        { new: true }
      );
  
      const options = {
        httpOnly: true,
        secure: true,
      };
  
      return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, {}, 'User logged out successfully'));
    } catch (error) {
      console.error('Error during user logout:', error);
  
      return res
        .status(500)
        .json({ success: false, message: 'Failed to log out the user.' });
    }
  }
}
