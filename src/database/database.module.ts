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
        const tls = configService.get<boolean>('MONGODB_SSL', false);
        const allowInvalid = configService.get<boolean>('MONGODB_SSL_SELF', false);
        const autoIndex = configService.get<boolean>('MONGODB_AUTO_INDEX', true);

        return {
          uri,
          tls,
          autoIndex,
          maxPoolSize,
          tlsAllowInvalidCertificates: allowInvalid,
        };
      },
    }),
    SeedsModule,
  ],
})
export class DatabaseModule {}
