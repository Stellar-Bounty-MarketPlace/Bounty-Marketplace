import {
  Contract,
  TransactionBuilder,
  BASE_FEE,
  Keypair,
  Operation,
  SorobanRpc,
  xdr,
  nativeToScVal,
  Address,
} from '@stellar/stellar-sdk';

import type { StellarClient } from './client';

export interface CreateBountyParams {
  bountyId: string;
  creator: string;
  amount: bigint;
  tokenAddress: string;
  expiresAt: number;
}

export interface AssignContributorParams {
  bountyId: string;
  contributor: string;
  caller: string;
}

export interface ReleasePayout {
  bountyId: string;
  caller: string;
}

export interface OnchainBountyState {
  id: string;
  creator: string;
  contributor: string | null;
  amount: bigint;
  token: string;
  status: number;
  createdAt: number;
  expiresAt: number;
}

export class BountyContract {
  private contract: Contract;
  private client: StellarClient;

  constructor(contractAddress: string, client: StellarClient) {
    this.contract = new Contract(contractAddress);
    this.client = client;
  }

  async createBounty(
    params: CreateBountyParams,
    signerKeypair: Keypair,
  ): Promise<string> {
    const account = await this.client.getAccount(signerKeypair.publicKey());

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.client.getNetworkPassphrase(),
    })
      .addOperation(
        this.contract.call(
          'create_bounty',
          nativeToScVal(params.bountyId, { type: 'string' }),
          new Address(params.creator).toScVal(),
          nativeToScVal(params.amount, { type: 'u128' }),
          new Address(params.tokenAddress).toScVal(),
          nativeToScVal(params.expiresAt, { type: 'u64' }),
        ),
      )
      .setTimeout(30)
      .build();

    const simResult = await this.client.getServer().simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationError(simResult)) {
      throw new Error(`Simulation failed: ${simResult.error}`);
    }

    const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
    preparedTx.sign(signerKeypair);

    const result = await this.client.getServer().sendTransaction(preparedTx);
    if (result.status === 'ERROR') {
      throw new Error(`Transaction failed: ${result.errorResult?.toXDR('base64')}`);
    }

    const finalResult = await this.client.waitForTransaction(result.hash);
    if (finalResult.status !== SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
      throw new Error(`Transaction not successful: ${finalResult.status}`);
    }

    return result.hash;
  }

  async assignContributor(
    params: AssignContributorParams,
    signerKeypair: Keypair,
  ): Promise<string> {
    const account = await this.client.getAccount(signerKeypair.publicKey());

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.client.getNetworkPassphrase(),
    })
      .addOperation(
        this.contract.call(
          'assign_contributor',
          nativeToScVal(params.bountyId, { type: 'string' }),
          new Address(params.contributor).toScVal(),
        ),
      )
      .setTimeout(30)
      .build();

    const simResult = await this.client.getServer().simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationError(simResult)) {
      throw new Error(`Simulation failed: ${simResult.error}`);
    }

    const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
    preparedTx.sign(signerKeypair);

    const result = await this.client.getServer().sendTransaction(preparedTx);
    const finalResult = await this.client.waitForTransaction(result.hash);

    if (finalResult.status !== SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
      throw new Error('Assign contributor transaction failed');
    }

    return result.hash;
  }

  async releasePayout(params: ReleasePayout, signerKeypair: Keypair): Promise<string> {
    const account = await this.client.getAccount(signerKeypair.publicKey());

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.client.getNetworkPassphrase(),
    })
      .addOperation(
        this.contract.call(
          'release_payout',
          nativeToScVal(params.bountyId, { type: 'string' }),
        ),
      )
      .setTimeout(30)
      .build();

    const simResult = await this.client.getServer().simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationError(simResult)) {
      throw new Error(`Simulation failed: ${simResult.error}`);
    }

    const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
    preparedTx.sign(signerKeypair);

    const result = await this.client.getServer().sendTransaction(preparedTx);
    const finalResult = await this.client.waitForTransaction(result.hash);

    if (finalResult.status !== SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
      throw new Error('Release payout transaction failed');
    }

    return result.hash;
  }

  async getBountyState(bountyId: string): Promise<OnchainBountyState | null> {
    try {
      const key = xdr.LedgerKey.contractData(
        new xdr.LedgerKeyContractData({
          contract: this.contract.address().toScAddress(),
          key: nativeToScVal(bountyId, { type: 'string' }),
          durability: xdr.ContractDataDurability.persistent(),
        }),
      );

      const result = await this.client.getServer().getLedgerEntries(key);
      if (!result.entries.length) return null;

      const entry = result.entries[0];
      if (!entry?.val) return null;

      const data = entry.val.contractData().val();
      return this.client.decodeResult(data) as OnchainBountyState;
    } catch {
      return null;
    }
  }
}
