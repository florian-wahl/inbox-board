const STORAGE_PREFIX = 'inbox_board_';

export const storage = {
    get: <T>(key: string, defaultValue: T): T => {
        try {
            const item = localStorage.getItem(STORAGE_PREFIX + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },

    set: <T>(key: string, value: T): void => {
        try {
            localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
        } catch (error) {
            console.error('Error writing to localStorage:', error);
        }
    },

    remove: (key: string): void => {
        try {
            localStorage.removeItem(STORAGE_PREFIX + key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    },

    clear: (): void => {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(STORAGE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error('Error clearing localStorage:', error);
        }
    },
};

// UI Preferences
export const UI_PREFERENCES = {
    HIDDEN_CARDS: 'hidden_cards',
    CARD_ORDER: 'card_order',
    SHOW_PROGRESS_BAR: 'show_progress_bar',
    AUTO_SYNC: 'auto_sync',
    SYNC_FREQUENCY: 'sync_frequency',
    CACHE_SIZE: 'cache_size',
} as const;

export const getHiddenCards = (): string[] => {
    return storage.get<string[]>(UI_PREFERENCES.HIDDEN_CARDS, []);
};

export const setHiddenCards = (hiddenCards: string[]): void => {
    storage.set(UI_PREFERENCES.HIDDEN_CARDS, hiddenCards);
};

export const getCardOrder = (): string[] => {
    return storage.get<string[]>(UI_PREFERENCES.CARD_ORDER, ['subscriptions', 'orders', 'unsubscribes']);
};

export const setCardOrder = (cardOrder: string[]): void => {
    storage.set(UI_PREFERENCES.CARD_ORDER, cardOrder);
};

export const getShowProgressBar = (): boolean => {
    return storage.get<boolean>(UI_PREFERENCES.SHOW_PROGRESS_BAR, true);
};

export const setShowProgressBar = (show: boolean): void => {
    storage.set(UI_PREFERENCES.SHOW_PROGRESS_BAR, show);
};

export const getAutoSync = (): boolean => {
    return storage.get<boolean>(UI_PREFERENCES.AUTO_SYNC, true);
};

export const setAutoSync = (enabled: boolean): void => {
    storage.set(UI_PREFERENCES.AUTO_SYNC, enabled);
};

export const getSyncFrequency = (): number => {
    return storage.get<number>(UI_PREFERENCES.SYNC_FREQUENCY, 30);
};

export const setSyncFrequency = (minutes: number): void => {
    storage.set(UI_PREFERENCES.SYNC_FREQUENCY, minutes);
};

export const getCacheSize = (): number => {
    return storage.get<number>(UI_PREFERENCES.CACHE_SIZE, 100);
};

export const setCacheSize = (mb: number): void => {
    storage.set(UI_PREFERENCES.CACHE_SIZE, mb);
}; 