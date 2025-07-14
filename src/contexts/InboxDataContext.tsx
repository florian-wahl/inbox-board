import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { db } from '../db';
import { gmailService } from '../services/GmailService';
import { parserService, UnsubscribeSender } from '../services/ParserService';
import { GmailMessage, GmailListResponse } from '../types/gmail';

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
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [unsubscribes, setUnsubscribes] = useState<UnsubscribeSender[]>([]);
    const [lastEmailCount, setLastEmailCount] = useState<number>(0);
    const [loadingProgress, setLoadingProgress] = useState<number>(0);
    const [loadingTotal, setLoadingTotal] = useState<number>(0);
    const [loadingActive, setLoadingActive] = useState<boolean>(false);

    // Function to parse all emails from database
    const parseAllEmails = async () => {
        try {
            console.log('Parsing all emails from database...');

            // Get all raw emails from database
            const rawEmailRecords = await db.rawEmails.toArray();
            console.log(`Found ${rawEmailRecords.length} raw emails in database`);

            if (rawEmailRecords.length === 0) {
                console.log('No raw emails found in database');
                return;
            }

            // Convert to GmailMessage format for backward compatibility
            const gmailMessages = rawEmailRecords.map(record => {
                const bodyData = record.decodedBody || record.body || record.snippet;

                // Debug: Log the data being used
                console.log(`Email ${record.gmailId}:`, {
                    hasDecodedBody: !!record.decodedBody,
                    decodedBodyLength: record.decodedBody?.length || 0,
                    hasBody: !!record.body,
                    bodyLength: record.body?.length || 0,
                    snippetLength: record.snippet?.length || 0,
                    finalBodyDataLength: bodyData.length,
                    bodyDataSample: bodyData.substring(0, 100) + '...',
                    isBase64: /^[A-Za-z0-9+/]*={0,2}$/.test(bodyData) && bodyData.length % 4 === 0
                });

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

            console.log(`Parsed ${subscriptions.length} subscriptions, ${orders.length} orders, and ${unsubscribes.length} unsubscribes`);

            // Update state
            setSubscriptions(subscriptions);
            setOrders(orders);
            setUnsubscribes(unsubscribes);
            setLastEmailCount(rawEmailRecords.length);

        } catch (error) {
            console.error('Error parsing emails:', error);
        }
    };

    // Polling mechanism to check for new emails
    useEffect(() => {
        const pollInterval = setInterval(async () => {
            try {
                const currentEmailCount = await db.rawEmails.count();
                if (currentEmailCount !== lastEmailCount) {
                    console.log(`Email count changed from ${lastEmailCount} to ${currentEmailCount}, re-parsing...`);
                    await parseAllEmails();
                }
            } catch (error) {
                console.error('Error polling for new emails:', error);
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(pollInterval);
    }, [lastEmailCount]);

    // Load data from database on initialization
    useEffect(() => {
        const loadData = async () => {
            try {
                console.log('Loading data from database...');

                // Load raw emails from database
                const rawEmailRecords = await db.rawEmails.toArray();
                console.log(`Loaded ${rawEmailRecords.length} raw emails from database`);

                const emails: Email[] = rawEmailRecords.map(record => ({
                    id: record.gmailId,
                    subject: record.subject,
                    from: record.from,
                    date: record.date,
                    body: record.decodedBody || record.body || record.snippet,
                }));

                setRawEmails(emails);
                setLastEmailCount(rawEmailRecords.length);

                // Parse all emails
                await parseAllEmails();

            } catch (error) {
                console.error('Error loading data from database:', error);
            }
        };

        loadData();
    }, []);

    // Configurable fetch window and batch size (can be moved to settings/context later)
    const DEFAULT_DAYS = 30;
    const DEFAULT_BATCH_SIZE = 20;

    // Batched, progressive email fetching
    const fetchEmailsInBatches = async ({ days = DEFAULT_DAYS, batchSize = DEFAULT_BATCH_SIZE, showProgressBar = false } = {}) => {
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
            const existingIds = await db.rawEmails.where('gmailId').anyOf(messageIds).primaryKeys();
            const newIds = messageIds.filter((id: string) => !existingIds.includes(id));
            // If there are no new IDs and no nextPageToken, or no messageIds at all, break
            if ((newIds.length === 0 && !pageToken) || messageIds.length === 0) break;
            let messages: GmailMessage[] = [];
            if (newIds.length > 0) {
                messages = await gmailService.getMessages(newIds);
            }
            const now = Date.now();
            for (const message of messages) {
                const { fullBody, decodedBody, mimeType, parts } = gmailService.extractEmailContent(message.payload, message.snippet);
                await db.rawEmails.put({
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
                });
                totalInserted++;
            }
            totalFetched += messageIds.length;
            if (showProgressBar) {
                setLoadingProgress(prev => prev + messageIds.length);
            }
            await loadAndParseEmails();
            // If there is no nextPageToken, we are done
            if (!pageToken) done = true;
        }
        setLoadingActive(false);
        setLoadingProgress(0);
        setLoadingTotal(0);
        console.log(`Finished fetching emails. Total fetched: ${totalFetched}, total inserted: ${totalInserted}`);
    };

    // Helper to reload and parse emails from DB
    const loadAndParseEmails = async () => {
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
    };

    // Replace reload with batched fetching
    const reload = async (batchSize?: number, dateRange?: number, showProgressBar?: boolean): Promise<void> => {
        try {
            console.log('Reloading inbox data with batched fetching...');
            await fetchEmailsInBatches({
                days: dateRange ?? DEFAULT_DAYS,
                batchSize: batchSize ?? DEFAULT_BATCH_SIZE,
                showProgressBar: showProgressBar ?? false,
            });
        } catch (error) {
            console.error('Failed to reload inbox data:', error);
        }
    };

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

    const value: InboxDataContextType = {
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
    };

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