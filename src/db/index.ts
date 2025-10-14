import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Please define it in your environment.');
}

// Add connection configuration for better reliability
const sql = neon(DATABASE_URL, {
  // Increase timeouts for serverless connections
  connectionTimeoutMs: 15000,
  queryTimeoutMs: 30000,
});

export const db = drizzle({ 
  client: sql,
  // Add logging in development
  logger: process.env.NODE_ENV === 'development' ? {
    logQuery: (query: string, params: unknown[]) => {
      // Only log session-related queries that are failing
      if (query.includes('session') && query.includes('SELECT')) {
        console.log('🔍 DB Session Query:', query.substring(0, 100) + (query.length > 100 ? '...' : ''));
      }
    }
  } : false
});
