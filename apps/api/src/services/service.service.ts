import { serviceDb, agentDb, Service } from '../config/inMemoryDb';

export class ServiceService {
  async registerService(
    agentId: string,
    name: string,
    description: string,
    serviceType: string,
    pricePerCall: number,
    currency: string
  ): Promise<Service> {
    // Verify agent exists
    const agent = agentDb.findById(agentId);

    if (!agent) {
      throw new Error('Agent not found');
    }

    return serviceDb.create({
      agentId,
      name,
      description,
      serviceType,
      pricePerCall,
      currency,
      isActive: true,
    });
  }

  async getService(id: string): Promise<Service | null> {
    const service = serviceDb.findById(id);
    if (!service) return null;
    
    const agent = agentDb.findById(service.agentId);
    return { ...service, agent } as any;
  }

  async getServicesByAgent(agentId: string): Promise<Service[]> {
    return serviceDb.findByAgentId(agentId).filter(s => s.isActive);
  }

  async listActiveServices(): Promise<Service[]> {
    const services = serviceDb.findAllActive();
    return services.map(service => {
      const agent = agentDb.findById(service.agentId);
      return { ...service, agent } as any;
    });
  }

  async updateServiceStatus(id: string, isActive: boolean): Promise<Service | null> {
    return serviceDb.update(id, { isActive }) || null;
  }

  async incrementServiceCalls(id: string): Promise<Service | null> {
    serviceDb.incrementCalls(id);
    return serviceDb.findById(id) || null;
  }
}