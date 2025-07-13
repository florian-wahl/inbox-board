import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useUI } from '../contexts/UIContext';
import { gmailService } from '../services/GmailService';
import { parserService } from '../services/ParserService';
import { db } from '../db';

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
                .filter(Boolean);

            // Step 3: Parse orders
            updateProgress(60);
            const orders = messages
                .map(msg => parserService.parseOrder(msg))
                .filter(Boolean);

            // Step 4: Save to database
            updateProgress(80);
            await db.transaction('rw', db.parsedItems, async () => {
                for (const subscription of subscriptions) {
                    await db.parsedItems.put({
                        type: 'subscription',
                        emailId: subscription!.emailId,
                        data: subscription!,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    });
                }
                for (const order of orders) {
                    await db.parsedItems.put({
                        type: 'order',
                        emailId: order!.emailId,
                        data: order!,
                        createdAt: Date.now(),
                        updatedAt: Date.now(),
                    });
                }
            });

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
                    .filter(Boolean);

                const orders = messages
                    .map(msg => parserService.parseOrder(msg))
                    .filter(Boolean);

                await db.transaction('rw', db.parsedItems, async () => {
                    for (const subscription of subscriptions) {
                        await db.parsedItems.put({
                            type: 'subscription',
                            emailId: subscription!.emailId,
                            data: subscription!,
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                        });
                    }
                    for (const order of orders) {
                        await db.parsedItems.put({
                            type: 'order',
                            emailId: order!.emailId,
                            data: order!,
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                        });
                    }
                });
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