import { GmailMessage } from '../types/gmail';
import { Subscription } from '../types/subscription';
import { Order } from '../types/order';
import { extractCurrency, extractDate, extractMerchant, isSubscriptionEmail, isOrderEmail, isUnsubscribeEmail, hasBillingRecurrence, getOrderEmailKeyword, extractContextualAmount, isRefundOrReturnSubject, hasListUnsubscribeHeader } from '../utils/regex';
import { formatDate } from '../utils/date';
import { extractGmailBody, decodeGmailBodyData } from '../utils/gmailDecode';
import { ParsedUnsubscribeRecord } from '../db/schema';

// Type alias for DB record
export type UnsubscribeSenderDB = ParsedUnsubscribeRecord;

// Helper to convert from DB record to UnsubscribeSender
export function unsubscribeSenderFromDB(record: ParsedUnsubscribeRecord): UnsubscribeSender {
    // Use gmailId as the unique identifier
    const { gmailId, ...rest } = record;
    return {
        id: gmailId,
        ...rest,
    } as UnsubscribeSender;
}

// Helper to convert from UnsubscribeSender to DB record
export function unsubscribeSenderToDB(sender: UnsubscribeSender, gmailId: string): ParsedUnsubscribeRecord {
    return {
        gmailId,
        ...sender,
    } as ParsedUnsubscribeRecord;
}

// Utility function for safe base64 decoding to UTF-8
function safeBase64DecodeUTF8(data: string): string {
    if (!data) return '';
    try {
        const binary = atob(data);
        const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
        return new TextDecoder('utf-8').decode(bytes);
    } catch (e) {
        console.warn('Failed to decode base64 as UTF-8:', e);
        return data;
    }
}

// Helper to parse List-Unsubscribe header for URIs
function parseListUnsubscribeUris(headerValue: string): string[] {
    if (!headerValue) return [];
    const matches = Array.from(headerValue.matchAll(/<([^>]+)>/g));
    return matches.map(m => m[1].trim());
}

// Helper to determine unsubscribe type from parsed URIs
function getUnsubscribeType(uris: string[]): 'http' | 'mailto' | 'other' {
    if (uris.length === 0) return 'other';
    const first = uris[0].trim().toLowerCase();
    if (first.startsWith('http://') || first.startsWith('https://')) return 'http';
    if (first.startsWith('mailto:')) return 'mailto';
    return 'other';
}

// New Unsubscribe type for richer data
export type UnsubscribeSender = {
    id: string; // Add unique identifier
    domain: string;
    from: string;
    subject: string;
    to?: string;
    date: string;
    labelIds?: string[];
    listUnsubscribe?: string; // Added field for List-Unsubscribe header
    unsubscribeType?: 'http' | 'mailto' | 'other';
};

export class ParserService {




    // Helper function to safely encode data to Base64
    private safeBase64Encode(data: string): string {
        if (!data) return '';

        try {
            return btoa(unescape(encodeURIComponent(data)));
        } catch (error) {
            console.warn('Failed to encode data to Base64, using as-is:', error);
            return data;
        }
    }

    // Helper function to safely create ISO date string
    private safeToISOString(date: Date | null): string {
        if (!date || isNaN(date.getTime())) {
            return new Date().toISOString();
        }
        return date.toISOString();
    }

    private extractEmailBody(message: GmailMessage): string {
        const rawData = extractGmailBody(message.payload, true) || '';
        const decoded = decodeGmailBodyData(rawData);
        // Convert HTML to text if it looks like HTML, else use as is
        const isHtml = /<\/?[a-z][\s\S]*>/i.test(decoded);
        let text = isHtml ? htmlToPlainText(decoded) : decoded;
        // Normalize whitespace and line breaks
        text = text.replace(/[\u200B-\u200D\uFEFF]/g, '') // remove invisible chars
            .replace(/\r\n|\r/g, '\n') // standardize line breaks
            .replace(/[ \t]+/g, ' ') // collapse spaces/tabs
            .replace(/\n{2,}/g, '\n\n') // collapse multiple newlines
            .trim();
        return text;
    }

