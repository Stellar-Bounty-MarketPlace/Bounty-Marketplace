import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BountyService } from './bounty.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

// GraphQL types would be defined with @ObjectType decorators in a full implementation.
// This resolver wires the service to GraphQL for subscriptions and complex queries.

@Resolver('Bounty')
@UseGuards(JwtAuthGuard)
export class BountyResolver {
  constructor(private bountyService: BountyService) {}

  @Query(() => String, { name: 'bounty' })
  async getBounty(@Args('id', { type: () => ID }) id: string) {
    return this.bountyService.findById(id);
  }
}
