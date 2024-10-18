import {
  Body,
  ConflictException,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from 'src/guard/admin.guard';
import { ApiResponse } from 'src/utils/ApiResponse';
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

      const result =
        await this.adminService.createDoctorAccount(createDoctorDto);
      return new ApiResponse(201, result.doctor, result.message);
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
}
