import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { db } from '../db';

interface AuthContextType {
    accessToken: string | null;
    isAuthenticated: boolean;
    login: () => Promise<void>;
    logout: () => void;
    refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Load tokens from database on app initialization
    useEffect(() => {
        const loadTokens = async () => {
            try {
                const tokenRecord = await db.tokens.orderBy('updatedAt').reverse().first();
                if (tokenRecord && tokenRecord.refreshToken) {
                    setAccessToken(tokenRecord.accessToken);
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error('Error loading tokens from database:', error);
            }
        };

        loadTokens();
    }, []);

    const login = async (): Promise<void> => {
        try {
            // TODO: Implement OAuth flow with Gmail API
            console.log('Login functionality to be implemented');

            // For now, save dummy tokens to database
            const dummyAccessToken = 'dummy-access-token-' + Date.now();
            const dummyRefreshToken = 'dummy-refresh-token-' + Date.now();
            const now = Date.now();

            await db.tokens.add({
                accessToken: dummyAccessToken,
                refreshToken: dummyRefreshToken,
                expiresAt: now + (60 * 60 * 1000), // 1 hour from now
                createdAt: now,
                updatedAt: now,
            });

            setAccessToken(dummyAccessToken);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Error during login:', error);
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