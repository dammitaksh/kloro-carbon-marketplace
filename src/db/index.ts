import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Please define it in your environment.');
}

// Basic connection (Neon serverless)
const sql = neon(DATABASE_URL);

export const db = drizzle({ 
  client: sql,
  logger: process.env.NODE_ENV === 'development' ? {
    logQuery: (query: string) => {
      if (query.includes('session') && query.includes('SELECT')) {
        console.log('🔍 DB Session Query:', query.substring(0, 100) + (query.length > 100 ? '...' : ''));
      }
    }
  } : false
});
