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





export const decodeExistingEmails = async (): Promise<{ updated: number; total: number }> => {
    try {
        console.log('Decoding existing email content...');

        const rawEmailRecords = await db.rawEmails.toArray();
        let updatedCount = 0;

        for (const record of rawEmailRecords) {
            let needsUpdate = false;
            const updates: any = {};

            // Check if data looks like base64 before trying to decode
            const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;

            if (record.fullBody) {
                const data = record.fullBody;
                if (base64Regex.test(data) && data.length % 4 === 0) {
                    try {
                        const decoded = atob(data);
                        if (decoded !== data) {
                            updates.fullBody = decoded;
                            needsUpdate = true;
                            console.log(`Decoded fullBody for email ${record.gmailId}`);
                        }
                    } catch (error) {
                        // Not base64 encoded, leave as is
                    }
                }
            }

            if (record.decodedBody) {
                const data = record.decodedBody;
                if (base64Regex.test(data) && data.length % 4 === 0) {
                    try {
                        const decoded = atob(data);
                        if (decoded !== data) {
                            updates.decodedBody = decoded;
                            needsUpdate = true;
                            console.log(`Decoded decodedBody for email ${record.gmailId}`);
                        }
                    } catch (error) {
                        // Not base64 encoded, leave as is
                    }
                }
            }

            // Update the record if needed
            if (needsUpdate) {
                await db.rawEmails.update(record.id!, updates);
                updatedCount++;
            }
        }

        console.log(`Updated ${updatedCount} out of ${rawEmailRecords.length} records with decoded content`);
        return { updated: updatedCount, total: rawEmailRecords.length };

    } catch (error) {
        console.error('Error decoding existing emails:', error);
        throw error;
    }
}; 