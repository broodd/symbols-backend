import { SpotWebsocketStreams } from 'node_modules/@binance/spot/dist';

export type SymbolStream = ReturnType<
  SpotWebsocketStreams.WebsocketStreamsConnection['miniTicker']
>;

export type StreamTask = () => Promise<void>;
