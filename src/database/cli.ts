import { CommandService, CommandModule } from 'nestjs-command';

import { NestFactory } from '@nestjs/core';

import { SeedsCliModule } from './seeds-cli.module';

async function bootstrap() {
  try {
    const app = await NestFactory.createApplicationContext(SeedsCliModule, {
      logger: ['error', 'warn', 'log'],
    });

    try {
      await app.select(CommandModule).get(CommandService).exec();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      process.exitCode = 1;
    } finally {
      await app.close();
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to bootstrap seeds CLI');
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  }
}

bootstrap();
