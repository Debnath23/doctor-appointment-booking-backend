import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserEntity, UserEntitySchema } from 'src/entities/user.entity';
import { ConfigModule } from '@nestjs/config';
import { envOptions } from 'src/config/envOptions';

@Module({
  imports: [
    ConfigModule.forRoot(envOptions),
    MongooseModule.forFeature([
      { name: UserEntity.name, schema: UserEntitySchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
