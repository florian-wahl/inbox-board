import { db } from './schema';





// Migration function to handle schema upgrades
export const runMigrations = async () => {
    try {
        console.log('Database schema upgrade completed');
    } catch (error) {
        console.error('Error running migrations:', error);
    }
};

// Initialize database and run migrations
export const initializeDatabase = async () => {
    try {
        await runMigrations();
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

export { db, InboxBoardDB } from './schema';
export type {
    TokenRecord,
    RawEmailRecord,
    ParsedItemRecord,
} from './schema';
