import { GmailMessage } from '../types/gmail';
import { Subscription } from '../types/subscription';
import { Order } from '../types/order';
import { extractCurrency, extractDate, extractMerchant, isSubscriptionEmail, isOrderEmail } from '../utils/regex';
import { formatDate } from '../utils/date';

export class ParserService {
    private extractEmailBody(message: GmailMessage): string {
        const extractTextFromPart = (part: any): string => {
            if (part.mimeType === 'text/plain' && part.body.data) {
                return atob(part.body.data);
            }

            if (part.mimeType === 'text/html' && part.body.data) {
                // Basic HTML to text conversion
                const html = atob(part.body.data);
                return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            }

            if (part.parts) {
                return part.parts.map(extractTextFromPart).join(' ');
            }

            return '';
        };

        return extractTextFromPart(message.payload);
    }

    private extractEmailHeaders(message: GmailMessage): { from: string; subject: string; date: string } {
        const headers = message.payload.headers;

        const from = headers.find(h => h.name === 'From')?.value || '';
        const subject = headers.find(h => h.name === 'Subject')?.value || '';
        const date = headers.find(h => h.name === 'Date')?.value || '';

        return { from, subject, date };
    }

    parseSubscription(message: GmailMessage): Subscription | null {
        const body = this.extractEmailBody(message);
        const { from, subject, date } = this.extractEmailHeaders(message);

        if (!isSubscriptionEmail(subject + ' ' + body)) {
            return null;
        }

        const currency = extractCurrency(body);
        const billingDate = extractDate(body);
        // Improved merchant extraction logic
        let merchant = null;
        // Try COMMON pattern only
        const commonPattern = /(amazon|netflix|spotify|hulu|disney|hbo|youtube|google|apple|microsoft)/i;
        const commonMatch = (subject + ' ' + body).match(commonPattern);
        if (commonMatch) {
            merchant = commonMatch[1].charAt(0).toUpperCase() + commonMatch[1].slice(1);
        } else {
            merchant = this.extractMerchantFromEmail(from);
        }

        if (!currency || !billingDate || !merchant) {
            return null;
        }

        return {
            id: message.id,
            merchant,
            plan: this.extractPlanName(subject, body),
            nextBilling: billingDate.toISOString(),
            amount: currency.amount,
            currency: currency.currency,
            billingCycle: this.extractBillingCycle(body),
            status: 'active',
            emailId: message.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }

    parseOrder(message: GmailMessage): Order | null {
        const body = this.extractEmailBody(message);
        const { from, subject, date } = this.extractEmailHeaders(message);

        if (!isOrderEmail(subject + ' ' + body)) {
            return null;
        }

        const currency = extractCurrency(body);
        const orderDate = extractDate(body) || new Date(date);
        // Improved merchant extraction logic
        let merchant = null;
        // Try COMMON pattern only
        const commonPattern = /(amazon|netflix|spotify|hulu|disney|hbo|youtube|google|apple|microsoft)/i;
        const commonMatch = (subject + ' ' + body).match(commonPattern);
        if (commonMatch) {
            merchant = commonMatch[1].charAt(0).toUpperCase() + commonMatch[1].slice(1);
        } else {
            merchant = this.extractMerchantFromEmail(from);
        }

        if (!currency || !merchant) {
            return null;
        }

        return {
            id: message.id,
            orderNumber: this.extractOrderNumber(subject, body),
            merchant,
            amount: currency.amount,
            currency: currency.currency,
            date: orderDate.toISOString(),
            status: this.extractOrderStatus(subject, body),
            refundStatus: 'none',
            emailId: message.id,
            items: this.extractOrderItems(body),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }

    private extractMerchantFromEmail(email: string): string {
        const domain = email.split('@')[1];
        if (!domain) return 'Unknown';

        return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
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
}

export const parserService = new ParserService(); 