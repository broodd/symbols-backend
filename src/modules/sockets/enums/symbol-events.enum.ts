export enum SymbolEventsEnum {
  SUBSCRIBE = 'SYMBOL:SUBSCRIBE',
  UNSUBSCRIBE = 'SYMBOL:UNSUBSCRIBE',
  PRICE_CHANGED = 'SYMBOL:PRICE_CHANGED',
}

export const addSymbolPrefix = (...strings: string[]): string => {
  return 'SYMBOL:' + strings.join(':');
};
