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
    // Initialize with stub data
    const stubEmails: Email[] = [
        {
            id: 'sub-1',
            subject: 'Your Netflix subscription has been renewed',
            from: 'netflix@billing.netflix.com',
            date: '2024-01-15T10:00:00Z',
            body: 'Your Netflix Premium subscription has been renewed for $15.99/month. Next billing date: February 15, 2024.'
        },
        {
            id: 'sub-2',
            subject: 'Spotify Premium - Monthly Payment Confirmation',
            from: 'billing@spotify.com',
            date: '2024-01-14T09:30:00Z',
            body: 'Your Spotify Premium subscription has been charged $9.99. Next billing: February 14, 2024.'
        },
        {
            id: 'order-1',
            subject: 'Your Amazon order has shipped',
            from: 'shipment-tracking@amazon.com',
            date: '2024-01-13T14:20:00Z',
            body: 'Your order #123-4567890-1234567 has shipped. Total: $45.99. Expected delivery: January 16, 2024.'
        },
        {
            id: 'order-2',
            subject: 'Order Confirmation - Best Buy',
            from: 'orders@bestbuy.com',
            date: '2024-01-12T16:45:00Z',
            body: 'Thank you for your order #BB123456. Total: $299.99. Your order is being processed.'
        }
    ];

    const [rawEmails, setRawEmails] = useState<Email[]>(stubEmails);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [unsubscribes, setUnsubscribes] = useState<string[]>([]);

    // Add useEffect to load data from parsedItems and parse stub data
    useEffect(() => {
        const loadData = async () => {
            // Clear database to start fresh and prevent duplicates
            await db.parsedItems.clear();

            // Parse stub emails
            console.log('Parsing stub emails...');
            // Convert stub emails to GmailMessage format
            const gmailMessages = stubEmails.map(email => ({
                id: email.id,
                threadId: email.id,
                labelIds: [],
                snippet: email.body,
                historyId: '1',
                internalDate: new Date(email.date).getTime().toString(),
                payload: {
                    partId: '',
                    mimeType: 'text/plain',
                    filename: '',
                    headers: [
                        { name: 'From', value: email.from },
                        { name: 'Subject', value: email.subject },
                        { name: 'Date', value: email.date }
                    ],
                    body: {
                        size: email.body.length,
                        data: btoa(email.body)
                    }
                },
                sizeEstimate: email.body.length
            }));

            // Parse the stub data
            const parsedSubscriptions = parserService.parseSubscriptions(gmailMessages);
            const parsedOrders = parserService.parseOrders(gmailMessages);

            console.log('Parsed subscriptions:', parsedSubscriptions);
            console.log('Parsed orders:', parsedOrders);

            setSubscriptions(parsedSubscriptions);
            setOrders(parsedOrders);

            // Store in database (clear existing data first to prevent duplicates)
            const now = Date.now();
            await db.parsedItems.clear(); // Clear existing data to prevent duplicates
            await db.parsedItems.bulkPut([
                ...parsedSubscriptions.map(sub => ({
                    type: 'subscription' as const,
                    emailId: sub.id,
                    data: sub,
                    createdAt: now,
                    updatedAt: now
                })),
                ...parsedOrders.map(order => ({
                    type: 'order' as const,
                    emailId: order.id,
                    data: order,
                    createdAt: now,
                    updatedAt: now
                })),
            ]);
        };

        loadData();
    }, []);

    const reload = async (): Promise<void> => {
        try {
            // Fetch raw emails from Gmail service
            const recentMessages = await gmailService.getRecentMessages(30);
            setRawEmails(recentMessages.map(msg => ({
                id: msg.id,
                subject: msg.payload?.headers?.find(h => h.name === 'Subject')?.value || '',
                from: msg.payload?.headers?.find(h => h.name === 'From')?.value || '',
                date: msg.payload?.headers?.find(h => h.name === 'Date')?.value || '',
                body: msg.snippet || '',
            })));

            // Parse subscriptions and orders using service stubs
            const subscriptions = parserService.parseSubscriptions(recentMessages);
            const orders = parserService.parseOrders(recentMessages);

            setSubscriptions(subscriptions);
            setOrders(orders);

            // Store parsed items in database
            const now = Date.now();
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