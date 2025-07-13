import Dexie, { Table } from 'dexie';

export interface TokenRecord {
    id?: number;
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    createdAt: number;
    updatedAt: number;
}

export interface RawEmailRecord {
    id?: number;
    gmailId: string;
    threadId: string;
    subject: string;
    from: string;
    date: string;
    body: string;
    snippet: string;
    labelIds: string[];
    createdAt: number;
    updatedAt: number;
}

export interface SubscriptionRecord {
    id?: number;
    emailId: string;
    merchant: string;
    plan: string;
    nextBilling: string;
    amount: number;
    currency: string;
    billingCycle: string;
    status: 'active' | 'cancelled' | 'paused';
    createdAt: number;
    updatedAt: number;
}

export interface UnsubscribeRecord {
    id?: number;
    sender: string;
    noiseScore: number;
    frequency: number;
    lastEmail: string;
    isStarred: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface OrderRecord {
    id?: number;
    emailId: string;
    orderNumber: string;
    merchant: string;
    amount: number;
    currency: string;
    date: string;
    status: 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
    refundStatus: 'none' | 'partial' | 'full';
    createdAt: number;
    updatedAt: number;
}

export interface OrderItemRecord {
    id?: number;
    orderId: number;
    name: string;
    quantity: number;
    price: number;
    currency: string;
    createdAt: number;
}

export class InboxBoardDB extends Dexie {
    tokens!: Table<TokenRecord>;
    rawEmails!: Table<RawEmailRecord>;
    subscriptions!: Table<SubscriptionRecord>;
    unsubscribes!: Table<UnsubscribeRecord>;
    orders!: Table<OrderRecord>;
    orderItems!: Table<OrderItemRecord>;

    constructor() {
        super('InboxBoardDB');

        this.version(1).stores({
            tokens: '++id, accessToken, refreshToken, expiresAt',
            rawEmails: '++id, gmailId, threadId, from, date',
            subscriptions: '++id, emailId, merchant, nextBilling, status',
            unsubscribes: '++id, sender, noiseScore, isStarred',
            orders: '++id, emailId, orderNumber, merchant, date, status',
            orderItems: '++id, orderId, name',
        });
    }
}

export const db = new InboxBoardDB(); 