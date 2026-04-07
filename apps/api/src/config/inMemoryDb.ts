// In-memory database for demo purposes (no PostgreSQL required)
export interface Agent {
  id: string;
  ownerAddress: string;
  name: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  agentId: string;
  name: string;
  description: string;
  serviceType: string;
  pricePerCall: number;
  currency: string;
  isActive: boolean;
  totalCalls: number;
  createdAt: Date;
}

export interface Payment {
  id: string;
  serviceId: string;
  buyerAddress: string;
  sellerAddress: string;
  amount: number;
  currency: string;
  status: string;
  transactionHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory stores
const agents: Map<string, Agent> = new Map();
const services: Map<string, Service> = new Map();
const payments: Map<string, Payment> = new Map();

// Helper to generate IDs
function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Agent operations
export const agentDb = {
  create(data: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Agent {
    const existing = Array.from(agents.values()).find(
      (a) => a.ownerAddress === data.ownerAddress
    );
    if (existing) throw new Error('Agent already registered');

    const agent: Agent = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    agents.set(agent.id, agent);
    return agent;
  },

  findById(id: string): Agent | undefined {
    return agents.get(id);
  },

  findByOwner(address: string): Agent | undefined {
    return Array.from(agents.values()).find((a) => a.ownerAddress === address);
  },

  findAll(): Agent[] {
    return Array.from(agents.values());
  },

  update(id: string, data: Partial<Agent>): Agent | undefined {
    const agent = agents.get(id);
    if (!agent) return undefined;
    const updated = { ...agent, ...data, updatedAt: new Date() };
    agents.set(id, updated);
    return updated;
  },

  delete(id: string): boolean {
    return agents.delete(id);
  },

  deleteAll(): void {
    agents.clear();
  },
};

// Service operations
export const serviceDb = {
  create(data: Omit<Service, 'id' | 'createdAt' | 'totalCalls'>): Service {
    const service: Service = {
      ...data,
      id: generateId(),
      totalCalls: 0,
      createdAt: new Date(),
    };
    services.set(service.id, service);
    return service;
  },

  findById(id: string): Service | undefined {
    return services.get(id);
  },

  findByAgentId(agentId: string): Service[] {
    return Array.from(services.values()).filter((s) => s.agentId === agentId);
  },

  findAllActive(): Service[] {
    return Array.from(services.values()).filter((s) => s.isActive);
  },

  findAll(): Service[] {
    return Array.from(services.values());
  },

  update(id: string, data: Partial<Service>): Service | undefined {
    const service = services.get(id);
    if (!service) return undefined;
    const updated = { ...service, ...data };
    services.set(id, updated);
    return updated;
  },

  incrementCalls(id: string): void {
    const service = services.get(id);
    if (service) {
      service.totalCalls += 1;
      services.set(id, service);
    }
  },
};

// Payment operations
export const paymentDb = {
  create(data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Payment {
    const payment: Payment = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    payments.set(payment.id, payment);
    return payment;
  },

  findById(id: string): Payment | undefined {
    return payments.get(id);
  },

  findByServiceId(serviceId: string): Payment[] {
    return Array.from(payments.values()).filter((p) => p.serviceId === serviceId);
  },

  findAll(): Payment[] {
    return Array.from(payments.values());
  },

  update(id: string, data: Partial<Payment>): Payment | undefined {
    const payment = payments.get(id);
    if (!payment) return undefined;
    const updated = { ...payment, ...data, updatedAt: new Date() };
    payments.set(id, updated);
    return updated;
  },
};

console.log('In-memory database initialized');