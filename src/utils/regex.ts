// Currency patterns
export const CURRENCY_PATTERNS = {
    USD: /\$(\d+(?:\.\d{2})?)/g,
    EUR: /€(\d+(?:\.\d{2})?)/g,
    GBP: /£(\d+(?:\.\d{2})?)/g,
    GENERIC: /(\d+(?:\.\d{2})?)\s*(USD|EUR|GBP|CAD|AUD)/gi,
};

// Date patterns
export const DATE_PATTERNS = {
    ISO: /\d{4}-\d{2}-\d{2}/g,
    US: /\d{1,2}\/\d{1,2}\/\d{4}/g,
    EUROPEAN: /\d{1,2}\/\d{1,2}\/\d{4}/g,
    RELATIVE: /(today|tomorrow|yesterday|next week|next month)/gi,
    MONTH_DD_YYYY: /([A-Z][a-z]+ \d{1,2}, \d{4})/g,
};

// Merchant patterns
export const MERCHANT_PATTERNS = {
    COMMON: /(amazon|netflix|spotify|hulu|disney|hbo|youtube|google|apple|microsoft)/gi,
    SUBSCRIPTION: /(subscription|renewal|billing|payment|charge)/gi,
    ORDER: /(order|purchase|receipt|confirmation|shipped|delivered)/gi,
};

