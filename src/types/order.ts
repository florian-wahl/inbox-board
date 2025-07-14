import { ParsedOrderRecord } from '../db/schema';

export interface Order {
    id: string;
    orderNumber: string;
    merchant: string;
    amount: number;
    currency: string;
    date: string;
    status: 'pending' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
    refundStatus: 'none' | 'partial' | 'full';
    emailId: string;
    items: OrderItem[];
    createdAt: string;
    updatedAt: string;
    from: string; // sender's email address
    subject: string; // email subject
    to?: string; // recipient's email address (optional)
    labelIds?: string[]; // Gmail label IDs
    headers?: { name: string; value: string }[]; // All email headers
    orderMatchKeyword?: string | null; // NEW FIELD: keyword that flagged as order
}

export interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    currency: string;
}

export interface OrderCard {
    id: string;
    merchant: string;
    logo?: string;
    amount: number;
    currency: string;
    date: string;
    status: Order['status'];
    refundStatus: Order['refundStatus'];
    itemCount: number;
    onClick: () => void;
}

export interface OrderDetail {
    order: Order;
    items: OrderItem[];
    tracking?: TrackingInfo;
}

export interface TrackingInfo {
    carrier: string;
    trackingNumber: string;
    status: string;
    estimatedDelivery?: string;
}

// Type alias for DB record
export type OrderDB = ParsedOrderRecord;

// Helper to convert from DB record to Order
export function orderFromDB(record: ParsedOrderRecord): Order {
    const { gmailId, ...rest } = record;
    return {
        id: gmailId,
        ...rest,
    } as Order;
}

// Helper to convert from Order to DB record
export function orderToDB(order: Order): ParsedOrderRecord {
    const { id, ...rest } = order;
    return {
        gmailId: id,
        ...rest,
    } as ParsedOrderRecord;
} 