import { useCallback } from 'react';
import { parserService } from '../services/ParserService';
import { GmailMessage } from '../types/gmail';
import { Subscription } from '../types/subscription';
import { Order } from '../types/order';

export const useParser = () => {
    const parseSubscription = useCallback((message: GmailMessage): Subscription | null => {
        return parserService.parseSubscription(message);
    }, []);

    const parseOrder = useCallback((message: GmailMessage): Order | null => {
        return parserService.parseOrder(message);
    }, []);

    const calculateNoiseScore = useCallback((sender: string, frequency: number, lastEmail: string): number => {
        return parserService.calculateNoiseScore(sender, frequency, lastEmail);
    }, []);

    return {
        parseSubscription,
        parseOrder,
        calculateNoiseScore,
    };
}; 