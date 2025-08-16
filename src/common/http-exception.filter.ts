// src/common/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse: any = exception.getResponse();

    // Determine if it's a validation error from class-validator
    const isValidationError =
      typeof exceptionResponse === 'object' &&
      exceptionResponse.message &&
      Array.isArray(exceptionResponse.message) &&
      exceptionResponse.statusCode === HttpStatus.BAD_REQUEST;

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: isValidationError
        ? 'Validation Failed'
        : exceptionResponse.message || exception.message,
      errors: isValidationError ? exceptionResponse.message : undefined,
    };

    this.logger.error(
      `HTTP Status: ${status} Error Message: ${JSON.stringify(errorResponse)}`,
      exception.stack,
      'ExceptionFilter'
    );

    response.status(status).json(errorResponse);
  }
}

// You need to register this filter globally in main.ts
// import { AllExceptionsFilter } from './common/http-exception.filter';
// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   app.useGlobalFilters(new AllExceptionsFilter());
//   // ... other configurations
// }
