import { forwardRef, Global, Module } from '@nestjs/common';

import { SymbolsModule } from 'src/modules/symbols';
import { SocketsModule } from 'src/modules/sockets';

import { BinanceProviderService } from './services';

/**
 * Binance websocket provider for market data subscriptions
 */
@Global()
@Module({
  imports: [forwardRef(() => SymbolsModule), SocketsModule],
  providers: [BinanceProviderService],
  exports: [BinanceProviderService],
})
export class BinanceProviderModule {}
