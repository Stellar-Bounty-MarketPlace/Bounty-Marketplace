#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    token, Address, Env, String, Symbol,
};

// ============================================================
// Data Types
// ============================================================

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum BountyStatus {
    Open,
    InProgress,
    InReview,
    Completed,
    Disputed,
    Cancelled,
    Expired,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct BountyState {
    pub id: String,
    pub creator: Address,
    pub contributor: Option<Address>,
    pub amount: i128,
    pub token: Address,
    pub status: BountyStatus,
    pub created_at: u64,
    pub expires_at: u64,
    pub platform_fee_bps: u32,
}

#[contracttype]
pub enum DataKey {
    Bounty(String),
    Admin,
    PlatformFeeRecipient,
    TotalBounties,
}

// ============================================================
// Events
// ============================================================

const BOUNTY_CREATED: Symbol = symbol_short!("CREATED");
const BOUNTY_FUNDED: Symbol = symbol_short!("FUNDED");
const BOUNTY_ASSIGNED: Symbol = symbol_short!("ASSIGNED");
const BOUNTY_COMPLETED: Symbol = symbol_short!("COMPLETED");
const BOUNTY_CANCELLED: Symbol = symbol_short!("CANCELLED");
const PAYOUT_RELEASED: Symbol = symbol_short!("PAYOUT");
const DISPUTE_OPENED: Symbol = symbol_short!("DISPUTE");

// ============================================================
// Contract
// ============================================================

#[contract]
pub struct BountyEscrowContract;

#[contractimpl]
impl BountyEscrowContract {
    /// Initialize the contract with admin and fee recipient.
    pub fn initialize(
        env: Env,
        admin: Address,
        fee_recipient: Address,
    ) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::PlatformFeeRecipient, &fee_recipient);
        env.storage().instance().set(&DataKey::TotalBounties, &0u64);
    }

    /// Create and fund a bounty escrow.
    /// The creator must approve the token transfer before calling this.
    pub fn create_bounty(
        env: Env,
        bounty_id: String,
        creator: Address,
        amount: i128,
        token: Address,
        expires_at: u64,
    ) -> BountyState {
        creator.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }
        if expires_at <= env.ledger().timestamp() {
            panic!("expiry must be in the future");
        }

        let key = DataKey::Bounty(bounty_id.clone());
        if env.storage().persistent().has(&key) {
            panic!("bounty already exists");
        }

        // Transfer tokens from creator to contract
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&creator, &env.current_contract_address(), &amount);

        let state = BountyState {
            id: bounty_id.clone(),
            creator: creator.clone(),
            contributor: None,
            amount,
            token,
            status: BountyStatus::Open,
            created_at: env.ledger().timestamp(),
            expires_at,
            platform_fee_bps: 250, // 2.5%
        };

        env.storage().persistent().set(&key, &state);

        // Increment counter
        let count: u64 = env.storage().instance().get(&DataKey::TotalBounties).unwrap_or(0);
        env.storage().instance().set(&DataKey::TotalBounties, &(count + 1));

        env.events().publish((BOUNTY_CREATED, bounty_id), (creator, amount));

        state
    }

    /// Assign a contributor to the bounty. Only the creator can call this.
    pub fn assign_contributor(
        env: Env,
        bounty_id: String,
        contributor: Address,
    ) -> BountyState {
        let key = DataKey::Bounty(bounty_id.clone());
        let mut state: BountyState = env
            .storage()
            .persistent()
            .get(&key)
            .expect("bounty not found");

        state.creator.require_auth();

        if state.status != BountyStatus::Open {
            panic!("bounty is not open");
        }

        state.contributor = Some(contributor.clone());
        state.status = BountyStatus::InProgress;

        env.storage().persistent().set(&key, &state);
        env.events().publish((BOUNTY_ASSIGNED, bounty_id), contributor);

        state
    }

    /// Submit bounty for review. Only the assigned contributor can call this.
    pub fn submit_for_review(env: Env, bounty_id: String) -> BountyState {
        let key = DataKey::Bounty(bounty_id.clone());
        let mut state: BountyState = env
            .storage()
            .persistent()
            .get(&key)
            .expect("bounty not found");

        let contributor = state.contributor.clone().expect("no contributor assigned");
        contributor.require_auth();

        if state.status != BountyStatus::InProgress {
            panic!("bounty is not in progress");
        }

        state.status = BountyStatus::InReview;
        env.storage().persistent().set(&key, &state);

        state
    }

    /// Release payout to contributor. Only the creator or admin can call this.
    pub fn release_payout(env: Env, bounty_id: String) -> i128 {
        let key = DataKey::Bounty(bounty_id.clone());
        let mut state: BountyState = env
            .storage()
            .persistent()
            .get(&key)
            .expect("bounty not found");

        state.creator.require_auth();

        if state.status != BountyStatus::InReview {
            panic!("bounty is not in review");
        }

        let contributor = state.contributor.clone().expect("no contributor assigned");

        // Compute platform fee
        let fee = (state.amount * state.platform_fee_bps as i128) / 10_000;
        let payout = state.amount - fee;

        let token_client = token::Client::new(&env, &state.token);
        let fee_recipient: Address = env
            .storage()
            .instance()
            .get(&DataKey::PlatformFeeRecipient)
            .expect("fee recipient not set");

        // Transfer payout to contributor
        token_client.transfer(&env.current_contract_address(), &contributor, &payout);

        // Transfer fee to platform
        if fee > 0 {
            token_client.transfer(&env.current_contract_address(), &fee_recipient, &fee);
        }

        state.status = BountyStatus::Completed;
        env.storage().persistent().set(&key, &state);

        env.events().publish((PAYOUT_RELEASED, bounty_id), (contributor, payout, fee));

        payout
    }

    /// Open a dispute. Either creator or contributor can call this.
    pub fn open_dispute(env: Env, bounty_id: String, caller: Address) -> BountyState {
        caller.require_auth();

        let key = DataKey::Bounty(bounty_id.clone());
        let mut state: BountyState = env
            .storage()
            .persistent()
            .get(&key)
            .expect("bounty not found");

        let is_creator = state.creator == caller;
        let is_contributor = state.contributor.as_ref().map_or(false, |c| c == &caller);

        if !is_creator && !is_contributor {
            panic!("caller is not creator or contributor");
        }

        let disputable = matches!(
            state.status,
            BountyStatus::InProgress | BountyStatus::InReview
        );
        if !disputable {
            panic!("bounty cannot be disputed in current status");
        }

        state.status = BountyStatus::Disputed;
        env.storage().persistent().set(&key, &state);

        env.events().publish((DISPUTE_OPENED, bounty_id), caller);

        state
    }

    /// Resolve dispute. Only admin can call this.
    pub fn resolve_dispute(
        env: Env,
        bounty_id: String,
        contributor_share_bps: u32, // 0-10000 (basis points)
    ) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("admin not set");
        admin.require_auth();

        if contributor_share_bps > 10_000 {
            panic!("share must be <= 10000 bps");
        }

        let key = DataKey::Bounty(bounty_id.clone());
        let mut state: BountyState = env
            .storage()
            .persistent()
            .get(&key)
            .expect("bounty not found");

        if state.status != BountyStatus::Disputed {
            panic!("bounty is not disputed");
        }

        let token_client = token::Client::new(&env, &state.token);

        let contributor_amount = (state.amount * contributor_share_bps as i128) / 10_000;
        let creator_amount = state.amount - contributor_amount;

        if let Some(ref contributor) = state.contributor {
            if contributor_amount > 0 {
                token_client.transfer(
                    &env.current_contract_address(),
                    contributor,
                    &contributor_amount,
                );
            }
        }

        if creator_amount > 0 {
            token_client.transfer(
                &env.current_contract_address(),
                &state.creator,
                &creator_amount,
            );
        }

        state.status = BountyStatus::Completed;
        env.storage().persistent().set(&key, &state);
    }

    /// Cancel an open bounty and refund creator.
    pub fn cancel_bounty(env: Env, bounty_id: String) -> BountyState {
        let key = DataKey::Bounty(bounty_id.clone());
        let mut state: BountyState = env
            .storage()
            .persistent()
            .get(&key)
            .expect("bounty not found");

        state.creator.require_auth();

        if !matches!(state.status, BountyStatus::Open) {
            panic!("can only cancel open bounties");
        }

        // Refund creator
        let token_client = token::Client::new(&env, &state.token);
        token_client.transfer(
            &env.current_contract_address(),
            &state.creator,
            &state.amount,
        );

        state.status = BountyStatus::Cancelled;
        env.storage().persistent().set(&key, &state);

        env.events().publish((BOUNTY_CANCELLED, bounty_id), state.creator.clone());

        state
    }

    /// Get bounty state.
    pub fn get_bounty(env: Env, bounty_id: String) -> Option<BountyState> {
        env.storage()
            .persistent()
            .get(&DataKey::Bounty(bounty_id))
    }

    /// Get total bounty count.
    pub fn total_bounties(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::TotalBounties)
            .unwrap_or(0)
    }
}

