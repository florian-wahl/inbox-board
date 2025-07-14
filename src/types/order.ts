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
    from: string; // NEW FIELD: sender's email address
    subject: string; // NEW FIELD: email subject
    to?: string; // NEW FIELD: recipient's email address (optional)
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