import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerCustomOptions,
} from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['https://bookify-beta.vercel.app', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });

  app.use(cookieParser());
  dotenv.config();

  const config = new DocumentBuilder()
    .setTitle('Bookify')
    .setDescription(
      'Bookify is a full-featured doctor appointment booking system that allows users to schedule appointments with doctors from various categories. It includes features for appointment management, doctor availability, and notifications.',
    )
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

  await app.listen(process.env.SERVER_PORT || 4000);
}
bootstrap();
