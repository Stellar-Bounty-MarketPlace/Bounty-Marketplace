import {
  Contract,
  Networks,
  SorobanRpc,
  TransactionBuilder,
  BASE_FEE,
  xdr,
  Address,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk';

export type StellarNetwork = 'mainnet' | 'testnet' | 'futurenet';

export interface StellarClientConfig {
  network: StellarNetwork;
  rpcUrl: string;
  adminSecretKey?: string;
}

const NETWORK_PASSPHRASES: Record<StellarNetwork, string> = {
  mainnet: Networks.PUBLIC,
  testnet: Networks.TESTNET,
  futurenet: Networks.FUTURENET,
};

export class StellarClient {
  private server: SorobanRpc.Server;
  private networkPassphrase: string;
  private config: StellarClientConfig;

  constructor(config: StellarClientConfig) {
    this.config = config;
    this.server = new SorobanRpc.Server(config.rpcUrl, { allowHttp: true });
    this.networkPassphrase = NETWORK_PASSPHRASES[config.network];
  }

  getServer(): SorobanRpc.Server {
    return this.server;
  }

  getNetworkPassphrase(): string {
    return this.networkPassphrase;
  }

  async getAccount(publicKey: string) {
    return this.server.getAccount(publicKey);
  }

  async simulateTransaction(tx: string) {
    return this.server.simulateTransaction(
      TransactionBuilder.fromXDR(tx, this.networkPassphrase),
    );
  }

  async submitTransaction(tx: string) {
    const transaction = TransactionBuilder.fromXDR(tx, this.networkPassphrase);
    return this.server.sendTransaction(transaction);
  }

  async waitForTransaction(hash: string, maxAttempts = 30): Promise<SorobanRpc.Api.GetTransactionResponse> {
    let attempts = 0;
    while (attempts < maxAttempts) {
      const result = await this.server.getTransaction(hash);
      if (result.status !== SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) {
        return result;
      }
      await new Promise((r) => setTimeout(r, 2000));
      attempts++;
    }
    throw new Error(`Transaction ${hash} not found after ${maxAttempts} attempts`);
  }

  buildContractCall(
    contractAddress: string,
    method: string,
    args: xdr.ScVal[],
  ): Contract {
    return new Contract(contractAddress);
  }

  encodeAddress(address: string): xdr.ScVal {
    return new Address(address).toScVal();
  }

  encodeU128(value: bigint): xdr.ScVal {
    return nativeToScVal(value, { type: 'u128' });
  }

  encodeString(value: string): xdr.ScVal {
    return nativeToScVal(value, { type: 'string' });
  }

  decodeResult(result: xdr.ScVal): unknown {
    return scValToNative(result);
  }
}
