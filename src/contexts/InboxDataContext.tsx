import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { db } from '../db';

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
        // TODO: Implement data reload logic
        console.log('Reload functionality to be implemented');
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