export interface SwapQuote {
  buyAmount: string;
  sellAmount: string;
  buyToken: string;
  sellToken: string;
  price: string;
  guaranteedPrice: string;
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice: string;
  estimatedGas: string;
  protocolFee: string;
  minimumProtocolFee: string;
  buyTokenToEthRate: string;
  sellTokenToEthRate: string;
  sources: SwapSource[];
  route?: SwapRoute;
  permit2?: {
    type: string;
    hash: string;
    eip712: {
      domain: Record<string, unknown>;
      types: Record<string, unknown[]>;
      primaryType: string;
      message: Record<string, unknown>;
    };
  };
  transaction?: {
    to: string;
    data: string;
    gas: string;
    gasPrice: string;
    value: string;
  };
}

export interface SwapSource {
  name: string;
  proportion: string;
}

export interface SwapRoute {
  fills: RouteFill[];
}

export interface RouteFill {
  from: string;
  to: string;
  source: string;
  proportionBps: string;
}

export interface SwapParams {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  takerAddress?: string;
  slippageBps?: number;
}

export interface SwapTransaction {
  hash: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  amountUSD: number;
  route: string[];
  timestamp: number;
  status: "pending" | "success" | "failed";
}
