import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { db } from '../db';
import { gmailService } from '../services/GmailService';
import { parserService, UnsubscribeSender } from '../services/ParserService';
import { GmailMessage, GmailListResponse } from '../types/gmail';
import { useAuth } from './AuthContext';
import { getUserPreferences } from '../utils/dbUtils';
import { insertParsedOrder, insertParsedSubscription, insertParsedUnsubscribe } from '../utils/dbUtils';
import { orderToDB, orderFromDB } from '../types/order';
import { subscriptionToDB, subscriptionFromDB } from '../types/subscription';
import { unsubscribeSenderToDB, unsubscribeSenderFromDB } from '../services/ParserService';
import { useLiveQuery } from 'dexie-react-hooks';

interface Email {
    id: string;
    subject: string;
    from: string;
    date: string;
    body: string; // Now contains the full decoded email body
}

interface Subscription {
    id: string;
    merchant: string;
    plan: string;
    nextBilling: string;
    amount: number;
}

interface Order {
    id: string;
    threadId: string; // <-- Add this line
    orderNumber: string;
    merchant: string;
    amount: number;
    currency: string;
    date: string;
    status: 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
    refundStatus: 'none' | 'partial' | 'full';
    emailId: string;
    items: any[];
    createdAt: string;
    updatedAt: string;
    from: string; // sender's email address
}

interface InboxDataContextType {
    rawEmails: Email[];
    subscriptions: Subscription[];
    orders: Order[];
    unsubscribes: UnsubscribeSender[];
    reload: (batchSize?: number, dateRange?: number, showProgressBar?: boolean) => Promise<void>;
    extendHistory: () => Promise<void>;
    testParsing: () => Promise<void>;
    triggerParsing: () => Promise<void>;
    loadingProgress?: number;
    loadingTotal?: number;
    loadingActive?: boolean;
}

const InboxDataContext = createContext<InboxDataContextType | undefined>(undefined);

interface InboxDataProviderProps {
    children: ReactNode;
}

