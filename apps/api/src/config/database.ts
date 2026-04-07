import { agentDb, serviceDb, paymentDb } from './inMemoryDb';

export async function connectDatabase(): Promise<void> {
  console.log('Using in-memory database (no PostgreSQL required)');
}

export { agentDb, serviceDb, paymentDb };