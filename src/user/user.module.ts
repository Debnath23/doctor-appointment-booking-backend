import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserEntity, UserEntitySchema } from 'src/entities/user.entity';
import { DoctorEntity, DoctorEntitySchema } from 'src/entities/doctor.entity';
import { JwtAuthGuard } from 'src/guard/jwt.guard';
import { JwtModule } from '@nestjs/jwt';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserEntity.name, schema: UserEntitySchema },
      { name: DoctorEntity.name, schema: DoctorEntitySchema },
    ]),
    JwtModule.register({
      secret: process.env.ACCESS_TOKEN_SECRET,
      signOptions: { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
    }),
  ],
  controllers: [UserController],
  providers: [UserService, JwtAuthGuard, JwtService],
  exports: [JwtService],
})
export class UserModule {}
