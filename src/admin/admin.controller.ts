import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from 'src/guard/admin.guard';
import { CreateDoctorDto } from 'src/dto/createDoctor.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags } from '@nestjs/swagger';

@Controller('admin')
@ApiTags('Admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('register-doctor')
  @UseGuards(AdminGuard)
  @UseInterceptors(
    FileInterceptor('profileImg', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async registerDoctor(
    @Body() createDoctorDto: CreateDoctorDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      if (!createDoctorDto) {
        throw new HttpException(
          'Fields are required.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      if (!file) {
        throw new HttpException(
          'profileImg is required.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      createDoctorDto.profileImg = file.path;

      return await this.adminService.createDoctorAccount(createDoctorDto);
    } catch (error) {
      console.error('Error creating doctor:', error);
      if (error instanceof ConflictException) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        'Something went wrong while registering the doctor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('users-details')
  @UseGuards(AdminGuard)
  async getUsersDetails(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    try {
      const limitVal = limit ? parseInt(limit.toString(), 10) : 10;
      const offsetVal = offset ? parseInt(offset.toString(), 10) : 0;

      return await this.adminService.getUsersDetailsService(
        limitVal,
        offsetVal,
      );
    } catch (error) {
      throw new HttpException(
        'Something went wrong while getting users details',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('appointment-details/:userId')
  @UseGuards(AdminGuard)
  async userAppointmentDetails(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const limitVal = limit ? parseInt(limit.toString(), 10) : 10;
      const offsetVal = offset ? parseInt(offset.toString(), 10) : 0;

      return await this.adminService.userAppointmentDetailsService(
        userId,
        limitVal,
        offsetVal,
      );
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new HttpException(error.message, HttpStatus.CONFLICT);
      }
      throw new HttpException(
        'Something went wrong while fetching user appointment details.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
