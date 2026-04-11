import { randomUUID } from 'node:crypto';

import { RawRequestDefaultExpression } from 'fastify';
import fastifyCookie from '@fastify/cookie';
import compress from '@fastify/compress';
import helmet from '@fastify/helmet';

import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { NestFactory, Reflector } from '@nestjs/core';

import { AddUserIdInterceptor } from './common/interceptors';
import { HttpExceptionFilter } from './common/filters';
import { validationPipe } from './common/pipes';

import { LimitAttemptsGuard } from './modules/auth/guards';
import { ConfigService, ConfigMode } from './config';
import { AppModule } from './app.module';
import { swaggerSetup } from './swagger';

/**
 * [description]
 */
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      genReqId: (raw: RawRequestDefaultExpression) =>
        (raw.headers['x-request-id'] as string) || randomUUID(),
    }),
  );
  const configService = app.get(ConfigService);

  await app.register(compress, { encodings: ['gzip', 'deflate'] });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(fastifyCookie);

  app.setGlobalPrefix(configService.get('PREFIX')).enableCors({
    credentials: configService.get('CORS_CREDENTIALS'),
    origin: configService.get('CORS_ORIGIN'),
  });

  if (configService.getMode(ConfigMode.production)) app.enableShutdownHooks();

  await swaggerSetup(app, configService);

  const exceptionFilter = new HttpExceptionFilter();

  return app
    .useGlobalPipes(validationPipe)
    .useGlobalFilters(exceptionFilter)
    .useGlobalGuards(app.get(LimitAttemptsGuard))
    .useGlobalInterceptors(new AddUserIdInterceptor(app.get(Reflector)))
    .listen(configService.get('PORT'), configService.get('HOST'));
}

bootstrap();
