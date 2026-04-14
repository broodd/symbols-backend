import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { BinanceProviderModule } from 'src/modules/binance-provider';

import { ClientRole_SymbolsController } from './controllers/client-role';
import { AdminRole_SymbolsController } from './controllers/admin-role';
import { SymbolEntity, SymbolSchema } from './entities';
import { SymbolsService } from './services';

/**
 * [description]
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: SymbolEntity.name, schema: SymbolSchema }]),
    forwardRef(() => BinanceProviderModule),
  ],
  controllers: [AdminRole_SymbolsController, ClientRole_SymbolsController],
  providers: [SymbolsService],
  exports: [SymbolsService],
})
export class SymbolsModule {}
