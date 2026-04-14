import { SPOT_WS_STREAMS_PROD_URL, SpotWebsocketStreams, Spot } from '@binance/spot';

import { OnModuleDestroy, OnModuleInit, Injectable, Logger } from '@nestjs/common';

import { ConfigService } from 'src/config';

import { SocketsGateway } from 'src/modules/sockets/services';
import { SymbolsService } from 'src/modules/symbols/services';
import { SymbolEntity } from 'src/modules/symbols/entities';

import {
  MarketTickerStream,
  MarketTickerBatch,
  MarketTickerEntry,
} from '../types/symbol-stream.type';

/**
 * Keeps Binance websocket streams in sync with stored symbols.
 *
 * Responsibilities:
 * - Load existing symbols from storage on startup.
 * - Open and keep a Binance websocket streams connection alive.
 * - Listen to one combined mini-ticker stream for all market updates.
 * - Persist price updates and forward them to client sockets.
 *
 * This provider deliberately uses a single `allMiniTicker` stream
 * @see https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams
 */
@Injectable()
export class BinanceProviderService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BinanceProviderService.name);
  private readonly wsUrl = this.configService.get<string>(
    'BINANCE_WS_URL',
    SPOT_WS_STREAMS_PROD_URL,
  );
  private readonly reconnectDelay = this.configService.get<number>(
    'BINANCE_WS_RECONNECT_DELAY',
    5000,
  );
  private readonly connectionMode = this.configService.get<'single' | 'pool'>(
    'BINANCE_WS_MODE',
    'single',
  );
  private readonly connectionPoolSize = this.configService.get<number>('BINANCE_WS_POOL_SIZE', 1);

  private readonly desiredSymbols = new Map<string, SymbolEntity>();

  private client: Spot | null = null;
  private connection: SpotWebsocketStreams.WebsocketStreamsConnection | null = null;
  private marketTickerStream: MarketTickerStream | null = null;

  private isBootstrapping = false;
  private isShuttingDown = false;
  private tickerProcessing: Promise<void> = Promise.resolve();

  constructor(
    private readonly configService: ConfigService,
    private readonly symbolsService: SymbolsService,
    private readonly socketsGateway: SocketsGateway,
  ) {}

  public async onModuleInit(): Promise<void> {
    void this.bootstrap().catch((error) => {
      this.logger.error(`Binance bootstrap failed: ${this.formatError(error)}`);
    });
  }

  public async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;

    try {
      this.marketTickerStream?.unsubscribe();
    } catch {
      // Best effort shutdown
    }
    this.marketTickerStream = null;

    if (this.connection) {
      await this.connection.disconnect().catch(() => null);
    }
  }

  /**
   * Bootstraps the provider by loading current symbols, connecting to Binance,
   * and starting the shared market ticker stream
   */
  public async bootstrap(): Promise<void> {
    if (this.isBootstrapping) return;
    this.isBootstrapping = true;

    try {
      await this.loadExistingSymbols();
      await this.connect();
      await this.startMarketTickerStream();
      this.logger.log(`Binance bootstrap loaded ${this.desiredSymbols.size} symbol(s)`);
    } catch (error) {
      this.logger.error(`Binance bootstrap failed: ${this.formatError(error)}`);
    } finally {
      this.isBootstrapping = false;
    }
  }

  /**
   * Establishes the Binance websocket streams connection
   */
  private async connect(): Promise<void> {
    this.client = new Spot({
      configurationWebsocketStreams: {
        wsURL: this.wsUrl,
        reconnectDelay: this.reconnectDelay,
        mode: this.connectionMode,
        poolSize: this.connectionPoolSize,
      },
    });

    this.connection = await this.client.websocketStreams.connect({
      mode: this.connectionMode,
      poolSize: this.connectionPoolSize,
    });

    this.connection.on('open', () => {
      this.logger.log('Binance websocket streams connected');
    });

    this.connection.on('close', () => {
      this.logger.warn('Binance websocket streams disconnected');
    });

    this.connection.on('error', (error) => {
      this.logger.error(`Binance websocket streams error: ${this.formatError(error)}`);
    });
  }

  /**
   * Loads all known symbols from storage into the local subscription registry
   */
  private async loadExistingSymbols(): Promise<void> {
    const symbols = await this.symbolsService.selectMany({
      projection: 'id name providerSymbol isPublic price',
      sort: { createdAt: 1 },
    });

    for (const symbol of symbols) {
      this.desiredSymbols.set(symbol.providerSymbol, symbol);
    }
  }

  /**
   * Registers a new symbol in the local registry.
   * @param symbol
   */
  public async registerSymbol(symbol: SymbolEntity): Promise<void> {
    this.desiredSymbols.set(symbol.providerSymbol, symbol);
  }

  /**
   * Updates the in-memory registry when a symbol changes
   * @param previous
   * @param current
   */
  public async syncSymbol(previous: SymbolEntity, current: SymbolEntity): Promise<void> {
    const previousProviderSymbol = previous.providerSymbol;
    const currentProviderSymbol = current.providerSymbol;

    this.desiredSymbols.delete(previousProviderSymbol);
    this.desiredSymbols.set(currentProviderSymbol, current);
  }

  /**
   * Removes a symbol from the registry.
   * @param symbol
   */
  public async unregisterSymbol(symbol: SymbolEntity): Promise<void> {
    this.desiredSymbols.delete(symbol.providerSymbol);
  }

  /**
   * Starts a single all-market mini-ticker stream and filters updates locally.
   */
  private async startMarketTickerStream(): Promise<void> {
    if (!this.connection || this.isShuttingDown || this.marketTickerStream) return;

    this.marketTickerStream = this.connection.allMiniTicker({});
    this.marketTickerStream.on('message', (data: MarketTickerBatch) => {
      void this.enqueueTickerBatch(data);
    });

    this.logger.log(
      `Subscribed Binance all-mini-ticker stream for ${this.desiredSymbols.size} tracked symbol(s)`,
    );
  }

  /**
   * Queues a batch of ticker updates so DB writes stay serialized.
   * @param data Raw all-mini-ticker payload from Binance
   */
  private enqueueTickerBatch(data: MarketTickerBatch): void {
    this.tickerProcessing = this.tickerProcessing
      .then(() => this.handleTickerBatch(data))
      .catch((error) => {
        this.logger.error(`Binance ticker batch failed: ${this.formatError(error)}`);
      });
  }

  /**
   * Applies a batch of ticker updates to the stored symbols and broadcasts them.
   * @param data Raw all-mini-ticker payload from Binance
   */
  private async handleTickerBatch(data: MarketTickerBatch): Promise<void> {
    if (!Array.isArray(data) || !data.length || this.isShuttingDown) return;

    for (const entry of data) {
      await this.handleTickerEntry(entry);
    }
  }

  /**
   * Applies a single ticker entry if the symbol is tracked.
   * @param entry Raw mini-ticker item from Binance
   */
  private async handleTickerEntry(entry: MarketTickerEntry): Promise<void> {
    const providerSymbol = entry?.s;
    const priceValue = Number(entry?.c);

    if (!providerSymbol || !Number.isFinite(priceValue)) return;

    const current = this.desiredSymbols.get(providerSymbol);
    if (!current || current.price === priceValue) return;

    const updated = await this.symbolsService.updateOne(
      { id: current.id },
      { price: priceValue, providerSymbol: current.providerSymbol },
    );

    this.desiredSymbols.set(providerSymbol, updated);
    this.socketsGateway.emitSymbolPriceChanged({
      providerSymbol,
      name: updated.name,
      price: priceValue,
    });
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return JSON.stringify(error);
  }
}
