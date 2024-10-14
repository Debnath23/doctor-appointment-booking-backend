import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerCustomOptions,
} from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CLIENT_BASE_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });
  
  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('Doctor Appointment Booking')
    .setDescription('Doctor Appointment Booking')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'Bearer',
    })
    .build();

  const options: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
    },
  };

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document, options);

  await app.listen(process.env.SERVER_PORT);
}
bootstrap();
