import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import * as crypto from 'crypto';

// (globalThis as any).crypto = crypto;

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    const logger = new Logger('Bootstrap');

    // Debug environment variables (remove in production)
    console.log('Environment variables check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
    console.log('All env vars:', Object.keys(process.env).filter(key =>
      key.includes('MONGO') || key.includes('DATABASE')
    ));

    // Global prefix
    app.setGlobalPrefix('api/v1');

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        disableErrorMessages: process.env.NODE_ENV === 'production', // Hide validation errors in production
      }),
    );

    // CORS configuration - be more specific in production
    app.enableCors({
      origin: process.env.NODE_ENV === 'production' 
        ? 
        ['https://your-frontend-domain.com','https://localhost:3001.com'] // Replace with your actual frontend URL
         // Replace with your actual frontend URL
        : true, // Allow all origins in development
      credentials: true,
    });

    // Swagger Setup - only in development
    if (process.env.NODE_ENV !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('NestJS HRM API')
        .setDescription('API for Human Resource Management with MongoDB')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document);
      logger.log('Swagger documentation available at /api/docs');
    }

    const port = configService.get<number>('PORT') || 3001;
    await app.listen(port);
    
    logger.log(`🚀 Application is running on: ${await app.getUrl()}`);
    logger.log(`📚 API Documentation: ${await app.getUrl()}/api/docs`);
    logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();