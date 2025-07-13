export interface GmailMessage {
    id: string;
    threadId: string;
    labelIds: string[];
    snippet: string;
    historyId: string;
    internalDate: string;
    payload: GmailMessagePart;
    sizeEstimate: number;
}

export interface GmailMessagePart {
    partId: string;
    mimeType: string;
    filename: string;
    headers: GmailHeader[];
    body: GmailMessageBody;
    parts?: GmailMessagePart[];
}

export interface GmailHeader {
    name: string;
    value: string;
}

export interface GmailMessageBody {
    attachmentId?: string;
    size: number;
    data?: string;
}

export interface GmailListResponse {
    messages: GmailMessage[];
    nextPageToken?: string;
    resultSizeEstimate: number;
}

export interface GmailProfile {
    emailAddress: string;
    messagesTotal: number;
    threadsTotal: number;
    historyId: string;
} 