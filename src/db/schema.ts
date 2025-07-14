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

export interface ParsedItemRecord {
    id?: number;
    type: 'subscription' | 'order' | 'unsubscribe';
    emailId: string;
    data: any; // JSON data for the parsed item
    createdAt: number;
    updatedAt: number;
}

export class InboxBoardDB extends Dexie {
    tokens!: Table<TokenRecord>;
    rawEmails!: Table<RawEmailRecord>;
    parsedItems!: Table<ParsedItemRecord>;

    constructor() {
        super('InboxBoardDB');

        this.version(2).stores({
            tokens: '++id, accessToken, refreshToken, expiresAt, updatedAt',
            rawEmails: '++id, gmailId, threadId, from, date',
            parsedItems: '++id, type, emailId, createdAt',
        });
    }
}

export const db = new InboxBoardDB();
