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

    // Add useEffect to load data from parsedItems
    useEffect(() => {
        const loadData = async () => {
            const parsedItems = await db.parsedItems.toArray();

            const subscriptions = parsedItems
                .filter(item => item.type === 'subscription')
                .map(item => item.data);

            const orders = parsedItems
                .filter(item => item.type === 'order')
                .map(item => item.data);

            setSubscriptions(subscriptions);
            setOrders(orders);
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