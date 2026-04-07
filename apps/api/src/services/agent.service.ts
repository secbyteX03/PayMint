import { agentDb, serviceDb, Agent, Service } from '../config/inMemoryDb';

export class AgentService {
  async registerAgent(
    ownerAddress: string,
    name: string,
    description: string
  ): Promise<Agent> {
    // Check if agent already exists
    const existing = agentDb.findByOwner(ownerAddress);

    if (existing) {
      throw new Error('Agent already registered');
    }

    // Create new agent
    const agent = agentDb.create({
      ownerAddress,
      name,
      description,
      status: 'ACTIVE',
    });

    return agent;
  }

  async getAgent(id: string): Promise<Agent | null> {
    const agent = agentDb.findById(id);
    if (!agent) return null;
    
    // Include services
    const services = serviceDb.findByAgentId(id);
    return { ...agent, services } as any;
  }

  async getAgentByOwner(ownerAddress: string): Promise<Agent | null> {
    const agent = agentDb.findByOwner(ownerAddress);
    if (!agent) return null;
    
    // Include services
    const services = serviceDb.findByAgentId(agent.id);
    return { ...agent, services } as any;
  }

  async updateAgentStatus(
    id: string,
    status: 'REGISTERED' | 'ACTIVE' | 'SUSPENDED' | 'PAUSED'
  ): Promise<Agent | null> {
    return agentDb.update(id, { status }) || null;
  }

  async listAgents(): Promise<Agent[]> {
    return agentDb.findAll();
  }

  async getAgentStats(id: string): Promise<{
    totalServices: number;
    totalPayments: number;
    totalRevenue: string;
  }> {
    const agent = agentDb.findById(id);

    if (!agent) {
      throw new Error('Agent not found');
    }

    const services = serviceDb.findByAgentId(id);
    const totalServices = services.length;
    const totalPayments = services.reduce((sum, svc) => sum + svc.totalCalls, 0);
    const totalRevenue = '0.00';

    return { totalServices, totalPayments, totalRevenue };
  }
}