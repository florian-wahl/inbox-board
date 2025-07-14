import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { db } from '../db';
import { gmailService } from '../services/GmailService';
import { parserService } from '../services/ParserService';

interface Email {
    id: string;
    subject: string;
    from: string;
    date: string;
    body: string;
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
    merchant: string;
    amount: number;
    date: string;
    refundStatus: string;
}

interface InboxDataContextType {
    rawEmails: Email[];
    subscriptions: Subscription[];
    orders: Order[];
    unsubscribes: string[];
    reload: () => Promise<void>;
    extendHistory: () => Promise<void>;
    testParsing: () => Promise<void>; // Add test function to context
}

const InboxDataContext = createContext<InboxDataContextType | undefined>(undefined);

interface InboxDataProviderProps {
    children: ReactNode;
}

export const InboxDataProvider: React.FC<InboxDataProviderProps> = ({ children }) => {
    const [rawEmails, setRawEmails] = useState<Email[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [unsubscribes, setUnsubscribes] = useState<string[]>([]);

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
                    body: record.snippet,
                }));

                setRawEmails(emails);

                // Convert raw email records to GmailMessage format for parsing
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

                // Parse the raw emails for subscriptions and orders
                console.log('Parsing raw emails for subscriptions and orders...');
                console.log('Raw email records:', rawEmailRecords);
                console.log('Converted Gmail messages:', gmailMessages);

                const subscriptions = parserService.parseSubscriptions(gmailMessages);
                const orders = parserService.parseOrders(gmailMessages);
                const unsubscribes = parserService.parseUnsubscribes(gmailMessages);

                console.log(`Parsed ${subscriptions.length} subscriptions, ${orders.length} orders, and ${unsubscribes.length} unsubscribes from raw emails`);
                console.log('Parsed subscriptions:', subscriptions);
                console.log('Parsed orders:', orders);
                console.log('Parsed unsubscribes:', unsubscribes);

                setSubscriptions(subscriptions);
                setOrders(orders);
                setUnsubscribes(unsubscribes);

                // Store parsed items in database
                const now = Date.now();
                const parsedItemsToStore = [
                    ...subscriptions.map(sub => ({
                        type: 'subscription' as const,
                        emailId: sub.id,
                        data: sub,
                        createdAt: now,
                        updatedAt: now
                    })),
                    ...orders.map(order => ({
                        type: 'order' as const,
                        emailId: order.id,
                        data: order,
                        createdAt: now,
                        updatedAt: now
                    })),
                ];

                console.log('Items to store in database:', parsedItemsToStore);

                if (parsedItemsToStore.length > 0) {
                    await db.parsedItems.bulkPut(parsedItemsToStore);
                    console.log('Parsed items stored in database');
                } else {
                    console.log('No parsed items to store in database');
                }

            } catch (error) {
                console.error('Error loading data from database:', error);
            }
        };

        loadData();
    }, []);

    const reload = async (): Promise<void> => {
        try {
            console.log('Reloading inbox data...');

            // Fetch raw emails from Gmail service
            const recentMessages = await gmailService.getRecentMessages(7);
            console.log(`Fetched ${recentMessages.length} recent messages`);

            // Convert to Email format and update state
            const emails: Email[] = recentMessages.map(msg => ({
                id: msg.id,
                subject: msg.payload?.headers?.find(h => h.name === 'Subject')?.value || '',
                from: msg.payload?.headers?.find(h => h.name === 'From')?.value || '',
                date: msg.payload?.headers?.find(h => h.name === 'Date')?.value || '',
                body: msg.snippet || '',
            }));

            setRawEmails(emails);

            // Store raw emails in database
            const now = Date.now();
            for (const message of recentMessages) {
                await db.rawEmails.put({
                    gmailId: message.id,
                    threadId: message.threadId,
                    subject: message.payload.headers.find(h => h.name === 'Subject')?.value || '',
                    from: message.payload.headers.find(h => h.name === 'From')?.value || '',
                    date: message.payload.headers.find(h => h.name === 'Date')?.value || '',
                    body: message.snippet,
                    snippet: message.snippet,
                    labelIds: message.labelIds,
                    createdAt: now,
                    updatedAt: now,
                });
            }

            // Parse subscriptions and orders
            const subscriptions = parserService.parseSubscriptions(recentMessages);
            const orders = parserService.parseOrders(recentMessages);
            const unsubscribes = parserService.parseUnsubscribes(recentMessages);

            setSubscriptions(subscriptions);
            setOrders(orders);
            setUnsubscribes(unsubscribes);

            // Store parsed items in database
            await db.parsedItems.bulkPut([
                ...subscriptions.map(sub => ({
                    type: 'subscription' as const,
                    emailId: sub.id,
                    data: sub,
                    createdAt: now,
                    updatedAt: now
                })),
                ...orders.map(order => ({
                    type: 'order' as const,
                    emailId: order.id,
                    data: order,
                    createdAt: now,
                    updatedAt: now
                })),
            ]);

            console.log(`Parsed ${subscriptions.length} subscriptions, ${orders.length} orders, and ${unsubscribes.length} unsubscribes`);

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

            // Test parsing
            const subscriptions = parserService.parseSubscriptions(gmailMessages);
            const orders = parserService.parseOrders(gmailMessages);

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
        testParsing, // Add test function to context
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