    // New method to extract email body from database record
    private extractEmailBodyFromRecord(record: any): string {
        let text = '';
        if (record.decodedBody) {
            text = record.decodedBody;
        } else if (record.fullBody) {
            text = record.fullBody;
        } else if (record.body && record.body !== record.snippet) {
            text = record.body;
        } else {
            text = record.snippet || '';
        }
        // Convert HTML to text if it looks like HTML, else use as is
        const isHtml = /<\/?[a-z][\s\S]*>/i.test(text);
        text = isHtml ? htmlToPlainText(text) : text;
        // Normalize whitespace and line breaks
        text = text.replace(/[\u200B-\u200D\uFEFF]/g, '') // remove invisible chars
            .replace(/\r\n|\r/g, '\n') // standardize line breaks
            .replace(/[ \t]+/g, ' ') // collapse spaces/tabs
            .replace(/\n{2,}/g, '\n\n') // collapse multiple newlines
            .trim();
        return text;
    }

    private extractEmailHeaders(message: GmailMessage): { from: string; subject: string; date: string; to?: string } {
        const headers = message.payload.headers;

        const from = headers.find(h => h.name === 'From')?.value || '';
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';
        const to = headers.find(h => h.name === 'To')?.value || '';

        return { from, subject, date, to };
    }

    parseSubscription(message: GmailMessage): Subscription | null {
        try {
            const body = this.extractEmailBody(message);
            const { from, subject, date, to } = this.extractEmailHeaders(message);

            const combinedText = subject + ' ' + body;
            if (!isSubscriptionEmail(combinedText) || !hasBillingRecurrence(combinedText)) {
                return null;
            }

            // Ignore if List-Unsubscribe header is present and non-empty
            if (hasListUnsubscribeHeader(message.payload.headers)) {
                return null;
            }

            // Only use contextual amount extraction
            const currency = extractContextualAmount(body);
            const billingDate = extractDate(body);
            // Merchant extraction: always use sender's domain
            const merchant = this.extractMainDomainFromEmail(from);

            if (!currency || !billingDate || !merchant) {
                return null;
            }

            return {
                id: message.id,
                merchant,
                plan: this.extractPlanName(subject, body),
                nextBilling: this.safeToISOString(billingDate),
                amount: currency.amount,
                currency: currency.currency,
                billingCycle: this.extractBillingCycle(body),
                status: 'active',
                emailId: message.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                from,
                subject,
                to,
                date: this.safeToISOString(new Date(date)),
                labelIds: message.labelIds,
                headers: message.payload.headers,
            };
        } catch (error) {
            console.error('Error parsing subscription:', error);
            return null;
        }
    }

    parseOrder(message: GmailMessage): Order | null {
        try {
            const body = this.extractEmailBody(message);
            const { from, subject, date, to } = this.extractEmailHeaders(message);

            const combinedText = subject + ' ' + body;
            if (!isOrderEmail(combinedText)) {
                return null;
            }

            // Ignore if List-Unsubscribe header is present and non-empty
            if (hasListUnsubscribeHeader(message.payload.headers)) {
                return null;
            }

            if (isRefundOrReturnSubject(subject)) {
                return null;
            }

            const orderMatchKeyword = getOrderEmailKeyword(combinedText);
            // Only use contextual amount extraction
            const currency = extractContextualAmount(body);
            const orderDate = new Date(date); // Always use email sent date
            // Merchant extraction: always use sender's domain
            const merchant = this.extractMainDomainFromEmail(from);

            if (!currency || !merchant) {
                return null;
            }

            return {
                id: message.id,
                orderNumber: this.extractOrderNumber(subject, body),
                merchant,
                amount: currency.amount,
                currency: currency.currency,
                date: this.safeToISOString(orderDate),
                status: this.extractOrderStatus(subject, body),
                refundStatus: 'none',
                emailId: message.id,
                items: this.extractOrderItems(body),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                from, // sender's email address
                subject, // email subject
                to, // recipient's email address
                orderMatchKeyword, // NEW FIELD
                labelIds: message.labelIds,
                headers: message.payload.headers,
            };
        } catch (error) {
            console.error('Error parsing order:', error);
            return null;
        }
    }

