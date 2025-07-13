import { GmailMessage, GmailListResponse, GmailProfile } from '../types/gmail';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

export class GmailService {
    private accessToken: string | null = null;

    setAccessToken(token: string): void {
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
        const promises = messageIds.map(id => this.getMessage(id));
        return Promise.all(promises);
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