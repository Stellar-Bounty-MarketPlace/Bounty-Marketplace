import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bountyhub.dev' },
    update: {},
    create: {
      email: 'admin@bountyhub.dev',
      githubId: '1000001',
      githubUsername: 'bountyhub-admin',
      displayName: 'BountyHub Admin',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1000001',
      role: 'ADMIN',
      isVerified: true,
    },
  });

  // Create maintainer
  const maintainer = await prisma.user.upsert({
    where: { email: 'maintainer@example.com' },
    update: {},
    create: {
      email: 'maintainer@example.com',
      githubId: '1000002',
      githubUsername: 'alice-maintainer',
      displayName: 'Alice Chen',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1000002',
      role: 'MAINTAINER',
      isVerified: true,
    },
  });

  // Create contributors
  const contributor1 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      githubId: '1000003',
      githubUsername: 'bob-dev',
      displayName: 'Bob Martinez',
      avatarUrl: 'https://avatars.githubusercontent.com/u/1000003',
      role: 'CONTRIBUTOR',
      isVerified: true,
      contributor: {
        create: {
          githubUsername: 'bob-dev',
          bio: 'Full-stack developer specializing in Rust and TypeScript',
          skills: ['Rust', 'TypeScript', 'React', 'PostgreSQL'],
          reputationScore: 1850,
          reputationTier: 'EXPERT',
          totalEarned: 12500,
          bountiesCompleted: 23,
          bountiesAttempted: 26,
          avgDeliveryDays: 4.2,
        },
      },
    },
  });

  // Create repository
  const repo = await prisma.repository.upsert({
    where: { githubId: '500001' },
    update: {},
    create: {
      githubId: '500001',
      fullName: 'stellar/soroban-examples',
      name: 'soroban-examples',
      owner: 'stellar',
      description: 'Example contracts for Soroban smart contract platform',
      url: 'https://github.com/stellar/soroban-examples',
      stars: 1240,
      forks: 380,
      openIssues: 42,
      language: 'Rust',
      languages: { Rust: 95000, TypeScript: 12000, Shell: 3000 },
      topics: ['stellar', 'soroban', 'smart-contracts', 'rust', 'blockchain'],
      maintainerId: maintainer.id,
      healthScore: 0.87,
    },
  });

  // Create bounties
  await prisma.bounty.createMany({
    skipDuplicates: true,
    data: [
      {
        title: 'Implement token vesting contract with cliff period',
        description: 'Build a production-grade token vesting contract on Soroban with configurable cliff periods, linear vesting schedules, and emergency revocation capabilities.',
        status: 'OPEN',
        difficulty: 'ADVANCED',
        category: 'FEATURE',
        amount: 2500,
        currency: 'USDC',
        repositoryId: repo.id,
        issueNumber: 142,
        issueUrl: 'https://github.com/stellar/soroban-examples/issues/142',
        creatorId: maintainer.id,
        tags: ['rust', 'soroban', 'defi', 'vesting'],
      },
      {
        title: 'Fix memory leak in event subscription handler',
        description: 'Investigate and fix the memory leak reported in the WebSocket event subscription handler that causes OOM after ~48h of uptime.',
        status: 'OPEN',
        difficulty: 'INTERMEDIATE',
        category: 'BUG_FIX',
        amount: 800,
        currency: 'USDC',
        repositoryId: repo.id,
        issueNumber: 156,
        issueUrl: 'https://github.com/stellar/soroban-examples/issues/156',
        creatorId: maintainer.id,
        tags: ['rust', 'memory', 'websocket', 'bug'],
      },
      {
        title: 'Add comprehensive test suite for AMM contract',
        description: 'Write a complete test suite covering edge cases, invariants, and fuzz testing for the automated market maker contract.',
        status: 'IN_PROGRESS',
        difficulty: 'ADVANCED',
        category: 'TESTING',
        amount: 1500,
        currency: 'USDC',
        repositoryId: repo.id,
        issueNumber: 163,
        creatorId: maintainer.id,
        assigneeId: (await prisma.contributorProfile.findUnique({ where: { githubUsername: 'bob-dev' } }))?.id,
        tags: ['rust', 'testing', 'amm', 'defi'],
      },
    ],
  });

  console.log('✅ Seed complete');
  console.log(`   Admin: ${admin.email}`);
  console.log(`   Maintainer: ${maintainer.githubUsername}`);
  console.log(`   Contributor: ${contributor1.githubUsername}`);
  console.log(`   Repository: ${repo.fullName}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