export const InboxDataProvider: React.FC<InboxDataProviderProps> = ({ children }) => {
    const [rawEmails, setRawEmails] = useState<Email[]>([]);
    // Remove manual state and effect for orders, subscriptions, unsubscribes
    // const [orders, setOrders] = useState<Order[]>([]);
    // const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    // const [unsubscribes, setUnsubscribes] = useState<UnsubscribeSender[]>([]);

    const orders = useLiveQuery(
        () => db.parsedOrders.toArray().then(records => records.map(orderFromDB)),
        [],
        []
    );
    const subscriptions = useLiveQuery(
        () => db.parsedSubscriptions.toArray().then(records => records.map(subscriptionFromDB)),
        [],
        []
    );
    const unsubscribes = useLiveQuery(
        () => db.parsedUnsubscribes.toArray().then(records => records.map(unsubscribeSenderFromDB)),
        [],
        []
    );

    const [lastEmailCount, setLastEmailCount] = useState<number>(0);
    const [loadingProgress, setLoadingProgress] = useState<number>(0);
    const [loadingTotal, setLoadingTotal] = useState<number>(0);
    const [loadingActive, setLoadingActive] = useState<boolean>(false);
    const { isAuthenticated, accessToken } = useAuth();

    // Helper to check if a string is base64
    function isBase64(str: string) {
        if (!str) return false;
        // Basic check: base64 strings are usually longer, and must be a multiple of 4
        if (str.length < 8 || str.length % 4 !== 0) return false;
        // Only base64 characters
        return /^[A-Za-z0-9+/]*={0,2}$/.test(str);
    }

    // Function to parse all emails from database
    const parseAllEmails = async () => {
        try {
            console.log('Parsing all emails from database...');

            // Get all raw emails from database
            const rawEmailRecords = await db.rawEmails.where('parsed').equals(false as any).toArray();
            console.log(`Found ${rawEmailRecords.length} raw emails in database`);

            if (rawEmailRecords.length === 0) {
                console.log('No raw emails found in database');
                return;
            }

            // Convert to GmailMessage format for backward compatibility
            const gmailMessages = rawEmailRecords.map(record => {
                let bodyData = record.decodedBody || record.body || record.snippet;
                // Only decode if it looks like base64
                if (isBase64(bodyData)) {
                    try {
                        bodyData = atob(bodyData);
                    } catch (e) {
                        // If decode fails, keep as is
                    }
                }
                // Debug: Log the data being used
                // console.log(`Email ${record.gmailId}:`, {
                //     hasDecodedBody: !!record.decodedBody,
                //     decodedBodyLength: record.decodedBody?.length || 0,
                //     hasBody: !!record.body,
                //     bodyLength: record.body?.length || 0,
                //     snippetLength: record.snippet?.length || 0,
                //     finalBodyDataLength: bodyData.length,
                //     bodyDataSample: bodyData.substring(0, 100) + '...',
                //     isBase64: isBase64(bodyData)
                // });

                return {
                    id: record.gmailId,
                    threadId: record.threadId,
                    labelIds: record.labelIds,
                    snippet: record.snippet,
                    historyId: record.historyId || '1',
                    internalDate: record.internalDate || new Date(record.date).getTime().toString(),
                    payload: {
                        partId: '',
                        mimeType: record.mimeType || 'text/plain',
                        filename: '',
                        headers: record.allHeaders || [
                            { name: 'From', value: record.from },
                            { name: 'Subject', value: record.subject },
                            { name: 'Date', value: record.date }
                        ],
                        body: {
                            size: record.snippet.length,
                            // Store the decoded content directly, don't re-encode it
                            data: bodyData
                        },
                        parts: record.parts
                    },
                    sizeEstimate: record.sizeEstimate || record.snippet.length
                };
            });

            // Filter out promotional emails for order parsing
            const nonPromotionalMessages = gmailMessages.filter(msg => !msg.labelIds?.includes('CATEGORY_PROMOTIONS'));
            // Parse all types using the new methods
            const subscriptions = parserService.parseSubscriptions(gmailMessages);
            const orders = parserService.parseOrders(nonPromotionalMessages);
            const unsubscribes = parserService.parseUnsubscribesFromRecords(rawEmailRecords);

            // Insert parsed subscriptions into DB
            for (const subscription of subscriptions) {
                await insertParsedSubscription(subscriptionToDB(subscription));
            }
            // Insert parsed orders into DB
            for (const order of orders) {
                await insertParsedOrder(orderToDB(order));
            }
            // Insert parsed unsubscribes into DB
            for (const unsubscribe of unsubscribes) {
                const gmailId = unsubscribe.id; // Use the real Gmail message id
                await insertParsedUnsubscribe(unsubscribeSenderToDB(unsubscribe, gmailId));
            }

            console.log(`Parsed and inserted ${subscriptions.length} subscriptions, ${orders.length} orders, and ${unsubscribes.length} unsubscribes into DB`);

            // Update state
            // setSubscriptions(subscriptions); // Removed
            // setOrders(orders); // Removed
            // setUnsubscribes(unsubscribes); // Removed
            setLastEmailCount(rawEmailRecords.length);

            // After inserting parsed results, mark emails as parsed
            if (rawEmailRecords.length > 0) {
                const idsToUpdate = rawEmailRecords.map(r => r.gmailId).filter(Boolean);
                if (idsToUpdate.length > 0) {
                    await Promise.all(idsToUpdate.map(id => db.rawEmails.update(id, { parsed: true })));
                }
            }

        } catch (error) {
            console.error('Error parsing emails:', error);
        }
    };

    // Function to parse a batch of emails immediately after fetching
    const parseBatchEmails = async (newEmailRecords: any[]) => {
        try {
            if (newEmailRecords.length === 0) return;

            // Convert new records to GmailMessage format
            const gmailMessages = newEmailRecords.map(record => {
                let bodyData = record.decodedBody || record.body || record.snippet;
                if (isBase64(bodyData)) {
                    try {
                        bodyData = atob(bodyData);
                    } catch (e) {
                        // If decode fails, keep as is
                    }
                }

                return {
                    id: record.gmailId,
                    threadId: record.threadId,
                    labelIds: record.labelIds,
                    snippet: record.snippet,
                    historyId: record.historyId || '1',
                    internalDate: record.internalDate || new Date(record.date).getTime().toString(),
                    payload: {
                        partId: '',
                        mimeType: record.mimeType || 'text/plain',
                        filename: '',
                        headers: record.allHeaders || [
                            { name: 'From', value: record.from },
                            { name: 'Subject', value: record.subject },
                            { name: 'Date', value: record.date }
                        ],
                        body: {
                            size: record.snippet.length,
                            data: bodyData
                        },
                        parts: record.parts
                    },
                    sizeEstimate: record.sizeEstimate || record.snippet.length
                };
            });

            // Filter out promotional emails for order parsing
            const nonPromotionalMessages = gmailMessages.filter(msg => !msg.labelIds?.includes('CATEGORY_PROMOTIONS'));

            // Parse the batch
            const subscriptions = parserService.parseSubscriptions(gmailMessages);
            const orders = parserService.parseOrders(nonPromotionalMessages);
            const unsubscribes = parserService.parseUnsubscribesFromRecords(newEmailRecords);

            // Insert parsed results (duplicates will be handled by insert functions)
            for (const subscription of subscriptions) {
                await insertParsedSubscription(subscriptionToDB(subscription));
            }
            for (const order of orders) {
                await insertParsedOrder(orderToDB(order));
            }
            for (const unsubscribe of unsubscribes) {
                const gmailId = unsubscribe.id; // Use the real Gmail message id
                await insertParsedUnsubscribe(unsubscribeSenderToDB(unsubscribe, gmailId));
            }

            console.log(`Parsed batch: ${subscriptions.length} subscriptions, ${orders.length} orders, ${unsubscribes.length} unsubscribes`);

            // After inserting parsed results, mark emails as parsed
            if (newEmailRecords.length > 0) {
                const idsToUpdate = newEmailRecords.map(r => r.gmailId).filter(Boolean);
                if (idsToUpdate.length > 0) {
                    await Promise.all(idsToUpdate.map(id => db.rawEmails.update(id, { parsed: true })));
                }
            }
        } catch (error) {
            console.error('Error parsing batch emails:', error);
        }
    };

    // Remove polling mechanism for background parsing
    // useEffect(() => {
    //     const pollInterval = setInterval(async () => {
    //         try {
    //             if (!loadingActive) {
    //                 const currentEmailCount = await db.rawEmails.count();
    //                 if (currentEmailCount !== lastEmailCount) {
    //                     console.log(`Email count changed from ${lastEmailCount} to ${currentEmailCount}, re-parsing...`);
    //                     await parseAllEmails();
    //                 }
    //             }
    //         } catch (error) {
    //             console.error('Error polling for new emails:', error);
    //         }
    //     }, 5000); // Check every 5 seconds

    //     return () => clearInterval(pollInterval);
    // }, [lastEmailCount, loadingActive]);

    // Only load data if authenticated and accessToken is available
    useEffect(() => {
        if (!isAuthenticated || !accessToken) return;
        const loadData = async () => {
            try {
                // Load raw emails from database
                const rawEmailRecords = await db.rawEmails.toArray();
                const emails: Email[] = rawEmailRecords.map(record => ({
                    id: record.gmailId,
                    subject: record.subject,
                    from: record.from,
                    date: record.date,
                    body: record.decodedBody || record.body || record.snippet,
                }));
                setRawEmails(emails);
                setLastEmailCount(rawEmailRecords.length);
                // Do NOT call parseAllEmails here
            } catch (error) {
                console.error('Error loading data from database:', error);
            }
        };
        loadData();
    }, [isAuthenticated, accessToken]);

    // Remove useEffect for db.on('changes') and related manual reload logic

    // Configurable fetch window and batch size (can be moved to settings/context later)
    const DEFAULT_DAYS = 30;
    const DEFAULT_BATCH_SIZE = 20;

    // Helper to reload and parse emails from DB
    const loadAndParseEmails = useCallback(async () => {
        const rawEmailRecords = await db.rawEmails.toArray();
        const emails: Email[] = rawEmailRecords.map(record => ({
            id: record.gmailId,
            subject: record.subject,
            from: record.from,
            date: record.date,
            body: record.decodedBody || record.body || record.snippet,
        }));
        setRawEmails(emails);
        setLastEmailCount(rawEmailRecords.length);
        await parseAllEmails();
    }, [parseAllEmails]);

    // Batched, progressive email fetching
    const fetchEmailsInBatches = useCallback(async ({ days = DEFAULT_DAYS, batchSize = DEFAULT_BATCH_SIZE, showProgressBar = false } = {}) => {
        let pageToken = undefined;
        const date = new Date();
        date.setDate(date.getDate() - days);
        const query = `after:${date.toISOString().split('T')[0]}`;
        let totalFetched = 0;
        let totalInserted = 0;
        let done = false;
        setLoadingActive(showProgressBar);
        setLoadingProgress(0);
        setLoadingTotal(0);
        // Estimate total count (optional, can be improved)
        let estimatedTotal = 0;
        if (showProgressBar) {
            const response: GmailListResponse = await gmailService.listMessages(query, 1);
            estimatedTotal = response.resultSizeEstimate || 0;
            setLoadingTotal(estimatedTotal);
        }
        while (!done) {
            const response: GmailListResponse = await gmailService.listMessages(query, batchSize, pageToken);
            const messageIds = response.messages?.map((msg: any) => msg.id) || [];
            pageToken = response.nextPageToken;
            if (messageIds.length === 0) break;
            // Get all existing gmailIds in the DB for this batch
            const existingRecords = await db.rawEmails.where('gmailId').anyOf(messageIds).toArray();
            const existingGmailIds = new Set(existingRecords.map(e => e.gmailId));
            const newIds = messageIds.filter((id: string) => !existingGmailIds.has(id));
            // If there are no new IDs and no nextPageToken, or no messageIds at all, break
            if ((newIds.length === 0 && !pageToken) || messageIds.length === 0) break;
            let messages: GmailMessage[] = [];
            if (newIds.length > 0) {
                messages = await gmailService.getMessages(newIds);
            }
            const now = Date.now();
            const newEmailRecords: any[] = []; // Track new records for this batch

            for (const message of messages) {
                const { fullBody, decodedBody, mimeType, parts } = gmailService.extractEmailContent(message.payload, message.snippet);
                const emailRecord = {
                    gmailId: message.id,
                    threadId: message.threadId,
                    subject: message.payload.headers.find((h: any) => h.name === 'Subject')?.value || '',
                    from: message.payload.headers.find((h: any) => h.name === 'From')?.value || '',
                    date: message.payload.headers.find((h: any) => h.name === 'Date')?.value || '',
                    body: decodedBody || message.snippet,
                    snippet: message.snippet,
                    labelIds: message.labelIds,
                    historyId: message.historyId,
                    internalDate: message.internalDate,
                    sizeEstimate: message.sizeEstimate,
                    fullBody: fullBody,
                    decodedBody: decodedBody,
                    allHeaders: message.payload.headers,
                    mimeType: mimeType,
                    parts: parts,
                    createdAt: now,
                    updatedAt: now,
                    parsed: false, // <-- ensure default
                };

                try {
                    await db.rawEmails.add(emailRecord);
                    newEmailRecords.push(emailRecord);
                    totalInserted++;
                } catch (error: any) {
                    if (error.name === 'ConstraintError') {
                        // Duplicate gmailId, skip
                        continue;
                    } else {
                        throw error;
                    }
                }
            }

            // Parse this batch immediately after storing
            if (newEmailRecords.length > 0) {
                await parseBatchEmails(newEmailRecords);
            }

            totalFetched += messageIds.length;
            if (showProgressBar) {
                setLoadingProgress(prev => prev + messageIds.length);
            }
            // If there is no nextPageToken, we are done
            if (!pageToken) done = true;
        }
        // Remove the final parseAllEmails call since we're parsing incrementally
        // await loadAndParseEmails();
        setLoadingActive(false);
        setLoadingProgress(0);
        setLoadingTotal(0);
        console.log(`Finished fetching emails. Total fetched: ${totalFetched}, total inserted: ${totalInserted}`);
    }, [DEFAULT_DAYS, DEFAULT_BATCH_SIZE, parseBatchEmails]);

    // Replace reload with batched fetching
    const reload = useCallback(async (batchSize?: number, dateRange?: number, showProgressBar?: boolean): Promise<void> => {
        try {
            let finalBatchSize = batchSize;
            let finalDateRange = dateRange;
            let finalShowProgressBar = showProgressBar;
            // If any are undefined, load from user preferences
            if (finalBatchSize === undefined || finalDateRange === undefined || finalShowProgressBar === undefined) {
                const prefs = await getUserPreferences();
                if (finalBatchSize === undefined) finalBatchSize = prefs?.batchSize ?? DEFAULT_BATCH_SIZE;
                if (finalDateRange === undefined) finalDateRange = prefs?.dateRange ?? DEFAULT_DAYS;
                if (finalShowProgressBar === undefined) finalShowProgressBar = prefs?.settings?.showProgressBar ?? false;
            }
            console.log('Reloading inbox data with batched fetching...', { finalBatchSize, finalDateRange, finalShowProgressBar });
            await fetchEmailsInBatches({
                days: finalDateRange,
                batchSize: finalBatchSize,
                showProgressBar: finalShowProgressBar,
            });
        } catch (error) {
            console.error('Failed to reload inbox data:', error);
        }
    }, [fetchEmailsInBatches, DEFAULT_DAYS, DEFAULT_BATCH_SIZE]);

    const extendHistory = async (): Promise<void> => {
        // TODO: Implement history extension logic
        console.log('Extend history functionality to be implemented');
    };

    // Debug function to test parsing
    const testParsing = async () => {
        try {
            console.log('=== TESTING PARSING ===');

            // Get raw emails from database
            const rawEmailRecords = await db.rawEmails.toArray();
            console.log(`Found ${rawEmailRecords.length} raw emails in database`);

            if (rawEmailRecords.length === 0) {
                console.log('No raw emails found in database');
                return;
            }

            // Convert to GmailMessage format
            const gmailMessages = rawEmailRecords.map(record => ({
                id: record.gmailId,
                threadId: record.threadId,
                labelIds: record.labelIds,
                snippet: record.snippet,
                historyId: '1',
                internalDate: new Date(record.date).getTime().toString(),
                payload: {
                    partId: '',
                    mimeType: 'text/plain',
                    filename: '',
                    headers: [
                        { name: 'From', value: record.from },
                        { name: 'Subject', value: record.subject },
                        { name: 'Date', value: record.date }
                    ],
                    body: {
                        size: record.snippet.length,
                        data: btoa(unescape(encodeURIComponent(record.snippet)))
                    }
                },
                sizeEstimate: record.snippet.length
            }));

            console.log('Sample email content:', gmailMessages[0]);

            // Filter out promotional emails for order parsing
            const nonPromotionalMessages = gmailMessages.filter(msg => !msg.labelIds?.includes('CATEGORY_PROMOTIONS'));
            // Test parsing
            const subscriptions = parserService.parseSubscriptions(gmailMessages);
            const orders = parserService.parseOrders(nonPromotionalMessages);

            console.log(`Parsing results: ${subscriptions.length} subscriptions, ${orders.length} orders`);
            console.log('Sample subscription:', subscriptions[0]);
            console.log('Sample order:', orders[0]);

        } catch (error) {
            console.error('Error testing parsing:', error);
        }
    };

    const value = useMemo(() => ({
        rawEmails,
        subscriptions,
        orders,
        unsubscribes,
        reload,
        extendHistory,
        testParsing,
        triggerParsing: parseAllEmails,
        loadingProgress,
        loadingTotal,
        loadingActive,
    }), [rawEmails, subscriptions, orders, unsubscribes, reload, extendHistory, testParsing, parseAllEmails, loadingProgress, loadingTotal, loadingActive]);

    return (
        <InboxDataContext.Provider value={value}>
            {children}
        </InboxDataContext.Provider>
    );
};

export const useInboxData = (): InboxDataContextType => {
    const context = useContext(InboxDataContext);
    if (context === undefined) {
        throw new Error('useInboxData must be used within an InboxDataProvider');
    }
    return context;
}; 