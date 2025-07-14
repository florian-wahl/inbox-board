import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { db } from '../db';
import { gmailService } from '../services/GmailService';
import { getUserPreferences } from '../utils/dbUtils';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.email'
].join(' ');

interface AuthContextType {
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: () => Promise<void>;
    logout: () => void;
    refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

// Google Identity Services types
declare global {
    interface Window {
        google: {
            accounts: {
                oauth2: {
                    initTokenClient: (config: any) => any;
                };
            };
        };
    }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // New loading state
    const hasFetchedRef = useRef(false);

    // Load tokens from database on app initialization
    useEffect(() => {
        const loadTokens = async () => {
            try {
                console.log('Loading tokens from database...');

                // Test database connection
                const allTokens = await db.tokens.toArray();
                console.log('All tokens in database:', allTokens);

                // Try to get the most recent token record
                let tokenRecord;
                try {
                    tokenRecord = await db.tokens.orderBy('updatedAt').reverse().first();
                } catch (error) {
                    console.log('Could not order by updatedAt, trying to get first record:', error);
                    // Fallback: get the first token record if ordering fails
                    const allTokens = await db.tokens.toArray();
                    tokenRecord = allTokens[0];
                }
                console.log('Token record found:', tokenRecord);

                if (tokenRecord && tokenRecord.refreshToken && tokenRecord.accessToken) {
                    // Check if token has expired
                    const now = Date.now();
                    const isExpired = tokenRecord.expiresAt && now > tokenRecord.expiresAt;

                    console.log('Token expiration check:', {
                        now,
                        expiresAt: tokenRecord.expiresAt,
                        isExpired
                    });

                    if (!isExpired) {
                        // Test token validity by making a simple API call
                        try {
                            gmailService.setAccessToken(tokenRecord.accessToken);
                            await gmailService.getProfile();
                            console.log('Token is valid, user authenticated');
                            setAccessToken(tokenRecord.accessToken);
                            setIsAuthenticated(true);
                        } catch (error) {
                            console.log('Token is invalid, clearing from database:', error);
                            await db.tokens.clear();
                            setAccessToken(null);
                            setIsAuthenticated(false);
                        }
                    } else {
                        console.log('Token has expired, clearing from database');
                        await db.tokens.clear();
                        setAccessToken(null);
                        setIsAuthenticated(false);
                    }
                } else {
                    console.log('No valid token record found');
                }
            } catch (error) {
                console.error('Error loading tokens from database:', error);
            } finally {
                setIsLoading(false); // Set loading to false after token loading
            }
        };

        loadTokens();
    }, []);

    // Sync GmailService token whenever accessToken changes
    useEffect(() => {
        gmailService.setAccessToken(accessToken);
    }, [accessToken]);

    // Fetch initial emails after successful authentication
    const fetchInitialEmails = async (token: string) => {
        try {
            console.log('Fetching initial emails...');

            // Ensure GmailService has the token
            gmailService.setAccessToken(token);

            // Get recent messages (last 7 days to reduce API calls)
            const messages = await gmailService.getRecentMessages(7);
            console.log(`Fetched ${messages.length} recent messages`);

            // Store raw emails in database
            const now = Date.now();
            for (const message of messages) {
                // Check if this gmailId already exists in the DB
                const exists = await db.rawEmails.where('gmailId').equals(message.id).count();
                if (exists > 0) {
                    // Skip if already exists
                    continue;
                }
                // Extract full email content
                const { fullBody, decodedBody, mimeType, parts } = gmailService.extractEmailContent(message.payload, message.snippet);

                await db.rawEmails.put({
                    gmailId: message.id,
                    threadId: message.threadId,
                    subject: message.payload.headers.find(h => h.name === 'Subject')?.value || '',
                    from: message.payload.headers.find(h => h.name === 'From')?.value || '',
                    date: message.payload.headers.find(h => h.name === 'Date')?.value || '',
                    body: decodedBody || message.snippet, // Use decoded body as main body
                    snippet: message.snippet,
                    labelIds: message.labelIds,
                    // New fields
                    historyId: message.historyId,
                    internalDate: message.internalDate,
                    sizeEstimate: message.sizeEstimate,
                    fullBody: fullBody,
                    decodedBody: decodedBody,
                    allHeaders: message.payload.headers,
                    mimeType: mimeType,
                    parts: parts,
                    createdAt: now,
                    updatedAt: now,
                });
            }

            console.log('Initial emails stored in database');
        } catch (error) {
            console.error('Error fetching initial emails:', error);
            // Don't throw the error - just log it so the login still succeeds
            console.log('Email fetching failed, but login was successful');
        }
    };

    const login = async (): Promise<void> => {
        try {
            if (!window.google) {
                throw new Error('Google Identity Services not loaded');
            }

            const tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: GOOGLE_SCOPES,
                callback: async (response: any) => {
                    if (response.error) {
                        console.error('OAuth error:', response.error);
                        return;
                    }

                    try {
                        const { access_token, expires_in } = response;
                        const now = Date.now();
                        const expiresAt = now + (expires_in * 1000);

                        // For now, we'll use the access token as both access and refresh token
                        // In a real implementation, you'd get a refresh token from the OAuth flow
                        const refreshToken = access_token; // Temporary until we implement refresh token flow

                        // Save tokens to database
                        const tokenRecord = {
                            accessToken: access_token,
                            refreshToken: refreshToken,
                            expiresAt: expiresAt,
                            createdAt: now,
                            updatedAt: now,
                        };

                        console.log('Saving token to database:', tokenRecord);
                        await db.tokens.add(tokenRecord);
                        console.log('Token saved successfully');

                        setAccessToken(access_token);
                        setIsAuthenticated(true);

                        console.log('OAuth login successful');

                        // Set token in GmailService immediately before fetching emails
                        gmailService.setAccessToken(access_token);

                        // Fetch user preferences and trigger email reload after onboarding
                        if (!hasFetchedRef.current) {
                            hasFetchedRef.current = true;
                            const prefs = await getUserPreferences();
                            await fetchInitialEmails(access_token);
                        }
                    } catch (error) {
                        console.error('Error saving tokens:', error);
                    }
                },
            });

            // Trigger the OAuth flow
            tokenClient.requestAccessToken();
        } catch (error) {
            console.error('Error during OAuth login:', error);
            throw error;
        }
    };

    const logout = async (): Promise<void> => {
        try {
            // Clear tokens from database
            await db.tokens.clear();

            setAccessToken(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Error during logout:', error);
            // Still clear local state even if database clear fails
            setAccessToken(null);
            setIsAuthenticated(false);
        }
    };

    const refreshToken = async (): Promise<void> => {
        // TODO: Implement token refresh logic
        console.log('Token refresh functionality to be implemented');
    };

    const value: AuthContextType = {
        accessToken,
        isAuthenticated,
        isLoading, // Include loading state
        login,
        logout,
        refreshToken,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 