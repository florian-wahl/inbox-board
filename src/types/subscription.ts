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