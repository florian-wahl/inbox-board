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
    triggerParsing: () => Promise<void>; // Add method to manually trigger parsing
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
    const [lastEmailCount, setLastEmailCount] = useState<number>(0);

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

            // Parse all types
            const subscriptions = parserService.parseSubscriptions(gmailMessages);
            const orders = parserService.parseOrders(gmailMessages);
            const unsubscribes = parserService.parseUnsubscribes(gmailMessages);

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
                    body: record.snippet,
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

            // Trigger parsing of all emails (including new ones)
            await parseAllEmails();

            console.log(`Reload completed - parsed ${subscriptions.length} subscriptions, ${orders.length} orders, and ${unsubscribes.length} unsubscribes`);

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
        testParsing,
        triggerParsing: parseAllEmails, // Expose the parsing function
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