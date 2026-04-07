//! AgentPay Agent Registry Contract
//! 
//! This contract manages AI agent registration, service offerings, and payments.
//! Agents can register themselves, list services, and receive micropayments via x402.

#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, address::Address, vec, Vec, String, 
    Env, Map, Symbol
};

/// Agent status enum
#[contracttype]
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum AgentStatus {
    Registered = 0,
    Active = 1,
    Suspended = 2,
    Paused = 3,
}

/// Service type enum
#[contracttype]
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum ServiceType {
    DataAnalysis = 0,
    ApiAccess = 1,
    ContentGeneration = 2,
    Research = 3,
    Custom = 4,
}

/// Agent data structure
#[contracttype]
#[derive(Clone)]
pub struct Agent {
    pub owner: Address,
    pub name: String,
    pub description: String,
    pub status: AgentStatus,
    pub created_at: u64,
    pub updated_at: u64,
    pub service_count: u32,
}

/// Service offering structure
#[contracttype]
#[derive(Clone)]
pub struct Service {
    pub agent_id: Address,
    pub name: String,
    pub description: String,
    pub service_type: ServiceType,
    pub price_per_call: i128,  // Price in stroops (1 XLM = 10^7 stroops)
    pub currency: String,       // "USDC" or "XLM"
    pub is_active: bool,
    pub total_calls: u64,
    pub created_at: u64,
}

/// Payment escrow structure
#[contracttype]
#[derive(Clone)]
pub struct EscrowPayment {
    pub id: u64,
    pub service_id: u32,
    pub buyer: Address,
    pub seller: Address,
    pub amount: i128,
    pub status: u32,  // 0=pending, 1=released, 2=refunded
    pub created_at: u64,
    pub released_at: u64,
}

/// Storage keys
const AGENT_PREFIX: Symbol = Symbol::new("agent");
const SERVICE_PREFIX: Symbol = Symbol::new("service");
const ESCROW_PREFIX: Symbol = Symbol::new("escrow");
const AGENT_COUNT: Symbol = Symbol::new("agent_cnt");
const SERVICE_COUNT: Symbol = Symbol::new("svc_cnt");
const ESCROW_COUNT: Symbol = Symbol::new("escrow_cnt");

/// Agent Registry Contract
#[contract]
pub struct AgentRegistryContract;

#[contractimpl]
impl AgentRegistryContract {
    /// Initialize the contract
    pub fn initialize(e: Env, admin: Address) {
        // Set the admin
        e.storage().instance().set(&Symbol::new("admin"), &admin);
        // Initialize counters
        e.storage().instance().set(&AGENT_COUNT, &0u32);
        e.storage().instance().set(&SERVICE_COUNT, &0u32);
        e.storage().instance().set(&ESCROW_COUNT, &0u64);
    }

    /// Register a new agent
    pub fn register_agent(
        e: Env,
        owner: Address,
        name: String,
        description: String,
    ) -> Address {
        // Generate agent ID (using owner address as ID)
        let agent_id = owner.clone();
        
        // Check if agent already exists
        let key = (AGENT_PREFIX.clone(), agent_id.clone());
        if e.storage().instance().get::<_, Option<Agent>>(&key).is_some() {
            panic!("Agent already registered");
        }
        
        // Get current count and increment
        let count: u32 = e.storage().instance().get(&AGENT_COUNT).unwrap_or(0);
        let new_count = count + 1;
        e.storage().instance().set(&AGENT_COUNT, &new_count);
        
        // Create agent record
        let agent = Agent {
            owner: owner.clone(),
            name: name.clone(),
            description: description.clone(),
            status: AgentStatus::Active,
            created_at: e.ledger().timestamp(),
            updated_at: e.ledger().timestamp(),
            service_count: 0,
        };
        
        // Store agent
        e.storage().instance().set(&key, &agent);
        
        // Emit event
        e.events().publish((Symbol::new("agent_registered"),), agent_id.clone());
        
        agent_id
    }

    /// Get agent details
    pub fn get_agent(e: Env, agent_id: Address) -> Option<Agent> {
        let key = (AGENT_PREFIX.clone(), agent_id);
        e.storage().instance().get(&key)
    }

    /// Update agent status
    pub fn update_agent_status(e: Env, agent_id: Address, status: AgentStatus) {
        let key = (AGENT_PREFIX.clone(), agent_id.clone());
        let mut agent: Agent = e.storage().instance().get(&key)
            .expect("Agent not found");
        
        agent.status = status;
        agent.updated_at = e.ledger().timestamp();
        
        e.storage().instance().set(&key, &agent);
    }

