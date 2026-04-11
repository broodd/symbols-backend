import { CommandService, CommandModule } from 'nestjs-command';

import { NestFactory } from '@nestjs/core';

import { SeedsCliModule } from './seeds-cli.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedsCliModule, { logger: false });

  try {
    await app.select(CommandModule).get(CommandService).exec();
    await app.close();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    await app.close();
    process.exit(1);
  }
}

bootstrap();
