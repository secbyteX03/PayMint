import { supabase } from '../config/prisma';

export class ServiceService {
  async registerService(
    agentId: string,
    name: string,
    description: string,
    serviceType: string,
    pricePerCall: number,
    currency: string,
    endpoint?: string,
    method?: string,
    rateLimit?: number,
    timeout?: number,
    retryPolicy?: string,
    responseFormat?: string,
    schema?: string,
    usageExamples?: string[]
  ) {
    // Verify agent exists
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      throw new Error('Agent not found');
    }

    const { data, error } = await supabase
      .from('services')
      .insert({
        agentId,
        name,
        description,
        serviceType: serviceType || 'CUSTOM',
        pricePerCall,
        currency: currency || 'USDC',
        isActive: true,
        endpoint,
        method: method || 'POST',
        rateLimit,
        timeout,
        retryPolicy,
        responseFormat,
        schema,
        usageExamples,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getService(id: string) {
    const { data, error } = await supabase
      .from('services')
      .select()
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async getServicesByAgent(agentId: string) {
    const { data, error } = await supabase
      .from('services')
      .select()
      .eq('agentId', agentId)
      .eq('isActive', true);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async listActiveServices() {
    const { data, error } = await supabase
      .from('services')
      .select()
      .eq('isActive', true);

    if (error) throw new Error(error.message);
    return data || [];
  }

  async updateServiceStatus(id: string, isActive: boolean) {
    const { data, error } = await supabase
      .from('services')
      .update({ isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async incrementServiceCalls(id: string) {
    // First get current count
    const { data: service, error: fetchError } = await supabase
      .from('services')
      .select('totalCalls')
      .eq('id', id)
      .single();

    if (fetchError || !service) {
      throw new Error('Service not found');
    }

    const { data, error } = await supabase
      .from('services')
      .update({ totalCalls: (service.totalCalls || 0) + 1 })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async updateService(id: string, data: {
    name?: string;
    description?: string;
    serviceType?: string;
    pricePerCall?: number;
    currency?: string;
    endpoint?: string;
    method?: string;
    rateLimit?: number;
    timeout?: number;
    retryPolicy?: string;
    responseFormat?: string;
    schema?: string;
    usageExamples?: string[];
  }) {
    const { data: service, error } = await supabase
      .from('services')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return service;
  }

  async deleteService(id: string) {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async listAllServicesWithAgent() {
    const { data, error } = await supabase
      .from('services')
      .select('*');

    if (error) throw new Error(error.message);
    return data || [];
  }
}

export const serviceService = new ServiceService();
