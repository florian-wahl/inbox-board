import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useUI } from '../contexts/UIContext';
import { gmailService } from '../services/GmailService';
import { parserService } from '../services/ParserService';
import { db } from '../db';
import { insertParsedOrder } from '../utils/dbUtils';
import { insertParsedSubscription } from '../utils/dbUtils';
import { insertParsedUnsubscribe } from '../utils/dbUtils';
import { orderToDB } from '../types/order';
import type { Order } from '../types/order';
import { subscriptionToDB } from '../types/subscription';
import type { Subscription } from '../types/subscription';
import { unsubscribeSenderToDB } from '../services/ParserService';
import type { UnsubscribeSender } from '../services/ParserService';

export const useInboxSync = () => {
    const { accessToken, isAuthenticated } = useAuth();
    const { showProgressBar, hideProgressBar, updateProgress } = useUI();
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);

    useEffect(() => {
        if (accessToken) {
            gmailService.setAccessToken(accessToken);
        }
    }, [accessToken]);

    const syncEmails = useCallback(async () => {
        if (!isAuthenticated || !accessToken) {
            throw new Error('Not authenticated');
        }

        setIsSyncing(true);
        showProgressBar();
        updateProgress(0);

        try {
            // Step 1: Get recent messages
            updateProgress(20);
            const messages = await gmailService.getRecentMessages(30);

            // Step 2: Parse subscriptions
            updateProgress(40);
            const subscriptions = messages
                .map(msg => parserService.parseSubscription(msg))
                .filter((s): s is Subscription => Boolean(s));

            // Step 3: Parse orders
            updateProgress(60);
            const orders = messages
                .map(msg => parserService.parseOrder(msg))
                .filter((o): o is Order => Boolean(o));

            // Step 4: Save to database
            updateProgress(80);
            // Add each parsed subscription to the DB (no duplicates)
            for (const subscription of subscriptions) {
                await insertParsedSubscription(subscriptionToDB(subscription));
            }
            // Add each parsed order to the DB (no duplicates)
            for (const order of orders) {
                await insertParsedOrder(orderToDB(order));
            }

            // Step 5: Parse unsubscribes
            const unsubscribes = parserService.parseUnsubscribes(messages)
                .filter((u): u is UnsubscribeSender => Boolean(u));

            // Step 6: Save unsubscribes to database
            for (const unsubscribe of unsubscribes) {
                // Use the 'from' email as a fallback for gmailId if needed, but ideally use message.id if available
                // Here, we use domain+from+date as a composite fallback if no id is available
                const gmailId = unsubscribe.from + '-' + unsubscribe.domain + '-' + unsubscribe.date;
                await insertParsedUnsubscribe(unsubscribeSenderToDB(unsubscribe, gmailId));
            }

            updateProgress(100);
            setLastSync(new Date());

        } catch (error) {
            console.error('Sync failed:', error);
            throw error;
        } finally {
            setIsSyncing(false);
            hideProgressBar();
        }
    }, [isAuthenticated, accessToken, showProgressBar, hideProgressBar, updateProgress]);

    const syncIncremental = useCallback(async (historyId: string) => {
        if (!isAuthenticated || !accessToken) {
            throw new Error('Not authenticated');
        }

        try {
            const messages = await gmailService.getIncrementalMessages(historyId);

            if (messages.length > 0) {
                const subscriptions = messages
                    .map(msg => parserService.parseSubscription(msg))
                    .filter((s): s is Subscription => Boolean(s));

                // Add each parsed subscription to the DB (no duplicates)
                for (const subscription of subscriptions) {
                    await insertParsedSubscription(subscriptionToDB(subscription));
                }

                const orders = messages
                    .map(msg => parserService.parseOrder(msg))
                    .filter((o): o is Order => Boolean(o));

                // Add each parsed order to the DB (no duplicates)
                for (const order of orders) {
                    await insertParsedOrder(orderToDB(order));
                }

                // Parse unsubscribes
                const unsubscribes = parserService.parseUnsubscribes(messages)
                    .filter((u): u is UnsubscribeSender => Boolean(u));

                // Save unsubscribes to database
                for (const unsubscribe of unsubscribes) {
                    const gmailId = unsubscribe.from + '-' + unsubscribe.domain + '-' + unsubscribe.date;
                    await insertParsedUnsubscribe(unsubscribeSenderToDB(unsubscribe, gmailId));
                }
            }

            setLastSync(new Date());
        } catch (error) {
            console.error('Incremental sync failed:', error);
            throw error;
        }
    }, [isAuthenticated, accessToken]);

    return {
        syncEmails,
        syncIncremental,
        isSyncing,
        lastSync,
    };
}; 