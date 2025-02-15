import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Response } from 'express';
import { Redis } from '@upstash/redis';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from '../../dto/createUser.dto';
import { LoginDto } from '../../dto/login.dto';
import { UserEntity } from '../../entities/user.entity';
import { EmailService } from 'src/utils/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(UserEntity.name) private userModel: Model<UserEntity>,
    private readonly emailService: EmailService,
  ) {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  private redis: Redis;
  private OTP_EXPIRY = 600;
  private OTP_RATE_LIMIT = 3;

  async generateAccessAndRefreshTokens(userId: Types.ObjectId) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found!');
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  }

  async createUser(createUserDto: CreateUserDto) {
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
  }

  async generateOTPService(userId: Types.ObjectId) {
    const user = await this.userModel.findById(userId);

    if (!user) throw new NotFoundException('User does not exist!');

    const requestCount = await this.redis.incr(`otp_limit:${user.email}`);

    if (requestCount === 1) {
      await this.redis.expire(`otp_limit:${user.email}`, this.OTP_EXPIRY);
    }
    if (requestCount > this.OTP_RATE_LIMIT) {
      throw new BadRequestException('Too many OTP requests. Try again later.');
    }

    const otp = (1000 + Math.floor(Math.random() * 9000)).toString();

    await this.redis.setex(`otp:${user.email}`, this.OTP_EXPIRY, otp);

    await this.emailService.sendOtpEmail(user.email, otp);

    return {
      message: 'OTP sent successfully!',
    };
  }

  async verifyOTPService(
    userOtp: { otp: string },
    userId: Types.ObjectId,
  ): Promise<boolean> {
    const user = await this.userModel.findById(userId);

    if (!user) throw new NotFoundException('User does not exist!');

    const storedOtp = await this.redis.get(`otp:${user.email}`);

    if (!storedOtp) {
      throw new BadRequestException('OTP expired or invalid.');
    }

    if (storedOtp !== Number(userOtp.otp)) {
      throw new BadRequestException('Incorrect OTP.');
    }

    await this.redis.del(`otp:${user.email}`);
    await this.redis.del(`otp_limit:${user.email}`);

    return true;
  }

  async loginUser(loginDto: LoginDto) {
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
  }

  async logoutUser(userId: Types.ObjectId, res: Response) {
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
  }

  async getMe(userId: Types.ObjectId) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return { isAuthenticated: true };
  }
}
