import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import validationOptions from './shared/utils/validationOption';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableCors({
    credentials: true,
    origin: true,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));

  const config = new DocumentBuilder()
    .setTitle('Safelet API')
    .setDescription('The safelet API description')
    .setVersion('1.0')
    .addTag('safelet')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/documents', app, document);

  await app.listen(3000);
}
bootstrap();
