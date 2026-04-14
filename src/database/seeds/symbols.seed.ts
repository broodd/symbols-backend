import { Command } from 'nestjs-command';

import { Injectable, Logger } from '@nestjs/common';

import { SymbolsService } from 'src/modules/symbols/services';
import { SymbolEntity } from 'src/modules/symbols/entities';

@Injectable()
export class SymbolsSeed {
  private readonly logger = new Logger(SymbolsSeed.name);

  constructor(private readonly symbolsService: SymbolsService) {}

  private readonly symbols: Partial<SymbolEntity>[] = [
    { providerSymbol: 'BTCUSDT', name: 'Bitcoin' },
    { providerSymbol: 'ETHUSDT', name: 'Ethereum' },
    { providerSymbol: 'BNBUSDT', name: 'BNB' },
    { providerSymbol: 'SOLUSDT', name: 'Solana' },
    { providerSymbol: 'XRPUSDT', name: 'XRP' },
    { providerSymbol: 'DOGEUSDT', name: 'Dogecoin' },
    { providerSymbol: 'ADAUSDT', name: 'Cardano' },
    { providerSymbol: 'TRXUSDT', name: 'TRON' },
    { providerSymbol: 'AVAXUSDT', name: 'Avalanche' },
    { providerSymbol: 'LINKUSDT', name: 'Chainlink' },
    { providerSymbol: 'TONUSDT', name: 'Toncoin' },
    { providerSymbol: 'SUIUSDT', name: 'Sui' },
    { providerSymbol: 'DOTUSDT', name: 'Polkadot' },
    { providerSymbol: 'LTCUSDT', name: 'Litecoin' },
    { providerSymbol: 'BCHUSDT', name: 'Bitcoin Cash' },
    { providerSymbol: 'XLMUSDT', name: 'Stellar' },
    { providerSymbol: 'SHIBUSDT', name: 'Shiba Inu' },
    { providerSymbol: 'HBARUSDT', name: 'Hedera' },
    { providerSymbol: 'UNIUSDT', name: 'Uniswap' },
    { providerSymbol: 'PEPEUSDT', name: 'Pepe' },
    { providerSymbol: 'APTUSDT', name: 'Aptos' },
    { providerSymbol: 'NEARUSDT', name: 'NEAR Protocol' },
    { providerSymbol: 'ICPUSDT', name: 'Internet Computer' },
    { providerSymbol: 'VETUSDT', name: 'VeChain' },
    { providerSymbol: 'FILUSDT', name: 'Filecoin' },
    { providerSymbol: 'ETCUSDT', name: 'Ethereum Classic' },
    { providerSymbol: 'ATOMUSDT', name: 'Cosmos' },
    { providerSymbol: 'INJUSDT', name: 'Injective' },
    { providerSymbol: 'ARBUSDT', name: 'Arbitrum' },
    { providerSymbol: 'OPUSDT', name: 'Optimism' },
    { providerSymbol: 'AAVEUSDT', name: 'Aave' },
    { providerSymbol: 'MKRUSDT', name: 'Maker' },
    { providerSymbol: 'RUNEUSDT', name: 'THORChain' },
    { providerSymbol: 'SEIUSDT', name: 'Sei' },
    { providerSymbol: 'BONKUSDT', name: 'Bonk' },
    { providerSymbol: 'FETUSDT', name: 'Fetch.ai' },
    { providerSymbol: 'TAOUSDT', name: 'Bittensor' },
    { providerSymbol: 'POLUSDT', name: 'Polygon' },
    { providerSymbol: 'MATICUSDT', name: 'Polygon' },
    { providerSymbol: 'WIFUSDT', name: 'dogwifhat' },
    { providerSymbol: 'TIAUSDT', name: 'Celestia' },
    { providerSymbol: 'JUPUSDT', name: 'Jupiter' },
    { providerSymbol: 'ETHFIUSDT', name: 'ether.fi' },
    { providerSymbol: 'FLOKIUSDT', name: 'Floki' },
    { providerSymbol: 'ORDIUSDT', name: 'ORDI' },
    { providerSymbol: 'LDOUSDT', name: 'Lido DAO' },
    { providerSymbol: 'ALGOUSDT', name: 'Algorand' },
    { providerSymbol: 'STXUSDT', name: 'Stacks' },
    { providerSymbol: 'SANDUSDT', name: 'The Sandbox' },
    { providerSymbol: 'NEOUSDT', name: 'NEO' },
  ];

  @Command({
    command: 'seed:symbols',
    describe: 'Create/update popular Binance symbols',
  })
  public async run(): Promise<void> {
    let created = 0;
    let updated = 0;

    for (const symbol of this.symbols) {
      const existing = await this.symbolsService
        .selectOne({ providerSymbol: symbol.providerSymbol })
        .catch(() => null);

      if (!existing) {
        await this.symbolsService.createOne({
          providerSymbol: symbol.providerSymbol,
          name: symbol.name,
          isPublic: true,
        });
        created += 1;
        continue;
      }

      await this.symbolsService.updateOne(
        { id: existing.id },
        {
          name: symbol.name,
          isPublic: true,
        },
      );
      updated += 1;
    }

    this.logger.log(
      `Seeded Binance symbols: created=${created}, updated=${updated}, total=${this.symbols.length}`,
    );
  }
}
