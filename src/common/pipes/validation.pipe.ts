import { ValidationPipe } from '@nestjs/common';

// import { flattenValidationErrors } from '../helpers';

export const validationPipe = new ValidationPipe({
  forbidNonWhitelisted: true,
  forbidUnknownValues: true,
  whitelist: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  // exceptionFactory: flattenValidationErrors,
});
