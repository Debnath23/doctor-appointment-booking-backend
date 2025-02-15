import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
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
  }

  @Post('doctor')
  async dataSeeding() {
    return await this.adminService.dataSeeding();
  }

  @Get('users-details')
  @UseGuards(AdminGuard)
  async getUsersDetails(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const limitVal = limit ? parseInt(limit.toString(), 10) : 10;
    const offsetVal = offset ? parseInt(offset.toString(), 10) : 0;

    return await this.adminService.getUsersDetailsService(limitVal, offsetVal);
  }

  @Get('user/appointment-details/:userId')
  @UseGuards(AdminGuard)
  async userAppointmentDetails(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitVal = limit ? parseInt(limit.toString(), 10) : 10;
    const offsetVal = offset ? parseInt(offset.toString(), 10) : 0;

    return await this.adminService.userAppointmentDetailsService(
      userId,
      limitVal,
      offsetVal,
    );
  }

  @Get('doctors-details')
  @UseGuards(AdminGuard)
  async getdoctorsDetails(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const limitVal = limit ? parseInt(limit.toString(), 10) : 10;
    const offsetVal = offset ? parseInt(offset.toString(), 10) : 0;

    return await this.adminService.getdoctorsDetailsService(
      limitVal,
      offsetVal,
    );
  }

  @Get('doctor/appointment-details/:doctorId')
  @UseGuards(AdminGuard)
  async doctorAppointmentDetails(
    @Param('doctorId') doctorId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitVal = limit ? parseInt(limit.toString(), 10) : 10;
    const offsetVal = offset ? parseInt(offset.toString(), 10) : 0;

    return await this.adminService.doctorAppointmentDetailsService(
      doctorId,
      limitVal,
      offsetVal,
    );
  }
}
