import { GmailMessage, GmailListResponse, GmailProfile } from '../types/gmail';
import { extractGmailBody, decodeGmailBodyData } from '../utils/gmailDecode';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

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

    // Helper function to extract full email content
    public extractEmailContent(payload: any, snippet: string = ''): { fullBody: string; decodedBody: string; mimeType: string; parts?: any[] } {
        console.log('Extracting email content from payload...');

        let rawData = extractGmailBody(payload) || snippet;
        let decoded = decodeGmailBodyData(rawData);
        let mimeType = payload.mimeType || 'text/plain';
        let parts = payload.parts;

        console.log('Final extracted content:', {
            decodedBodyLength: decoded.length,
            fullBodyLength: decoded.length,
            mimeType,
            decodedBodySample: decoded.substring(0, 200) + '...',
            fullBodySample: decoded.substring(0, 200) + '...',
        });

        return { fullBody: decoded, decodedBody: decoded, mimeType, parts };
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
        // Request full message content with all metadata
        const params = new URLSearchParams({
            format: 'full',
            metadataHeaders: 'From,Subject,Date,List-Unsubscribe'
        });

        const message = await this.makeRequest<GmailMessage>(`/messages/${messageId}?${params.toString()}`);

        // Debug: Log the message structure
        console.log('Gmail message structure:', {
            id: message.id,
            hasPayload: !!message.payload,
            payloadMimeType: message.payload?.mimeType,
            hasParts: !!message.payload?.parts,
            partsCount: message.payload?.parts?.length || 0,
            hasBody: !!message.payload?.body,
            bodyDataLength: message.payload?.body?.data?.length || 0,
            snippet: message.snippet?.substring(0, 100) + '...',
            snippetLength: message.snippet?.length || 0
        });

        return message;
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