import React, { createContext, useContext, useState, ReactNode } from 'react';

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

    const login = async (): Promise<void> => {
        // TODO: Implement OAuth flow with Gmail API
        console.log('Login functionality to be implemented');
    };

    const logout = (): void => {
        setAccessToken(null);
        setIsAuthenticated(false);
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