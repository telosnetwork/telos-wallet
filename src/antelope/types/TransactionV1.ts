export interface TransactionV1 {
  id: string;
  trx: {
    receipt: {
      status: string;
      cpu_usage_us: number;
      net_usage_words: number;
    };
    trx: {
      expiration: string;
      ref_block_num: number;
      ref_block_prefix: number;
      max_net_usage_words: number;
      max_cpu_usage_ms: number;
      delay_sec: number;
    };
  };
  block_time: string;
  block_num: number;
  last_irreversible_block: number;
}

export interface TransactionValueData {
    amount: number;
    symbol: string;
    fiatValue?: number;
}

export interface ShapedTransactionRow {
    id: string;
    epoch: number;
    // action should be 'send', 'receive', 'swap', or some other action like 'approve'
    // a swap is either 'swapExactTokensForTokens' or 'swapExactETHForTokens'
    actionName: string;
    from: string; // address
    fromPrettyName?: string;
    to: string; // address
    toPrettyName?: string;
    valuesIn: TransactionValueData[];
    valuesOut: TransactionValueData[];
    gasUsed?: number;
    gasFiatValue?: number;
    failed?: boolean;
}
