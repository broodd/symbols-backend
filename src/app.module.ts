import { join } from 'node:path';

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { CacheModule } from '@nestjs/cache-manager';
import { TerminusModule } from '@nestjs/terminus';
import { APP_GUARD } from '@nestjs/core';
import { Module } from '@nestjs/common';

import { BinanceProviderModule } from './modules/binance-provider';
import { LimitAttemptsGuard } from './modules/auth/guards';
import { ConfigService, ConfigModule } from './config';
import { SocketsModule } from './modules/sockets';
import { SymbolsModule } from './modules/symbols';
import { AppController } from './app.controller';
import { UsersModule } from './modules/users';
import { DatabaseModule } from './database';
import { AuthModule } from './modules/auth';

@Module({
  imports: [
    TerminusModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get('THROTTLE_TTL'),
        limit: configService.get('THROTTLE_LIMIT'),
      }),
    }),
    CacheModule.register({ isGlobal: true }),
    ConfigModule,
    AuthModule,
    UsersModule,
    BinanceProviderModule,
    SymbolsModule,
    SocketsModule,
    DatabaseModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../public'),
      serveRoot: '/public',
    }),
  ],
  controllers: [AppController],
  providers: [LimitAttemptsGuard, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
