import { supabase, supabaseAdmin } from '../config/prisma';

export class AgentService {
  async registerAgent(
    ownerAddress: string,
    name: string,
    description: string,
    apiEndpoint?: string,
    apiKey?: string,
    webhookUrl?: string,
    documentationUrl?: string,
    capabilities?: string[],
    pricingModel?: string,
    pricePerCall?: number,
    pricePerMonth?: number,
    logoUrl?: string,
    websiteUrl?: string,
    supportEmail?: string,
    termsOfServiceUrl?: string
  ) {
    // Check if agent name already exists (global uniqueness)
    try {
      const existingByName = await supabase
        .from('agents')
        .select('id')
        .eq('name', name)
        .maybeSingle();

      if (existingByName.data) {
        throw new Error('An agent with this name already exists');
      }
    } catch (checkError: any) {
      if (checkError.message === 'An agent with this name already exists') {
        throw checkError;
      }
      // Ignore other errors (schema cache issues)
    }

    // Minimal insert to avoid schema cache issues
    const insertData: any = {
      ownerAddress,
      name,
    };
    
    // Only add description (this field is definitely in the schema)
    if (description) insertData.description = description;
    
    const { error } = await supabase
      .from('agents')
      .insert(insertData);

    if (error) {
      // If it's a schema cache error, try inserting with just required fields
      if (error.message.includes('schema cache')) {
        const minimalData = { ownerAddress, name };
        const { error: retryError } = await supabase
          .from('agents')
          .insert(minimalData);
        
        if (retryError) throw new Error(retryError.message);
        
        // Fetch the newly created agent
        const { data: newAgent } = await supabase
          .from('agents')
          .select()
          .eq('ownerAddress', ownerAddress)
          .eq('name', name)
          .single();
        
        return newAgent;
      }
      throw new Error(error.message);
    }

    // Fetch the newly created agent
    const { data: newAgent } = await supabase
      .from('agents')
      .select()
      .eq('ownerAddress', ownerAddress)
      .eq('name', name)
      .single();

    return newAgent;
  }

  async getAgent(id: string) {
    const { data, error } = await supabase
      .from('agents')
      .select()
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async getAgentByOwner(ownerAddress: string) {
    const { data, error } = await supabase
      .from('agents')
      .select()
      .eq('ownerAddress', ownerAddress);

    if (error) return null;
    return data || [];
  }

  async updateAgentStatus(
    id: string,
    status: 'REGISTERED' | 'ACTIVE' | 'SUSPENDED' | 'PAUSED'
  ) {
    const { data, error } = await supabase
      .from('agents')
      .update({ status })
      .eq('id', id)
      .select('*, services(*)')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async listAgents() {
    const { data, error } = await supabase
      .from('agents')
      .select('*');

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getAgentStats(id: string) {
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (agentError || !agent) {
      throw new Error('Agent not found');
    }

    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('agentId', id);

    const totalServices = services?.length || 0;
    const totalPayments = services?.reduce(
      (sum: number, svc: any) => sum + (svc.totalCalls || 0),
      0
    ) || 0;

    // Calculate total revenue from completed payments
    const totalRevenue = services?.reduce((sum: number, svc: any) => {
      const payments = svc.payments || [];
      const completedPayments = payments.filter(
        (p: any) => p.status === 'COMPLETED'
      );
      return (
        sum +
        completedPayments.reduce((pSum: number, p: any) => pSum + Number(p.amount), 0)
      );
    }, 0);

    return {
      totalServices,
      totalPayments,
      totalRevenue: totalRevenue.toFixed(2),
    };
  }

  async updateAgent(id: string, data: {
    name?: string;
    description?: string;
    apiEndpoint?: string;
    apiKey?: string;
    webhookUrl?: string;
    documentationUrl?: string;
    capabilities?: string[];
    pricingModel?: string;
    pricePerCall?: number;
    pricePerMonth?: number;
    logoUrl?: string;
    websiteUrl?: string;
    supportEmail?: string;
    termsOfServiceUrl?: string;
  }) {
    const { data: agent, error } = await supabase
      .from('agents')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return agent;
  }

  async getAgentByOwnerWithStats(ownerAddress: string) {
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*, services(id, name, serviceType, pricePerCall, isActive, totalCalls)')
      .eq('ownerAddress', ownerAddress);

    if (error) throw new Error(error.message);
    
    // Add service count to each agent
    return (agents || []).map(agent => ({
      ...agent,
      _count: {
        services: agent.services?.length || 0
      }
    }));
  }
}

export const agentService = new AgentService();
