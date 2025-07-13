export const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export const formatRelativeTime = (date: string | Date): string => {
    const now = new Date();
    const d = new Date(date);
    const diffInMs = now.getTime() - d.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
        return 'Today';
    } else if (diffInDays === 1) {
        return 'Yesterday';
    } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
    } else {
        return formatDate(date);
    }
};

export const formatNextBilling = (date: string | Date): string => {
    const d = new Date(date);
    const now = new Date();
    const diffInMs = d.getTime() - now.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays < 0) {
        return 'Overdue';
    } else if (diffInDays === 0) {
        return 'Today';
    } else if (diffInDays === 1) {
        return 'Tomorrow';
    } else if (diffInDays < 7) {
        return `In ${diffInDays} days`;
    } else {
        return formatDate(date);
    }
};

export const isExpired = (date: string | Date): boolean => {
    return new Date(date) < new Date();
};

export const isUpcoming = (date: string | Date, days: number = 7): boolean => {
    const d = new Date(date);
    const now = new Date();
    const diffInMs = d.getTime() - now.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    return diffInDays > 0 && diffInDays <= days;
}; 