// ============================================================
// Tests
// ============================================================

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, Ledger},
        token::{Client as TokenClient, StellarAssetClient},
        Env, String,
    };

    fn setup() -> (Env, BountyEscrowContractClient<'static>, Address, Address, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, BountyEscrowContract);
        let client = BountyEscrowContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let fee_recipient = Address::generate(&env);
        let creator = Address::generate(&env);
        let contributor = Address::generate(&env);

        client.initialize(&admin, &fee_recipient);

        (env, client, admin, fee_recipient, creator, contributor)
    }

    fn create_token(env: &Env, admin: &Address) -> (Address, TokenClient, StellarAssetClient) {
        let token_id = env.register_stellar_asset_contract_v2(admin.clone());
        let token_client = TokenClient::new(env, &token_id.address());
        let asset_client = StellarAssetClient::new(env, &token_id.address());
        (token_id.address(), token_client, asset_client)
    }

    #[test]
    fn test_create_and_fund_bounty() {
        let (env, client, admin, _, creator, _) = setup();
        let (token_addr, token_client, asset_client) = create_token(&env, &admin);

        // Mint tokens to creator
        asset_client.mint(&creator, &10_000);

        env.ledger().with_mut(|l| l.timestamp = 1000);

        let bounty_id = String::from_str(&env, "bounty-001");
        let state = client.create_bounty(
            &bounty_id,
            &creator,
            &5_000,
            &token_addr,
            &(1000 + 30 * 24 * 3600),
        );

        assert_eq!(state.status, BountyStatus::Open);
        assert_eq!(state.amount, 5_000);
        assert_eq!(token_client.balance(&creator), 5_000);
    }

    #[test]
    fn test_full_bounty_lifecycle() {
        let (env, client, admin, fee_recipient, creator, contributor) = setup();
        let (token_addr, token_client, asset_client) = create_token(&env, &admin);

        asset_client.mint(&creator, &10_000);
        env.ledger().with_mut(|l| l.timestamp = 1000);

        let bounty_id = String::from_str(&env, "bounty-002");

        // Create
        client.create_bounty(&bounty_id, &creator, &10_000, &token_addr, &(1000 + 86400));

        // Assign
        client.assign_contributor(&bounty_id, &contributor);

        // Submit
        client.submit_for_review(&bounty_id);

        // Release payout
        let payout = client.release_payout(&bounty_id);

        // 2.5% fee = 250, payout = 9750
        assert_eq!(payout, 9_750);
        assert_eq!(token_client.balance(&contributor), 9_750);
        assert_eq!(token_client.balance(&fee_recipient), 250);

        let state = client.get_bounty(&bounty_id).unwrap();
        assert_eq!(state.status, BountyStatus::Completed);
    }

    #[test]
    fn test_dispute_resolution() {
        let (env, client, admin, _, creator, contributor) = setup();
        let (token_addr, token_client, asset_client) = create_token(&env, &admin);

        asset_client.mint(&creator, &10_000);
        env.ledger().with_mut(|l| l.timestamp = 1000);

        let bounty_id = String::from_str(&env, "bounty-003");
        client.create_bounty(&bounty_id, &creator, &10_000, &token_addr, &(1000 + 86400));
        client.assign_contributor(&bounty_id, &contributor);
        client.open_dispute(&bounty_id, &creator);

        // 50/50 split
        client.resolve_dispute(&bounty_id, &5_000);

        assert_eq!(token_client.balance(&contributor), 5_000);
        assert_eq!(token_client.balance(&creator), 5_000);
    }

    #[test]
    fn test_cancel_bounty() {
        let (env, client, admin, _, creator, _) = setup();
        let (token_addr, token_client, asset_client) = create_token(&env, &admin);

        asset_client.mint(&creator, &5_000);
        env.ledger().with_mut(|l| l.timestamp = 1000);

        let bounty_id = String::from_str(&env, "bounty-004");
        client.create_bounty(&bounty_id, &creator, &5_000, &token_addr, &(1000 + 86400));

        assert_eq!(token_client.balance(&creator), 0);

        client.cancel_bounty(&bounty_id);

        // Refunded
        assert_eq!(token_client.balance(&creator), 5_000);
    }
}
