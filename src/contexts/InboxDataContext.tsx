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

                // Load parsed items from database
                const parsedItems = await db.parsedItems.toArray();
                console.log(`Loaded ${parsedItems.length} parsed items from database`);

                const subscriptions: Subscription[] = [];
                const orders: Order[] = [];

                parsedItems.forEach(item => {
                    if (item.type === 'subscription') {
                        subscriptions.push(item.data as Subscription);
                    } else if (item.type === 'order') {
                        orders.push(item.data as Order);
                    }
                });

                setSubscriptions(subscriptions);
                setOrders(orders);

                console.log(`Loaded ${subscriptions.length} subscriptions and ${orders.length} orders`);

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

            setSubscriptions(subscriptions);
            setOrders(orders);

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

            console.log(`Parsed ${subscriptions.length} subscriptions and ${orders.length} orders`);

        } catch (error) {
            console.error('Failed to reload inbox data:', error);
        }
    };

    const extendHistory = async (): Promise<void> => {
        // TODO: Implement history extension logic
        console.log('Extend history functionality to be implemented');
    };

    const value: InboxDataContextType = {
        rawEmails,
        subscriptions,
        orders,
        unsubscribes,
        reload,
        extendHistory,
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