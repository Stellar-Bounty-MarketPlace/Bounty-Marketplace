import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EscrowStatus } from '@bounty/database';
import { Keypair } from '@stellar/stellar-sdk';
import { StellarClient, BountyContract } from '@bounty/sdk';

import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);
  private stellarClient: StellarClient;
  private bountyContract: BountyContract;
  private adminKeypair: Keypair;

  constructor(
    private db: DatabaseService,
    private redis: RedisService,
    private config: ConfigService,
  ) {
    this.stellarClient = new StellarClient({
      network: config.get<'testnet' | 'mainnet'>('STELLAR_NETWORK', 'testnet'),
      rpcUrl: config.get<string>('STELLAR_RPC_URL', 'https://soroban-testnet.stellar.org'),
    });

    this.bountyContract = new BountyContract(
      config.get<string>('BOUNTY_CONTRACT_ADDRESS', ''),
      this.stellarClient,
    );

    const secretKey = config.get<string>('STELLAR_ADMIN_SECRET_KEY', '');
    if (secretKey) {
      this.adminKeypair = Keypair.fromSecret(secretKey);
    } else {
      // Dev fallback — random keypair
      this.adminKeypair = Keypair.random();
      this.logger.warn('No STELLAR_ADMIN_SECRET_KEY set — using random keypair (dev only)');
    }
  }

  async fundBounty(bountyId: string, funderAddress: string): Promise<{ txHash: string }> {
    const bounty = await this.db.bounty.findUnique({
      where: { id: bountyId },
      include: { escrowState: true },
    });
    if (!bounty) throw new NotFoundException('Bounty not found');
    if (bounty.escrowState?.status === EscrowStatus.FUNDED) {
      throw new BadRequestException('Bounty is already funded');
    }

    const amount = BigInt(Math.round(Number(bounty.amount) * 10_000_000)); // stroops

    const txHash = await this.bountyContract.createBounty(
      {
        bountyId: bounty.id,
        creator: funderAddress,
        amount,
        tokenAddress: this.getTokenAddress(bounty.currency),
        expiresAt: bounty.expiresAt
          ? Math.floor(bounty.expiresAt.getTime() / 1000)
          : Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
      },
      this.adminKeypair,
    );

    await this.db.escrowState.upsert({
      where: { bountyId },
      create: {
        bountyId,
        contractAddress: this.config.get('BOUNTY_CONTRACT_ADDRESS', ''),
        fundedAmount: bounty.amount,
        currency: bounty.currency,
        status: EscrowStatus.FUNDED,
        fundTxHash: txHash,
      },
      update: {
        status: EscrowStatus.FUNDED,
        fundTxHash: txHash,
      },
    });

    this.logger.log(`Bounty ${bountyId} funded on-chain: ${txHash}`);
    return { txHash };
  }

  async releasePayout(bountyId: string): Promise<{ txHash: string }> {
    const bounty = await this.db.bounty.findUnique({
      where: { id: bountyId },
      include: { escrowState: true, assignee: { include: { user: true } } },
    });

    if (!bounty) throw new NotFoundException('Bounty not found');
    if (!bounty.escrowState || bounty.escrowState.status !== EscrowStatus.FUNDED) {
      throw new BadRequestException('Bounty escrow is not in funded state');
    }
    if (!bounty.assignee?.user.walletAddress) {
      throw new BadRequestException('Contributor has no wallet address configured');
    }

    const txHash = await this.bountyContract.releasePayout(
      { bountyId, caller: this.adminKeypair.publicKey() },
      this.adminKeypair,
    );

    await Promise.all([
      this.db.escrowState.update({
        where: { bountyId },
        data: {
          status: EscrowStatus.FULLY_RELEASED,
          releasedAmount: bounty.escrowState.fundedAmount,
          releaseTxHash: txHash,
        },
      }),
      this.db.contributorProfile.update({
        where: { id: bounty.assigneeId! },
        data: { totalEarned: { increment: bounty.amount } },
      }),
    ]);

    this.logger.log(`Payout released for bounty ${bountyId}: ${txHash}`);
    return { txHash };
  }

  async getEscrowState(bountyId: string) {
    const state = await this.db.escrowState.findUnique({ where: { bountyId } });
    if (!state) return null;

    // Optionally sync with on-chain state
    const onchain = await this.bountyContract.getBountyState(bountyId);
    return { ...state, onchain };
  }

  private getTokenAddress(currency: string): string {
    const tokens: Record<string, string> = {
      XLM: 'native',
      USDC: this.config.get('USDC_CONTRACT_ADDRESS', 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA'),
    };
    return tokens[currency] ?? 'native';
  }
}
