import { MongooseModuleOptions, MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';

import { ConfigService } from 'src/config';

import { SeedsModule } from './seeds';

/**
 * [description]
 */
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): MongooseModuleOptions => {
        const uri = configService.get<string>('MONGODB_URI');

        const maxPoolSize = configService.get<number>('MONGODB_POOL_SIZE', 10);
        const autoIndex = configService.get<boolean>('MONGODB_AUTO_INDEX', true);

        return {
          uri,
          autoIndex,
          maxPoolSize,
        };
      },
    }),
    SeedsModule,
  ],
})
export class DatabaseModule {}
