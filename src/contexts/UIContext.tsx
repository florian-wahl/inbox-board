import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
    isBottomSheetOpen: boolean;
    bottomSheetContent: ReactNode | null;
    isProgressBarVisible: boolean;
    progressValue: number;
    openBottomSheet: (content: ReactNode) => void;
    closeBottomSheet: () => void;
    showProgressBar: () => void;
    hideProgressBar: () => void;
    updateProgress: (value: number) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
    children: ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
    const [bottomSheetContent, setBottomSheetContent] = useState<ReactNode | null>(null);
    const [isProgressBarVisible, setIsProgressBarVisible] = useState(false);
    const [progressValue, setProgressValue] = useState(0);

    const openBottomSheet = (content: ReactNode): void => {
        setBottomSheetContent(content);
        setIsBottomSheetOpen(true);
    };

    const closeBottomSheet = (): void => {
        setIsBottomSheetOpen(false);
        setBottomSheetContent(null);
    };

    const showProgressBar = (): void => {
        setIsProgressBarVisible(true);
    };

    const hideProgressBar = (): void => {
        setIsProgressBarVisible(false);
        setProgressValue(0);
    };

    const updateProgress = (value: number): void => {
        setProgressValue(value);
    };

    const value: UIContextType = {
        isBottomSheetOpen,
        bottomSheetContent,
        isProgressBarVisible,
        progressValue,
        openBottomSheet,
        closeBottomSheet,
        showProgressBar,
        hideProgressBar,
        updateProgress,
    };

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = (): UIContextType => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}; 