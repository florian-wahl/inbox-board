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
};

// Merchant patterns
export const MERCHANT_PATTERNS = {
    COMMON: /(amazon|netflix|spotify|hulu|disney|hbo|youtube|google|apple|microsoft)/gi,
    SUBSCRIPTION: /(subscription|renewal|billing|payment|charge)/gi,
    ORDER: /(order|purchase|receipt|confirmation|shipped|delivered)/gi,
};

// Email patterns
export const EMAIL_PATTERNS = {
    SENDER: /From:\s*([^\n\r]+)/gi,
    SUBJECT: /Subject:\s*([^\n\r]+)/gi,
    DATE: /Date:\s*([^\n\r]+)/gi,
};

export const extractCurrency = (text: string): { amount: number; currency: string } | null => {
    for (const [currency, pattern] of Object.entries(CURRENCY_PATTERNS)) {
        pattern.lastIndex = 0; // Reset regex state for global patterns
        const match = pattern.exec(text);
        if (match) {
            return {
                amount: parseFloat(match[1]),
                currency: currency === 'GENERIC' ? (match[2] || currency) : currency,
            };
        }
    }
    return null;
};

export const extractDate = (text: string): Date | null => {
    for (const pattern of Object.values(DATE_PATTERNS)) {
        const match = text.match(pattern);
        if (match) {
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