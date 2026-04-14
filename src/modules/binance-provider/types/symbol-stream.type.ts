import { SpotWebsocketStreams } from '@binance/spot';

export type MarketTickerStream = ReturnType<
  SpotWebsocketStreams.WebsocketStreamsConnection['allMiniTicker']
>;

export type MarketTickerEntry = {
  s?: string;
  c?: string;
};

export type MarketTickerBatch = MarketTickerEntry[];