// Unsubscribe patterns
export const UNSUBSCRIBE_PATTERNS = {
    LINKS: /(?:href|url)=["']?[^"'\s]*unsubscribe[^"'\s]*["']?/gi,
    TEXT: /(?:unsubscribe|opt.?out|remove from list|stop receiving|cancel subscription)/gi,
    BUTTONS: /<[^>]*unsubscribe[^>]*>/gi,
    LIST_HEADERS: /(?:list-unsubscribe|unsubscribe)/gi,
    EMAIL_LINKS: /mailto:[^"'\s]*unsubscribe[^"'\s]*/gi,
    HTTP_LINKS: /https?:\/\/[^"'\s]*unsubscribe[^"'\s]*/gi,
};

// Email patterns
export const EMAIL_PATTERNS = {
    SENDER: /From:\s*([^\n\r]+)/gi,
    SUBJECT: /Subject:\s*([^\n\r]+)/gi,
    DATE: /Date:\s*([^\n\r]+)/gi,
};

// Robust global currency regex: matches $12.99, USD 1,234.56, €9.99, £10, etc.
export const GLOBAL_CURRENCY_REGEX = /(?<!\S)(?:\$|USD|EUR|€|£|GBP|CAD|AUD)\s?\d{1,3}(?:[,.\d]*)(?:\.\d{2})?(?!\S)/gi;

export const extractCurrency = (text: string): { amount: number; currency: string } | null => {
    let match: RegExpExecArray | null = null;
    let lastMatch: RegExpExecArray | null = null;
    GLOBAL_CURRENCY_REGEX.lastIndex = 0;
    while ((match = GLOBAL_CURRENCY_REGEX.exec(text)) !== null) {
        lastMatch = match;
    }
    if (lastMatch) {
        // Extract currency symbol/code and amount
        const raw = lastMatch[0];
        const currencyMatch = raw.match(/(USD|EUR|GBP|CAD|AUD|\$|€|£)/i);
        const amountMatch = raw.match(/\d{1,3}(?:[,.\d]*)(?:\.\d{2})?/);
        if (currencyMatch && amountMatch) {
            let currency = currencyMatch[0].toUpperCase();
            if (currency === '$') currency = 'USD';
            if (currency === '€') currency = 'EUR';
            if (currency === '£') currency = 'GBP';
            // Remove commas from amount for parsing
            const amount = parseFloat(amountMatch[0].replace(/,/g, ''));
            return { amount, currency };
        }
    }
    return null;
};

// Contextual total markers regex (robust: allow up to 5 line breaks/whitespace between marker and amount)
export const CONTEXT_TOTAL_REGEX = /(?:Total(?: Charged| Amount| Due| Paid)?|Grand Total|Order Total)[\s:\-]*((?:\r?\n|\r|[ \t]){0,5}.*?(?:\$|USD|EUR|€|£|GBP|CAD|AUD)[ ]?\d{1,3}(?:[,.\d]*)(?:\.\d{2})?)/gim;

// Extracts the last amount near a total marker, with currency
export const extractContextualAmount = (text: string): { amount: number; currency: string } | null => {
    const totalMarkers = [
        /total(?: charged| amount| due| paid)?/i,
        /grand total/i,
        /order total/i
    ];
    const amountPattern = /(\$|USD|EUR|€|£|GBP|CAD|AUD)[ ]?\d{1,3}(?:[,.\d]*)(?:\.\d{2})?/i;
    const lines = text.split(/\r?\n/).map(l => l.trim());
    let lastMatch: { amount: number; currency: string } | null = null;
    for (let i = 0; i < lines.length; i++) {
        if (totalMarkers.some(marker => marker.test(lines[i]))) {
            // (1) Check marker line itself
            let amtMatch = lines[i].match(amountPattern);
            if (amtMatch) {
                let currency = amtMatch[1].toUpperCase();
                if (currency === '$') currency = 'USD';
                if (currency === '€') currency = 'EUR';
                if (currency === '£') currency = 'GBP';
                const amount = parseFloat(amtMatch[0].replace(/[^\d.]/g, ''));
                if (amount >= 1 && amount <= 10000) {
                    lastMatch = { amount, currency };
                }
            }
            // (2) Check next 8 non-empty lines
            let lookahead = 0;
            let j = i + 1;
            while (j < lines.length && lookahead < 8) {
                if (lines[j]) {
                    amtMatch = lines[j].match(amountPattern);
                    if (amtMatch) {
                        let currency = amtMatch[1].toUpperCase();
                        if (currency === '$') currency = 'USD';
                        if (currency === '€') currency = 'EUR';
                        if (currency === '£') currency = 'GBP';
                        const amount = parseFloat(amtMatch[0].replace(/[^\d.]/g, ''));
                        if (amount >= 1 && amount <= 10000) {
                            lastMatch = { amount, currency };
                        }
                    }
                    lookahead++;
                }
                j++;
            }
            // (3) Check next 200 characters after marker for amount
            const markerIdx = text.indexOf(lines[i]);
            if (markerIdx !== -1) {
                const afterMarker = text.slice(markerIdx, markerIdx + 200);
                amtMatch = afterMarker.match(amountPattern);
                if (amtMatch) {
                    let currency = amtMatch[1].toUpperCase();
                    if (currency === '$') currency = 'USD';
                    if (currency === '€') currency = 'EUR';
                    if (currency === '£') currency = 'GBP';
                    const amount = parseFloat(amtMatch[0].replace(/[^\d.]/g, ''));
                    if (amount >= 1 && amount <= 10000) {
                        lastMatch = { amount, currency };
                    }
                }
            }
        }
    }
    return lastMatch;
};

export const extractDate = (text: string): Date | null => {
    for (const [key, pattern] of Object.entries(DATE_PATTERNS)) {
        const match = text.match(pattern);
        if (match) {
            if (key === 'MONTH_DD_YYYY') {
                // Parse 'Month DD, YYYY' format
                return new Date(match[0]);
            }
            return new Date(match[0]);
        }
    }
    return null;
};

export const extractMerchant = (text: string): string | null => {
    for (const [type, pattern] of Object.entries(MERCHANT_PATTERNS)) {
        const match = text.match(pattern);
        if (match) {
            return match[0];
        }
    }
    return null;
};

export const isSubscriptionEmail = (text: string): boolean => {
    const subscriptionKeywords = [
        'subscription',
        'renewal',
        'billing',
        'payment',
        'charge',
        'recurring',
        'monthly',
        'yearly',
        'annual',
    ];

    const lowerText = text.toLowerCase();
    return subscriptionKeywords.some(keyword => lowerText.includes(keyword));
};

export const isOrderEmail = (text: string): boolean => {
    const orderKeywords = [
        'order',
        'purchase',
        'receipt',
        'confirmation',
        'shipped',
        'delivered',
        'tracking',
        'invoice',
    ];

    const lowerText = text.toLowerCase();
    return orderKeywords.some(keyword => lowerText.includes(keyword));
};

export const getOrderEmailKeyword = (text: string): string | null => {
    const orderKeywords = [
        'order',
        'purchase',
        'receipt',
        'confirmation',
        'shipped',
        'delivered',
        'tracking',
        'invoice',
    ];
    const lowerText = text.toLowerCase();
    return orderKeywords.find(keyword => lowerText.includes(keyword)) || null;
};

export const isUnsubscribeEmail = (text: string, headers?: any[]): boolean => {
    const lowerText = text.toLowerCase();

    // Check for unsubscribe patterns in email body
    for (const [type, pattern] of Object.entries(UNSUBSCRIBE_PATTERNS)) {
        if (pattern.test(lowerText)) {
            return true;
        }
    }

    // Check for List-Unsubscribe headers
    if (headers) {
        const listUnsubscribeHeader = headers.find(h =>
            h.name.toLowerCase() === 'list-unsubscribe'
        );
        if (listUnsubscribeHeader) {
            return true;
        }
    }

    return false;
};

export const hasBillingRecurrence = (text: string): boolean => {
    const recurrencePatterns = [
        /(every|each)\s+(month|year|week|quarter)/i,
        /(renews|billed|charged)\s+(monthly|yearly|annually|weekly|quarterly)/i,
        /(next\s+(billing|charge|payment|invoice)\s+date)/i,
        /(auto-?renew)/i,
        /(recurring\s+payment)/i,
        /(your\s+plan\s+will\s+renew)/i,
        /(subscription\s+renews)/i,
        /(renewal\s+date)/i,
        /(next\s+payment)/i,
        /\$\d+(\.\d+)?\s+every\s+(month|year|week|quarter)/i,
    ];
    return recurrencePatterns.some(pattern => pattern.test(text));
}; 