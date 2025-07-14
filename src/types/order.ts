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