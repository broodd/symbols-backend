import { Module } from '@nestjs/common';

import { ConfigModule } from 'src/config';
import { DatabaseModule } from 'src/database';

@Module({
  imports: [ConfigModule, DatabaseModule],
})
export class SeedsCliModule {}
