// Gmail API body decoding utilities

/**
 * Converts Gmail's base64url-encoded string to a UTF-8 string.
 * Handles padding and URL-safe characters.
 */
export function decodeGmailBodyData(data: string): string {
    if (!data) return '';
    // Remove whitespace and line breaks (Gmail sometimes splits base64url across lines)
    let cleaned = data.replace(/\s/g, '');
    // Convert base64url to base64
    let b64 = cleaned.replace(/-/g, '+').replace(/_/g, '/');
    b64 += '='.repeat((4 - b64.length % 4) % 4);
    try {
        const binary = atob(b64);
        const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
        return new TextDecoder('utf-8').decode(bytes);
    } catch (e) {
        // Only warn if the cleaned string is non-empty
        if (cleaned.length > 0) {
            console.warn('Failed to decode Gmail body data:', e, cleaned);
        }
        return data;
    }
}

/**
 * Recursively finds the first text/plain (or text/html if preferHtml) part with body.data in a Gmail payload.
 * @param payload The Gmail message payload
 * @param preferHtml If true, prefer text/html over text/plain
 */
export function extractGmailBody(payload: any, preferHtml = false): string | null {
    if (!payload) return null;
    // Prefer text/plain, fallback to text/html if requested
    const wantedTypes = preferHtml ? ['text/html', 'text/plain'] : ['text/plain', 'text/html'];
    if (payload.body && payload.body.data && wantedTypes.includes(payload.mimeType)) {
        return payload.body.data;
    }
    if (payload.parts && Array.isArray(payload.parts)) {
        for (const part of payload.parts) {
            const found = extractGmailBody(part, preferHtml);
            if (found) return found;
        }
    }
    return null;
} 