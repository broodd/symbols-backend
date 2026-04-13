import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/database';
import { ConfigModule } from 'src/config';

@Module({
  imports: [ConfigModule, DatabaseModule],
})
export class SeedsCliModule {}
