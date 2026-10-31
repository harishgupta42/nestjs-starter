import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),

    new ValidationPipe({
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        return new BadRequestException(validationErrors);
      },
    }),
  );
  app.setGlobalPrefix(process.env.BASE_PATH || '');
  /**
   * Swagger Configuration
   */
  if (process.env.SET_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle(process.env.NAME || '')
      .setDescription(process.env.DESCRIPTION || '')
      .setVersion(process.env.VERSION || '')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${process.env.BASE_PATH || ''}/swagger`, app, document);
  }
  app.enableCors();
  await app.listen(parseInt(process.env.PORT) || 3000);
}
bootstrap();
