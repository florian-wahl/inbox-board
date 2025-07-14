import { db } from '../db';

export const purgeDatabase = async (): Promise<void> => {
    try {
        console.log('Purging database...');

        // Clear all tables
        await db.tokens.clear();
        await db.rawEmails.clear();
        await db.parsedItems.clear();

        console.log('Database purged successfully');
    } catch (error) {
        console.error('Error purging database:', error);
        throw error;
    }
};

export const getDatabaseStats = async (): Promise<{
    tokens: number;
    rawEmails: number;
    parsedItems: number;
}> => {
    try {
        const tokens = await db.tokens.count();
        const rawEmails = await db.rawEmails.count();
        const parsedItems = await db.parsedItems.count();

        return { tokens, rawEmails, parsedItems };
    } catch (error) {
        console.error('Error getting database stats:', error);
        return { tokens: 0, rawEmails: 0, parsedItems: 0 };
    }
}; 