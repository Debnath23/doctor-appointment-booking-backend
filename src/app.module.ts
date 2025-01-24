import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { envOptions } from './config/envOptions';
import { UserModule } from './modules/user/user.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { RazorpayModule } from './modules/razorpay/razorpay.module';

@Module({
  imports: [
    ConfigModule.forRoot(envOptions),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    UserModule,
    DoctorModule,
    AuthModule,
    AdminModule,
    RazorpayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
