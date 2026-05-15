import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BountyService } from './bounty.service';
import { BountyStatus } from '@bounty/database';
import { BountyDifficulty, BountyCategory } from '@bounty/shared';

// Mock dependencies
const mockDb = {
  bounty: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
  },
  repository: {
    findUnique: vi.fn(),
  },
  contributorProfile: {
    findUnique: vi.fn(),
  },
  dispute: {
    create: vi.fn(),
  },
};

const mockRedis = {
  getJson: vi.fn().mockResolvedValue(null),
  setJson: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
  delPattern: vi.fn().mockResolvedValue(undefined),
};

const mockNotifications = {
  send: vi.fn().mockResolvedValue(undefined),
};

describe('BountyService', () => {
  let service: BountyService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BountyService(
      mockDb as unknown as Parameters<typeof BountyService.prototype.create>[1] extends never ? never : never,
      mockRedis as never,
      mockNotifications as never,
    );
    // Direct injection for testing
    (service as unknown as { db: typeof mockDb }).db = mockDb;
    (service as unknown as { redis: typeof mockRedis }).redis = mockRedis;
    (service as unknown as { notifications: typeof mockNotifications }).notifications = mockNotifications;
  });

  describe('create', () => {
    it('should create a bounty when repository exists', async () => {
      const mockRepo = { id: 'repo-1', fullName: 'stellar/test' };
      const mockBounty = {
        id: 'bounty-1',
        title: 'Test bounty',
        status: BountyStatus.OPEN,
        milestones: [],
        repository: mockRepo,
        creator: { id: 'user-1', displayName: 'Alice', avatarUrl: null, githubUsername: 'alice' },
      };

      mockDb.repository.findUnique.mockResolvedValue(mockRepo);
      mockDb.bounty.create.mockResolvedValue(mockBounty);

      const result = await service.create(
        {
          title: 'Test bounty',
          description: 'A test bounty',
          difficulty: BountyDifficulty.INTERMEDIATE,
          category: BountyCategory.BUG_FIX,
          amount: 500,
          currency: 'USDC',
          repositoryId: 'repo-1',
        },
        'user-1',
      );

      expect(result).toEqual(mockBounty);
      expect(mockDb.bounty.create).toHaveBeenCalledOnce();
    });

    it('should throw NotFoundException when repository does not exist', async () => {
      mockDb.repository.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          {
            title: 'Test',
            description: 'Test',
            difficulty: BountyDifficulty.BEGINNER,
            category: BountyCategory.BUG_FIX,
            amount: 100,
            currency: 'USDC',
            repositoryId: 'nonexistent',
          },
          'user-1',
        ),
      ).rejects.toThrow('Repository not found');
    });
  });

  describe('assign', () => {
    it('should assign contributor to open bounty', async () => {
      const mockBounty = {
        id: 'bounty-1',
        status: BountyStatus.OPEN,
        creatorId: 'user-1',
        creator: { id: 'user-1' },
      };
      const mockContributor = {
        id: 'contrib-1',
        userId: 'user-2',
        user: { displayName: 'Bob' },
      };
      const updatedBounty = { ...mockBounty, status: BountyStatus.IN_PROGRESS, assigneeId: 'contrib-1' };

      mockDb.bounty.findUnique.mockResolvedValue(mockBounty);
      mockDb.contributorProfile.findUnique.mockResolvedValue(mockContributor);
      mockDb.bounty.update.mockResolvedValue(updatedBounty);

      const result = await service.assign('bounty-1', 'contrib-1', 'user-1');

      expect(result.status).toBe(BountyStatus.IN_PROGRESS);
      expect(mockNotifications.send).toHaveBeenCalledWith('user-2', expect.objectContaining({
        type: 'BOUNTY_ASSIGNED',
      }));
    });

    it('should throw ForbiddenException when non-creator tries to assign', async () => {
      mockDb.bounty.findUnique.mockResolvedValue({
        id: 'bounty-1',
        status: BountyStatus.OPEN,
        creatorId: 'user-1',
        creator: { id: 'user-1' },
      });

      await expect(
        service.assign('bounty-1', 'contrib-1', 'user-2'),
      ).rejects.toThrow('Only the bounty creator can assign contributors');
    });

    it('should throw BadRequestException when bounty is not open', async () => {
      mockDb.bounty.findUnique.mockResolvedValue({
        id: 'bounty-1',
        status: BountyStatus.IN_PROGRESS,
        creatorId: 'user-1',
        creator: { id: 'user-1' },
      });

      await expect(
        service.assign('bounty-1', 'contrib-1', 'user-1'),
      ).rejects.toThrow('Cannot assign bounty in status');
    });
  });

  describe('openDispute', () => {
    it('should open dispute on in-review bounty', async () => {
      const mockBounty = { id: 'bounty-1', status: BountyStatus.IN_REVIEW };
      const mockDispute = { id: 'dispute-1', bountyId: 'bounty-1', reason: 'Work incomplete' };

      mockDb.bounty.findUnique.mockResolvedValue(mockBounty);
      mockDb.dispute.create.mockResolvedValue(mockDispute);
      mockDb.bounty.update.mockResolvedValue({ ...mockBounty, status: BountyStatus.DISPUTED });

      const result = await service.openDispute('bounty-1', 'user-1', 'Work incomplete');

      expect(result).toEqual(mockDispute);
      expect(mockDb.bounty.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: BountyStatus.DISPUTED } }),
      );
    });
  });
});
