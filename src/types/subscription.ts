import { ParsedSubscriptionRecord } from '../db/schema';

export interface Subscription {
    id: string;
    merchant: string;
    plan: string;
    nextBilling: string;
    amount: number;
    currency: string;
    billingCycle: string;
    status: 'active' | 'cancelled' | 'paused';
    emailId: string;
    createdAt: string;
    updatedAt: string;
    from: string; // sender's email address
    subject: string; // email subject
    to?: string; // recipient's email address (optional)
    date: string; // sent date (ISO string)
    labelIds?: string[]; // Gmail label IDs
    headers?: { name: string; value: string }[]; // All email headers
}

export interface SubscriptionCard {
    id: string;
    merchant: string;
    logo?: string;
    plan: string;
    nextBilling: string;
    amount: number;
    currency: string;
    status: Subscription['status'];
    actions: SubscriptionAction[];
}

export interface SubscriptionAction {
    type: 'cancel' | 'reminder' | 'ignore';
    label: string;
    onClick: () => void;
}

export interface NoiseScore {
    sender: string;
    score: number;
    frequency: number;
    lastEmail: string;
}

// Type alias for DB record
export type SubscriptionDB = ParsedSubscriptionRecord;

// Helper to convert from DB record to Subscription
export function subscriptionFromDB(record: ParsedSubscriptionRecord): Subscription {
    const { gmailId, ...rest } = record;
    return {
        id: gmailId,
        ...rest,
    } as Subscription;
}

// Helper to convert from Subscription to DB record
export function subscriptionToDB(subscription: Subscription): ParsedSubscriptionRecord {
    const { id, ...rest } = subscription;
    return {
        gmailId: id,
        ...rest,
    } as ParsedSubscriptionRecord;
} 