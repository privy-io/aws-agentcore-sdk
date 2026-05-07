export type ChainType = "base" | "solana";

export interface PositionView {
  icon: string | null;
  chain: string;
  symbol: string;
  name: string;
  amount: number;
  value: number;
}

export interface WalletBalance {
  address: string;
  chainType: ChainType;
  total: number;
  positions: PositionView[];
}