    // Combine extractMerchantFromEmail and extractSenderDomain into one
    private extractMainDomainFromEmail(email: string): string {
        const domain = email.split('@')[1];
        if (!domain) return 'Unknown';

        // Remove subdomains, get the main domain before the first TLD
        // e.g., mail.amazon.com -> amazon, shop.mail.amazon.co.uk -> amazon
        const domainParts = domain.split('.');
        if (domainParts.length < 2) return domain.charAt(0).toUpperCase() + domain.slice(1);
        // Find the part before the TLD (last part before .com, .net, etc.)
        // Handles multi-part TLDs like .co.uk
        let mainDomain = '';
        if (domainParts.length >= 3 && domainParts[domainParts.length - 2].length <= 3) {
            // e.g., amazon.co.uk -> amazon
            mainDomain = domainParts[domainParts.length - 3];
        } else {
            // e.g., merchant.com -> merchant
            mainDomain = domainParts[domainParts.length - 2];
        }
        return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
    }

    private extractPlanName(subject: string, body: string): string {
        const planPatterns = [
            /(premium|basic|standard|pro|enterprise|family|individual)/i,
            /(monthly|yearly|annual|quarterly)/i,
        ];

        for (const pattern of planPatterns) {
            const match = (subject + ' ' + body).match(pattern);
            if (match) {
                return match[1].charAt(0).toUpperCase() + match[1].slice(1);
            }
        }

        return 'Standard Plan';
    }

    private extractBillingCycle(body: string): string {
        const cyclePatterns = [
            { pattern: /monthly/i, cycle: 'monthly' },
            { pattern: /yearly|annual/i, cycle: 'yearly' },
            { pattern: /quarterly/i, cycle: 'quarterly' },
            { pattern: /weekly/i, cycle: 'weekly' },
        ];

        for (const { pattern, cycle } of cyclePatterns) {
            if (pattern.test(body)) {
                return cycle;
            }
        }

        return 'monthly';
    }

    private extractOrderNumber(subject: string, body: string): string {
        const orderPatterns = [
            /order[:\s]*#?(\w+)/i,
            /order[:\s]*number[:\s]*(\w+)/i,
            /#(\w+)/,
        ];

        for (const pattern of orderPatterns) {
            const match = (subject + ' ' + body).match(pattern);
            if (match) {
                return match[1];
            }
        }

        return 'Unknown';
    }

    private extractOrderStatus(subject: string, body: string): Order['status'] {
        const text = (subject + ' ' + body).toLowerCase();

        if (text.includes('shipped') || text.includes('in transit')) {
            return 'shipped';
        }
        if (text.includes('delivered')) {
            return 'delivered';
        }
        if (text.includes('cancelled') || text.includes('canceled')) {
            return 'cancelled';
        }
        if (text.includes('refunded')) {
            return 'refunded';
        }

        return 'pending';
    }

    private extractOrderItems(body: string): any[] {
        // Basic item extraction - this would need more sophisticated parsing
        const itemPattern = /([^$]+)\s*\$?(\d+\.?\d*)/g;
        const items: any[] = [];
        let match;

        while ((match = itemPattern.exec(body)) !== null) {
            items.push({
                id: `item-${items.length}`,
                name: match[1].trim(),
                quantity: 1,
                price: parseFloat(match[2]),
                currency: 'USD',
            });
        }

        return items.slice(0, 5); // Limit to 5 items
    }

    calculateNoiseScore(sender: string, frequency: number, lastEmail: string): number {
        const daysSinceLastEmail = (Date.now() - new Date(lastEmail).getTime()) / (1000 * 60 * 60 * 24);

        // Base score on frequency and recency
        let score = frequency * 10;

        // Reduce score for older emails
        if (daysSinceLastEmail > 30) {
            score *= 0.5;
        } else if (daysSinceLastEmail > 7) {
            score *= 0.8;
        }

        // Cap score at 100
        return Math.min(score, 100);
    }

    parseSubscriptions(messages: GmailMessage[]): Subscription[] {
        const subscriptions: Subscription[] = [];
        const seenIds = new Set<string>();

        for (const message of messages) {
            const subscription = this.parseSubscription(message);
            if (subscription && !seenIds.has(subscription.id)) {
                seenIds.add(subscription.id);
                subscriptions.push(subscription);
            }
        }

        return subscriptions;
    }

