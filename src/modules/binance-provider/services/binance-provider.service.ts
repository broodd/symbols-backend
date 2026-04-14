import { SPOT_WS_STREAMS_PROD_URL, SpotWebsocketStreams, Spot } from '@binance/spot';

import { OnModuleDestroy, OnModuleInit, Injectable, Logger } from '@nestjs/common';

import { ConfigService } from 'src/config';

import { SocketsGateway } from 'src/modules/sockets/services';
import { SymbolsService } from 'src/modules/symbols/services';
import { SymbolEntity } from 'src/modules/symbols/entities';

import { SymbolStream, StreamTask } from '../types/symbol-stream.type';

/**
 * Keeps Binance websocket streams in sync with stored symbols.
 *
 * Responsibilities:
 * - Load existing symbols from storage on startup.
 * - Open and keep a Binance websocket streams connection alive.
 * - Subscribe and unsubscribe streams when symbols change.
 * - Persist price updates and forward them to client sockets.
 *
 * Binance stream limits are handled with a small token bucket:
 * - 5 stream operations per second.
 * - Reconnect/renewal is delegated to `@binance/spot`.
 *
 * @see https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams
 * @see https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams#websocket-limits
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
  private readonly messageLimit = this.configService.get<number>('BINANCE_WS_MESSAGE_LIMIT', 5);

  private readonly desiredSymbols = new Map<string, SymbolEntity>();
  private readonly activeStreams = new Map<string, SymbolStream>();
  private readonly queue: StreamTask[] = [];

  private client: Spot | null = null;
  private connection: SpotWebsocketStreams.WebsocketStreamsConnection | null = null;
  private refillTimer: NodeJS.Timeout | null = null;
  private availableTokens = this.messageLimit;
  private isBootstrapping = false;
  private isShuttingDown = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly symbolsService: SymbolsService,
    private readonly socketsGateway: SocketsGateway,
  ) {}

  public async onModuleInit(): Promise<void> {
    await this.bootstrap();
  }

  public async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;
    if (this.refillTimer) clearInterval(this.refillTimer);

    for (const stream of this.activeStreams.values()) {
      try {
        stream.unsubscribe();
      } catch {
        // Best effort shutdown
      }
    }
    this.activeStreams.clear();

    if (this.connection) {
      await this.connection.disconnect().catch(() => null);
    }
  }

  /**
   * Bootstraps the provider by loading current symbols, connecting to Binance,
   * and subscribing to every active provider symbol
   */
  public async bootstrap(): Promise<void> {
    if (this.isBootstrapping) return;
    this.isBootstrapping = true;

    try {
      await this.loadExistingSymbols();
      await this.connect();
      this.startTokenRefill();
      await this.enqueueMany(
        Array.from(this.desiredSymbols.values()).map(
          (symbol) => () => this.subscribeSymbolNow(symbol),
        ),
      );
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

    if (symbols.length > 1024)
      throw new Error('Binance websocket streams limit exceeded: max 1024 streams per connection');

    for (const symbol of symbols) {
      this.desiredSymbols.set(symbol.providerSymbol, symbol);
    }
  }

  /**
   * Registers a new symbol and subscribes to its Binance stream.
   * @param symbol
   */
  public async registerSymbol(symbol: SymbolEntity): Promise<void> {
    this.desiredSymbols.set(symbol.providerSymbol, symbol);
    await this.enqueue(() => this.subscribeSymbolNow(symbol));
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

    if (previousProviderSymbol !== currentProviderSymbol) {
      await this.enqueue(() => this.unsubscribeSymbolNow(previousProviderSymbol));
      await this.enqueue(() => this.subscribeSymbolNow(current));
    }
  }

  /**
   * Removes a symbol from the registry and unsubscribes its Binance stream.
   * @param symbol
   */
  public async unregisterSymbol(symbol: SymbolEntity): Promise<void> {
    this.desiredSymbols.delete(symbol.providerSymbol);
    await this.enqueue(() => this.unsubscribeSymbolNow(symbol.providerSymbol));
  }

  /**
   * Subscribes to a Binance mini-ticker stream for one symbol.
   * @param symbol
   */
  private async subscribeSymbolNow(symbol: SymbolEntity): Promise<void> {
    if (!this.connection || this.isShuttingDown) return;
    if (this.activeStreams.has(symbol.providerSymbol)) return;

    const stream = this.connection.miniTicker({ symbol: symbol.providerSymbol });
    const onMessage = async (data: SpotWebsocketStreams.MiniTickerResponse) => {
      await this.handleTicker(symbol.providerSymbol, data);
    };

    stream.on('message', onMessage);
    this.activeStreams.set(symbol.providerSymbol, stream);
  }

  /**
   * Stops listening to a Binance stream for one symbol.
   * @param providerSymbol
   */
  private async unsubscribeSymbolNow(providerSymbol: string): Promise<void> {
    const stream = this.activeStreams.get(providerSymbol);
    if (!stream) return;

    try {
      stream.unsubscribe();
    } finally {
      this.activeStreams.delete(providerSymbol);
    }
  }

  /**
   * Applies a ticker update to the stored symbol and broadcasts it to clients.
   * @param providerSymbol
   * @param data Raw mini-ticker payload from Binance
   */
  private async handleTicker(
    providerSymbol: string,
    data: SpotWebsocketStreams.MiniTickerResponse,
  ): Promise<void> {
    const nextPrice = Number(data?.c);
    if (!Number.isFinite(nextPrice)) return;

    const current = this.desiredSymbols.get(providerSymbol);
    if (!current || current.price === nextPrice) return;

    const updated = await this.symbolsService.updateOne(
      { id: current.id },
      { price: nextPrice, providerSymbol: current.providerSymbol },
    );

    this.desiredSymbols.set(providerSymbol, updated);
    this.socketsGateway.emitSymbolPriceChanged({
      providerSymbol,
      name: updated.name,
      price: nextPrice,
    });
  }

  /**
   * Enqueues a stream task and enforces the 5 messages-per-second limit.
   * @param task Async stream operation
   */
  private async enqueue(task: StreamTask): Promise<void> {
    if (this.availableTokens > 0) {
      this.availableTokens = this.availableTokens - 1;
      await task();

      return;
    }

    await new Promise<void>((resolve) => {
      this.queue.push(async () => {
        try {
          await task();
        } catch (error) {
          this.logger.error(`Binance stream task failed: ${this.formatError(error)}`);
        } finally {
          resolve();
        }
      });
    });
  }

  /**
   * Runs a batch of stream tasks sequentially.
   *
   * @param tasks List of async stream operations.
   */
  private async enqueueMany(tasks: StreamTask[]): Promise<void> {
    for (const task of tasks) {
      await this.enqueue(task);
    }
  }

  /**
   * Resets the available token budget once per second.
   */
  private startTokenRefill(): void {
    if (this.refillTimer) return;

    this.refillTimer = setInterval(() => {
      this.availableTokens = this.messageLimit;
      this.drainQueue();
    }, 1000);
  }

  /**
   * Drains the pending task queue while tokens are available.
   */
  private drainQueue(): void {
    while (this.availableTokens > 0 && this.queue.length > 0) {
      const task = this.queue.shift();
      if (!task) return;

      this.availableTokens -= 1;
      // Fire-and-forget is intentional here
      void task().catch((error) => {
        this.logger.error(`Binance stream task failed: ${this.formatError(error)}`);
      });
    }
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return JSON.stringify(error);
  }
}
