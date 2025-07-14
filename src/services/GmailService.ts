import { GmailMessage, GmailListResponse, GmailProfile } from '../types/gmail';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

export class GmailService {
    private accessToken: string | null = null;

    setAccessToken(token: string | null): void {
        this.accessToken = token;
    }

    private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        if (!this.accessToken) {
            throw new Error('No access token available');
        }

        const response = await fetch(`${GMAIL_API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    // Helper function to add delay between requests
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Process messages in batches to avoid rate limiting
    private async processBatch<T>(items: T[], batchSize: number, processor: (batch: T[]) => Promise<any[]>): Promise<any[]> {
        const results: any[] = [];

        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchResults = await processor(batch);
            results.push(...batchResults);

            // Add delay between batches to respect rate limits
            if (i + batchSize < items.length) {
                await this.delay(100); // 100ms delay between batches
            }
        }

        return results;
    }

    async getProfile(): Promise<GmailProfile> {
        return this.makeRequest<GmailProfile>('/profile');
    }

    async listMessages(query: string = '', maxResults: number = 100, pageToken?: string): Promise<GmailListResponse> {
        const params = new URLSearchParams({
            q: query,
            maxResults: maxResults.toString(),
        });

        if (pageToken) {
            params.append('pageToken', pageToken);
        }

        return this.makeRequest<GmailListResponse>(`/messages?${params.toString()}`);
    }

    async getMessage(messageId: string): Promise<GmailMessage> {
        return this.makeRequest<GmailMessage>(`/messages/${messageId}`);
    }

    async getMessages(messageIds: string[]): Promise<GmailMessage[]> {
        // Process messages in smaller batches to avoid rate limiting
        return this.processBatch(messageIds, 5, async (batch) => {
            const promises = batch.map(id => this.getMessage(id));
            return Promise.all(promises);
        });
    }

    async searchSubscriptions(): Promise<GmailMessage[]> {
        const query = 'subject:(subscription OR renewal OR billing OR payment)';
        const response = await this.listMessages(query, 50);

        if (response.messages) {
            return this.getMessages(response.messages.map(msg => msg.id));
        }

        return [];
    }

    async searchOrders(): Promise<GmailMessage[]> {
        const query = 'subject:(order OR purchase OR receipt OR confirmation OR shipped OR delivered)';
        const response = await this.listMessages(query, 50);

        if (response.messages) {
            return this.getMessages(response.messages.map(msg => msg.id));
        }

        return [];
    }

    async getRecentMessages(days: number = 30): Promise<GmailMessage[]> {
        const date = new Date();
        date.setDate(date.getDate() - days);
        const query = `after:${date.toISOString().split('T')[0]}`;

        const response = await this.listMessages(query, 100);

        if (response.messages) {
            return this.getMessages(response.messages.map(msg => msg.id));
        }

        return [];
    }

    async getIncrementalMessages(historyId: string): Promise<GmailMessage[]> {
        const params = new URLSearchParams({
            startHistoryId: historyId,
        });

        const response = await this.makeRequest<{ history: any[] }>(`/history?${params.toString()}`);

        // Process history to get new messages
        const messageIds: string[] = [];
        response.history?.forEach(history => {
            history.messagesAdded?.forEach((msg: any) => {
                messageIds.push(msg.message.id);
            });
        });

        if (messageIds.length > 0) {
            return this.getMessages(messageIds);
        }

        return [];
    }
}

export const gmailService = new GmailService(); 