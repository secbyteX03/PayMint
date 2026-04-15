//! Simple Escrow Contract for AgentPay
//! 
//! This contract holds funds in escrow and releases them based on admin decisions.

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, Symbol,
};

/// Escrow status
#[contracttype]
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum EscrowStatus {
    Pending = 0,   // Funds locked, waiting for resolution
    Released = 1,  // Funds released to seller
    Refunded = 2,  // Funds refunded to buyer
}

/// Escrow data structure
#[contracttype]
#[derive(Clone)]
pub struct Escrow {
    pub id: u64,
    pub buyer: Address,
    pub seller: Address,
    pub amount: i128,      // Amount in stroops (1 XLM = 10^7 stroops)
    pub status: EscrowStatus,
    pub created_at: u64,
    pub released_at: u64,
}

/// Storage key helpers - Symbol::new requires &Env at runtime
fn admin_key(e: &Env) -> Symbol {
    Symbol::new(e, "admin")
}

fn esc_count_key(e: &Env) -> Symbol {
    Symbol::new(e, "esc_cnt")
}

fn esc_event_key(e: &Env, name: &str) -> Symbol {
    Symbol::new(e, name)
}

// Storage key constants - use small u64 for data keys (Symbol is reserved for string keys)
const ESCROW_DATA_KEY: u64 = 1;  // Base for escrow data storage

/// Get escrow storage key - use u64 directly for instance storage
fn escrow_data_key(escrow_id: u64) -> u64 {
    // Combine prefix with id to create unique key
    ESCROW_DATA_KEY * 100000 + escrow_id
}

/// Simple Escrow Contract
#[contract]
pub struct SimpleEscrowContract;

#[contractimpl]
impl SimpleEscrowContract {
    /// Initialize the contract with the admin address
    pub fn initialize(e: Env, admin: Address) {
        let key = admin_key(&e);
        e.storage().instance().set(&key, &admin);
        
        let count_key = esc_count_key(&e);
        e.storage().instance().set(&count_key, &0u64);
    }

    /// Get the admin address
    pub fn get_admin(e: Env) -> Address {
        let key = admin_key(&e);
        e.storage().instance().get(&key).unwrap()
    }

    /// Create a new escrow - deposits funds into the contract
    pub fn create_escrow(
        e: Env,
        buyer: Address,
        seller: Address,
        amount: i128,
    ) -> u64 {
        // Increment escrow count
        let count_key = esc_count_key(&e);
        let count: u64 = e.storage().instance().get(&count_key).unwrap_or(0);
        let escrow_id = count + 1;
        e.storage().instance().set(&count_key, &escrow_id);

        // Create escrow record
        let escrow = Escrow {
            id: escrow_id,
            buyer,
            seller,
            amount,
            status: EscrowStatus::Pending,
            created_at: e.ledger().timestamp(),
            released_at: 0,
        };

        // Store escrow using u64 key
        let key = escrow_data_key(escrow_id);
        e.storage().instance().set(&key, &escrow);

        // Emit event
        let event_key = esc_event_key(&e, "escrow_created");
        e.events().publish((event_key,), escrow_id);

        escrow_id
    }

    /// Release escrow funds to seller (called by admin)
    pub fn release_to_seller(e: Env, escrow_id: u64) {
        let key = escrow_data_key(escrow_id);
        let mut escrow: Escrow = e.storage().instance().get(&key)
            .expect("Escrow not found");

        if escrow.status != EscrowStatus::Pending {
            panic!("Escrow already processed");
        }

        // Update status
        escrow.status = EscrowStatus::Released;
        escrow.released_at = e.ledger().timestamp();
        e.storage().instance().set(&key, &escrow);

        // Emit event
        let event_key = esc_event_key(&e, "escrow_released");
        e.events().publish((event_key,), escrow_id);
    }

    /// Refund escrow funds to buyer (called by admin)
    pub fn refund_to_buyer(e: Env, escrow_id: u64) {
        let key = escrow_data_key(escrow_id);
        let mut escrow: Escrow = e.storage().instance().get(&key)
            .expect("Escrow not found");

        if escrow.status != EscrowStatus::Pending {
            panic!("Escrow already processed");
        }

        // Update status
        escrow.status = EscrowStatus::Refunded;
        escrow.released_at = e.ledger().timestamp();
        e.storage().instance().set(&key, &escrow);

        // Emit event
        let event_key = esc_event_key(&e, "escrow_refunded");
        e.events().publish((event_key,), escrow_id);
    }

    /// Get escrow details
    pub fn get_escrow(e: Env, escrow_id: u64) -> Option<Escrow> {
        let key = escrow_data_key(escrow_id);
        e.storage().instance().get(&key)
    }

    /// Get escrow status
    pub fn get_escrow_status(e: Env, escrow_id: u64) -> Option<EscrowStatus> {
        let key = escrow_data_key(escrow_id);
        e.storage().instance().get::<u64, Escrow>(&key).map(|esc| esc.status)
    }
}