    parseOrders(messages: GmailMessage[]): Order[] {
        const orders: Order[] = [];
        const seenIds = new Set<string>();

        for (const message of messages) {
            const order = this.parseOrder(message);
            if (order && !seenIds.has(order.id)) {
                seenIds.add(order.id);
                orders.push(order);
            }
        }

        return orders;
    }

    parseUnsubscribes(messages: GmailMessage[]): UnsubscribeSender[] {
        const unsubMap = new Map<string, UnsubscribeSender>();

        for (const message of messages) {
            const body = this.extractEmailBody(message);
            const { from, subject, date, to } = this.extractEmailHeaders(message);
            const headers = message.payload.headers;
            const labelIds = message.labelIds;

            // Find List-Unsubscribe header value
            const listUnsubscribeHeader = headers?.find(
                (h: any) => h.name?.toLowerCase() === 'list-unsubscribe' && h.value && h.value.trim() !== ''
            );

            // Only add if List-Unsubscribe header is present, non-empty, and contains at least one URI
            const uris = listUnsubscribeHeader ? parseListUnsubscribeUris(listUnsubscribeHeader.value) : [];
            if (
                isUnsubscribeEmail(body, headers) &&
                listUnsubscribeHeader &&
                uris.length > 0
            ) {
                // Extract sender domain from email address
                const domain = this.extractMainDomainFromEmail(from);
                // Only keep the most recent email for each domain (by date)
                if (!unsubMap.has(domain) || new Date(date) > new Date(unsubMap.get(domain)!.date)) {
                    unsubMap.set(domain, {
                        id: message.id, // Use message id as unique identifier
                        domain,
                        from,
                        subject,
                        to,
                        date,
                        labelIds,
                        listUnsubscribe: listUnsubscribeHeader.value, // Store header value
                        unsubscribeType: getUnsubscribeType(uris),
                    });
                }
            }
        }

        return Array.from(unsubMap.values());
    }

    // New method to parse unsubscribes from database records
    parseUnsubscribesFromRecords(records: any[]): UnsubscribeSender[] {
        const unsubMap = new Map<string, UnsubscribeSender>();

        for (const record of records) {
            const body = this.extractEmailBodyFromRecord(record);
            const from = record.from || '';
            const subject = record.subject || '';
            const to = record.to || '';
            const date = record.date || '';
            const labelIds = record.labelIds || [];
            const headers = record.allHeaders || [];

            // Find List-Unsubscribe header value
            const listUnsubscribeHeader = headers?.find(
                (h: any) => h.name?.toLowerCase() === 'list-unsubscribe' && h.value && h.value.trim() !== ''
            );

            // Only add if List-Unsubscribe header is present, non-empty, and contains at least one URI
            const uris = listUnsubscribeHeader ? parseListUnsubscribeUris(listUnsubscribeHeader.value) : [];
            if (
                isUnsubscribeEmail(body, headers) &&
                listUnsubscribeHeader &&
                uris.length > 0
            ) {
                // Extract sender domain from email address
                const domain = this.extractMainDomainFromEmail(from);
                // Only keep the most recent email for each domain (by date)
                if (!unsubMap.has(domain) || new Date(date) > new Date(unsubMap.get(domain)!.date)) {
                    unsubMap.set(domain, {
                        id: record.gmailId, // Use gmailId as unique identifier
                        domain,
                        from,
                        subject,
                        to,
                        date,
                        labelIds,
                        listUnsubscribe: listUnsubscribeHeader.value, // Store header value
                        unsubscribeType: getUnsubscribeType(uris),
                    });
                }
            }
        }

        return Array.from(unsubMap.values());
    }
}

// Add a browser-compatible HTML-to-text function
function htmlToPlainText(html: string): string {
    if (typeof window !== 'undefined' && window.DOMParser) {
        const doc = new window.DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || '';
    }
    // Fallback for non-browser (should not happen in React app)
    return html.replace(/<[^>]+>/g, ' ');
}

export const parserService = new ParserService(); 