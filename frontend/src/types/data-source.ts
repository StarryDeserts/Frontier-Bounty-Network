export type ConfiguredDataMode = 'auto' | 'indexer' | 'chain-direct';

export type ActiveDataMode = 'indexer' | 'chain-direct';

export type DataModeReason =
  | 'forced'
  | 'indexer_healthy'
  | 'indexer_unconfigured'
  | 'indexer_unreachable';

export interface DataSourceStatus {
  mode: ActiveDataMode;
  configuredMode: ConfiguredDataMode;
  reason: DataModeReason;
  indexerUrl: string | null;
  checkedAt: number;
}
