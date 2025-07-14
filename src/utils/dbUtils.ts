import { db } from '../db';
import { UserPreferencesRecord, ParsedOrderRecord, ParsedSubscriptionRecord, ParsedUnsubscribeRecord } from '../db/schema';

export const purgeDatabase = async (): Promise<void> => {
    try {
        // Clear all tables
        await db.tokens.clear();
        await db.rawEmails.clear();

    } catch (error) {
        console.error('Error purging database:', error);
        throw error;
    }
};

export const getDatabaseStats = async (): Promise<{
    tokens: number;
    rawEmails: number;
}> => {
    try {
        const tokens = await db.tokens.count();
        const rawEmails = await db.rawEmails.count();

        return { tokens, rawEmails };
    } catch (error) {
        console.error('Error getting database stats:', error);
        return { tokens: 0, rawEmails: 0 };
    }
};





export const decodeExistingEmails = async (): Promise<{ updated: number; total: number }> => {
    try {
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

        return { updated: updatedCount, total: rawEmailRecords.length };

    } catch (error) {
        console.error('Error decoding existing emails:', error);
        throw error;
    }
};

export const getUserPreferences = async (): Promise<UserPreferencesRecord | null> => {
    const prefs = await db.userPreferences.get(1);
    return prefs || null;
};

export const setUserPreferences = async (prefs: Partial<UserPreferencesRecord>): Promise<void> => {
    const existing = await db.userPreferences.get(1);
    if (existing) {
        await db.userPreferences.update(1, { ...existing, ...prefs });
    } else {
        await db.userPreferences.put({ id: 1, batchSize: prefs.batchSize ?? 20, dateRange: prefs.dateRange ?? 30, theme: prefs.theme ?? 'system', ...prefs });
    }
};

// Insert a parsed order if gmailId does not already exist
export const insertParsedOrder = async (order: ParsedOrderRecord): Promise<boolean> => {
    console.log('[DB] Attempting to insert order:', order.gmailId, order);
    const existing = await db.parsedOrders.get(order.gmailId);
    if (!existing) {
        await db.parsedOrders.put(order);
        console.log('[DB] Order inserted:', order.gmailId);
        return true;
    }
    console.log('[DB] Duplicate order not inserted:', order.gmailId);
    return false;
};

// Insert a parsed subscription if gmailId does not already exist
export const insertParsedSubscription = async (subscription: ParsedSubscriptionRecord): Promise<boolean> => {
    console.log('[DB] Attempting to insert subscription:', subscription.gmailId, subscription);
    const existing = await db.parsedSubscriptions.get(subscription.gmailId);
    if (!existing) {
        await db.parsedSubscriptions.put(subscription);
        console.log('[DB] Subscription inserted:', subscription.gmailId);
        return true;
    }
    console.log('[DB] Duplicate subscription not inserted:', subscription.gmailId);
    return false;
};

// Insert a parsed unsubscribe entry if gmailId does not already exist
export const insertParsedUnsubscribe = async (unsubscribe: ParsedUnsubscribeRecord): Promise<boolean> => {
    console.log('[DB] Attempting to insert unsubscribe:', unsubscribe.gmailId, unsubscribe);
    const existing = await db.parsedUnsubscribeList.get(unsubscribe.gmailId);
    if (!existing) {
        await db.parsedUnsubscribeList.put(unsubscribe);
        console.log('[DB] Unsubscribe inserted:', unsubscribe.gmailId);
        return true;
    }
    console.log('[DB] Duplicate unsubscribe not inserted:', unsubscribe.gmailId);
    return false;
}; 