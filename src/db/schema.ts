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

export interface ParsedItemRecord {
    id?: number;
    type: 'subscription' | 'order' | 'unsubscribe';
    emailId: string;
    data: any; // JSON data for the parsed item
    createdAt: number;
    updatedAt: number;
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

export class InboxBoardDB extends Dexie {
    tokens!: Table<TokenRecord>;
    rawEmails!: Table<RawEmailRecord>;
    parsedItems!: Table<ParsedItemRecord>;

    constructor() {
        super('InboxBoardDB');

        this.version(3).stores({
            tokens: '++id, accessToken, refreshToken, expiresAt, updatedAt',
            rawEmails: '++id, gmailId, threadId, from, date, historyId',
            parsedItems: '++id, type, emailId, createdAt',
        });
    }
}

export const db = new InboxBoardDB();