    /// Register a new service offering
    pub fn register_service(
        e: Env,
        agent_id: Address,
        name: String,
        description: String,
        service_type: ServiceType,
        price_per_call: i128,
        currency: String,
    ) -> u32 {
        // Verify agent exists
        let agent_key = (AGENT_PREFIX.clone(), agent_id.clone());
        let mut agent: Agent = e.storage().instance().get(&agent_key)
            .expect("Agent not found");
        
        // Get service count and increment
        let count: u32 = e.storage().instance().get(&SERVICE_COUNT).unwrap_or(0);
        let service_id = count + 1;
        e.storage().instance().set(&SERVICE_COUNT, &service_id);
        
        // Create service record
        let service = Service {
            agent_id: agent_id.clone(),
            name: name.clone(),
            description: description.clone(),
            service_type,
            price_per_call,
            currency: currency.clone(),
            is_active: true,
            total_calls: 0,
            created_at: e.ledger().timestamp(),
        };
        
        // Store service
        let key = (SERVICE_PREFIX.clone(), service_id);
        e.storage().instance().set(&key, &service);
        
        // Update agent service count
        agent.service_count += 1;
        agent.updated_at = e.ledger().timestamp();
        e.storage().instance().set(&agent_key, &agent);
        
        // Emit event
        e.events().publish((Symbol::new("service_registered"),), (agent_id, service_id));
        
        service_id
    }

    /// Get service details
    pub fn get_service(e: Env, service_id: u32) -> Option<Service> {
        let key = (SERVICE_PREFIX.clone(), service_id);
        e.storage().instance().get(&key)
    }

    /// Get services by agent
    pub fn get_services_by_agent(e: Env, agent_id: Address) -> Vec<Service> {
        let max_services: u32 = e.storage().instance().get(&SERVICE_COUNT).unwrap_or(0);
        let mut services = Vec::new(&e);
        
        for i in 1..=max_services {
            let key = (SERVICE_PREFIX.clone(), i);
            if let Some(service) = e.storage().instance().get::<_, Service>(&key) {
                if service.agent_id == agent_id && service.is_active {
                    services.push_back(service);
                }
            }
        }
        
        services
    }

    /// Create escrow payment
    pub fn create_escrow(
        e: Env,
        service_id: u32,
        buyer: Address,
        amount: i128,
    ) -> u64 {
        // Verify service exists
        let service_key = (SERVICE_PREFIX.clone(), service_id);
        let service: Service = e.storage().instance().get(&service_key)
            .expect("Service not found");
        
        if !service.is_active {
            panic!("Service is not active");
        }
        
        // Get escrow count and increment
        let count: u64 = e.storage().instance().get(&ESCROW_COUNT).unwrap_or(0);
        let escrow_id = count + 1;
        e.storage().instance().set(&ESCROW_COUNT, &escrow_id);
        
        // Create escrow record
        let escrow = EscrowPayment {
            id: escrow_id,
            service_id,
            buyer: buyer.clone(),
            seller: service.agent_id.clone(),
            amount,
            status: 0,  // pending
            created_at: e.ledger().timestamp(),
            released_at: 0,
        };
        
        // Store escrow
        let key = (ESCROW_PREFIX.clone(), escrow_id);
        e.storage().instance().set(&key, &escrow);
        
        // Emit event
        e.events().publish((Symbol::new("escrow_created"),), escrow_id);
        
        escrow_id
    }

    /// Release escrow payment (after service delivery)
    pub fn release_escrow(e: Env, escrow_id: u64) {
        let key = (ESCROW_PREFIX.clone(), escrow_id);
        let mut escrow: EscrowPayment = e.storage().instance().get(&key)
            .expect("Escrow not found");
        
        if escrow.status != 0 {
            panic!("Escrow already processed");
        }
        
        escrow.status = 1;  // released
        escrow.released_at = e.ledger().timestamp();
        
        e.storage().instance().set(&key, &escrow);
        
        // Update service call count
        let service_key = (SERVICE_PREFIX.clone(), escrow.service_id);
        let mut service: Service = e.storage().instance().get(&service_key)
            .expect("Service not found");
        service.total_calls += 1;
        e.storage().instance().set(&service_key, &service);
        
        // Emit event
        e.events().publish((Symbol::new("escrow_released"),), escrow_id);
    }

    /// Refund escrow payment
    pub fn refund_escrow(e: Env, escrow_id: u64) {
        let key = (ESCROW_PREFIX.clone(), escrow_id);
        let mut escrow: EscrowPayment = e.storage().instance().get(&key)
            .expect("Escrow not found");
        
        if escrow.status != 0 {
            panic!("Escrow already processed");
        }
        
        escrow.status = 2;  // refunded
        
        e.storage().instance().set(&key, &escrow);
        
        // Emit event
        e.events().publish((Symbol::new("escrow_refunded"),), escrow_id);
    }

    /// Get escrow details
    pub fn get_escrow(e: Env, escrow_id: u64) -> Option<EscrowPayment> {
        let key = (ESCROW_PREFIX.clone(), escrow_id);
        e.storage().instance().get(&key)
    }

    /// Get all active services
    pub fn get_all_services(e: Env) -> Vec<Service> {
        let max_services: u32 = e.storage().instance().get(&SERVICE_COUNT).unwrap_or(0);
        let mut services = Vec::new(&e);
        
        for i in 1..=max_services {
            let key = (SERVICE_PREFIX.clone(), i);
            if let Some(service) = e.storage().instance().get::<_, Service>(&key) {
                if service.is_active {
                    services.push_back(service);
                }
            }
        }
        
        services
    }

    /// Get total agent count
    pub fn get_agent_count(e: Env) -> u32 {
        e.storage().instance().get(&AGENT_COUNT).unwrap_or(0)
    }

    /// Get total service count
    pub fn get_service_count(e: Env) -> u32 {
        e.storage().instance().get(&SERVICE_COUNT).unwrap_or(0)
    }
}