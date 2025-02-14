import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserEntity, UserEntitySchema } from 'src/entities/user.entity';
import { ConfigModule } from '@nestjs/config';
import { envOptions } from 'src/config/envOptions';
import { JwtAuthGuard } from 'src/guard/jwt.guard';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { DoctorEntity, DoctorEntitySchema } from 'src/entities/doctor.entity';
import { EmailService } from 'src/utils/email.service';

@Module({
  imports: [
    ConfigModule.forRoot(envOptions),
    MongooseModule.forFeature([
      { name: UserEntity.name, schema: UserEntitySchema },
      { name: DoctorEntity.name, schema: DoctorEntitySchema },
    ]),
    JwtModule.register({
      secret: process.env.ACCESS_TOKEN_SECRET,
      signOptions: { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, JwtService, EmailService],
  exports: [JwtService]
})
export class AuthModule {}
