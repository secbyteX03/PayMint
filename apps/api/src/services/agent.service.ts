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
    
    // Add all provided fields (trim newlines and whitespace)
    console.log('Registering agent with description:', JSON.stringify(description));
    if (description) insertData.description = description.trim();
    if (apiEndpoint) insertData.apiEndpoint = apiEndpoint;
    if (webhookUrl) insertData.webhookUrl = webhookUrl;
    if (documentationUrl) insertData.documentationUrl = documentationUrl;
    if (supportEmail) insertData.supportEmail = supportEmail;
    if (logoUrl) insertData.logoUrl = logoUrl;
    if (websiteUrl) insertData.websiteUrl = websiteUrl;
    if (termsOfServiceUrl) insertData.termsOfServiceUrl = termsOfServiceUrl;
    if (pricingModel) insertData.pricingModel = pricingModel;
    if (pricePerCall) insertData.pricePerCall = pricePerCall;
    if (capabilities && capabilities.length > 0) insertData.capabilities = capabilities;
    if (apiKey) insertData.apiKey = apiKey;
    
    const { error } = await supabase
      .from('agents')
      .insert(insertData);

    if (error) {
      console.error('Agent insert error:', error);
      // Try with minimal data and then update
      const minimalData = { ownerAddress, name };
      const { error: retryError } = await supabase
        .from('agents')
        .insert(minimalData);
      
      if (retryError) {
        console.error('Minimal insert error:', retryError);
        throw new Error(retryError.message);
      }
      
      // Fetch the newly created agent
      const { data: newAgent } = await supabase
        .from('agents')
        .select()
        .eq('ownerAddress', ownerAddress)
        .eq('name', name)
        .single();
      
      // Update with remaining fields
      if (newAgent) {
        const updateData: any = {};
        if (description && description.trim()) updateData.description = description.trim();
        if (apiEndpoint) updateData.apiEndpoint = apiEndpoint;
        if (webhookUrl) updateData.webhookUrl = webhookUrl;
        if (documentationUrl) updateData.documentationUrl = documentationUrl;
        if (supportEmail) updateData.supportEmail = supportEmail;
        if (logoUrl) updateData.logoUrl = logoUrl;
        if (websiteUrl) updateData.websiteUrl = websiteUrl;
        if (termsOfServiceUrl) updateData.termsOfServiceUrl = termsOfServiceUrl;
        if (pricingModel) updateData.pricingModel = pricingModel;
        if (pricePerCall) updateData.pricePerCall = pricePerCall;
        if (capabilities && capabilities.length > 0) updateData.capabilities = capabilities;
        if (apiKey) updateData.apiKey = apiKey;
        
        if (Object.keys(updateData).length > 0) {
          await supabase
            .from('agents')
            .update(updateData)
            .eq('id', newAgent.id);
        }
        
        // Fetch updated agent
        const { data: updatedAgent } = await supabase
          .from('agents')
          .select()
          .eq('id', newAgent.id)
          .single();
        
        return updatedAgent;
      }
      
      return newAgent;
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
    
    // Get all service IDs
    const serviceIds = services?.map(s => s.id) || [];
    
    // Fetch all payments for these services
    let totalRevenue = 0;
    let totalPayments = 0;
    
    if (serviceIds.length > 0) {
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .in('serviceId', serviceIds)
        .eq('status', 'COMPLETED');
      
      // Calculate total revenue from completed payments
      totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      
      // Get all payments (not just completed) for API call count
      const { data: allPayments } = await supabase
        .from('payments')
        .select('id')
        .in('serviceId', serviceIds);
      
      totalPayments = allPayments?.length || 0;
    }

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
    // Try to update all fields
    try {
      const { data: agent, error } = await supabase
        .from('agents')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (!error) return agent;
      
      // If error, check if it's a schema cache issue
      if (error.message.includes('schema cache')) {
        console.log('Schema cache error, trying minimal update');
      } else {
        throw new Error(error.message);
      }
    } catch (err) {
      console.log('Update error:', (err as Error).message);
    }
    
    // Fallback: only update guaranteed columns
    const safeFields = ['name', 'description'];
    const updateData: any = {};
    
    for (const field of safeFields) {
      if (data[field as keyof typeof data] !== undefined) {
        updateData[field] = data[field as keyof typeof data];
      }
    }

    const { data: agent, error } = await supabase
      .from('agents')
      .update(updateData)
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
