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
    body: string; // This will now be the decoded full body instead of snippet
    snippet: string;
    labelIds: string[];
    // New fields from Gmail API
    historyId: string;
    internalDate: string;
    sizeEstimate: number;
    // Full email content and headers
    fullBody?: string; // Decoded full email content
    decodedBody?: string; // Decoded full email content for parsing
    allHeaders: GmailHeader[]; // All email headers
    mimeType: string;
    parts?: GmailMessagePart[]; // Multipart content
    createdAt: number;
    updatedAt: number;
}

export interface UserPreferencesRecord {
    id?: number;
    batchSize: number;
    dateRange: number;
    theme?: 'light' | 'dark' | 'system'; // Add this line
    settings?: Record<string, any>; // For future extensibility
}

export interface GmailHeader {
    name: string;
    value: string;
}

export interface GmailMessagePart {
    partId: string;
    mimeType: string;
    filename: string;
    headers: GmailHeader[];
    body: GmailMessageBody;
    parts?: GmailMessagePart[];
}

export interface GmailMessageBody {
    attachmentId?: string;
    size: number;
    data?: string;
}

// Add Order, Subscription, and UnsubscribeSender DB records
export interface ParsedOrderRecord {
    gmailId: string; // Use Gmail message id as unique key
    orderNumber: string;
    merchant: string;
    amount: number;
    currency: string;
    date: string;
    status: 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
    refundStatus: 'none' | 'partial' | 'full';
    emailId: string;
    items: any[]; // OrderItem[]
    createdAt: string;
    updatedAt: string;
    from: string;
    subject: string;
    to?: string;
    labelIds?: string[];
    headers?: { name: string; value: string }[];
    orderMatchKeyword?: string | null;
}

export interface ParsedSubscriptionRecord {
    gmailId: string; // Use Gmail message id as unique key
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
    from: string;
    subject: string;
    to?: string;
    date: string;
    labelIds?: string[];
    headers?: { name: string; value: string }[];
}

export interface ParsedUnsubscribeRecord {
    gmailId: string; // Use Gmail message id as unique key
    domain: string;
    from: string;
    subject: string;
    to?: string;
    date: string;
    labelIds?: string[];
    listUnsubscribe?: string;
}

export class InboxBoardDB extends Dexie {
    tokens!: Table<TokenRecord>;
    rawEmails!: Table<RawEmailRecord>;
    userPreferences!: Table<UserPreferencesRecord>;
    parsedOrders!: Table<ParsedOrderRecord>;
    parsedSubscriptions!: Table<ParsedSubscriptionRecord>;
    parsedUnsubscribes!: Table<ParsedUnsubscribeRecord>;

    constructor() {
        super('InboxBoardDB');

        this.version(6).stores({
            tokens: '++id, accessToken, refreshToken, expiresAt, updatedAt',
            rawEmails: '++id, &gmailId, threadId, from, date, historyId',
            userPreferences: '++id',
            parsedOrders: '&gmailId, merchant, date',
            parsedSubscriptions: '&gmailId, merchant, nextBilling',
            parsedUnsubscribes: '&gmailId, domain, from',
        });
    }
}

export const db = new InboxBoardDB();
