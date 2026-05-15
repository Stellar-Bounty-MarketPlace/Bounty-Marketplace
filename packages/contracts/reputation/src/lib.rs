#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    symbol_short, Address, Env, String, Symbol, Vec,
};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum ReputationTier {
    Newcomer,
    Contributor,
    Trusted,
    Expert,
    Elite,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct ContributorReputation {
    pub address: Address,
    pub score: i64,
    pub tier: ReputationTier,
    pub bounties_completed: u32,
    pub bounties_attempted: u32,
    pub last_updated: u64,
}

#[contracttype]
pub enum DataKey {
    Reputation(Address),
    Admin,
}

const TIER_CHANGED: Symbol = symbol_short!("TIER_CHG");
const SCORE_UPDATED: Symbol = symbol_short!("SCORE_UP");

#[contract]
pub struct ReputationContract;

#[contractimpl]
impl ReputationContract {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn update_score(
        env: Env,
        contributor: Address,
        delta: i64,
        bounty_completed: bool,
    ) -> ContributorReputation {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("not initialized");
        admin.require_auth();

        let key = DataKey::Reputation(contributor.clone());
        let mut rep: ContributorReputation = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or(ContributorReputation {
                address: contributor.clone(),
                score: 0,
                tier: ReputationTier::Newcomer,
                bounties_completed: 0,
                bounties_attempted: 0,
                last_updated: env.ledger().timestamp(),
            });

        let old_tier = rep.tier.clone();
        rep.score = (rep.score + delta).max(0);
        rep.last_updated = env.ledger().timestamp();

        if bounty_completed {
            rep.bounties_completed += 1;
            rep.bounties_attempted += 1;
        }

        rep.tier = Self::compute_tier(rep.score);

        if rep.tier != old_tier {
            env.events()
                .publish((TIER_CHANGED, contributor.clone()), rep.tier.clone());
        }

        env.events()
            .publish((SCORE_UPDATED, contributor), (rep.score, delta));

        env.storage().persistent().set(&key, &rep);
        rep
    }

    pub fn get_reputation(env: Env, contributor: Address) -> Option<ContributorReputation> {
        env.storage()
            .persistent()
            .get(&DataKey::Reputation(contributor))
    }

    pub fn get_score(env: Env, contributor: Address) -> i64 {
        env.storage()
            .persistent()
            .get::<DataKey, ContributorReputation>(&DataKey::Reputation(contributor))
            .map(|r| r.score)
            .unwrap_or(0)
    }

    fn compute_tier(score: i64) -> ReputationTier {
        match score {
            0..=99 => ReputationTier::Newcomer,
            100..=499 => ReputationTier::Contributor,
            500..=1499 => ReputationTier::Trusted,
            1500..=4999 => ReputationTier::Expert,
            _ => ReputationTier::Elite,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_reputation_progression() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, ReputationContract);
        let client = ReputationContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let contributor = Address::generate(&env);

        client.initialize(&admin);

        // Start at 0
        assert_eq!(client.get_score(&contributor), 0);

        // Complete a bounty (+50)
        let rep = client.update_score(&contributor, &50, &true);
        assert_eq!(rep.score, 50);
        assert_eq!(rep.tier, ReputationTier::Newcomer);

        // Reach Contributor tier
        client.update_score(&contributor, &60, &true);
        let rep = client.get_reputation(&contributor).unwrap();
        assert_eq!(rep.tier, ReputationTier::Contributor);
        assert_eq!(rep.bounties_completed, 2);
    }
}
