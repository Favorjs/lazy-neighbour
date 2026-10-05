// Money is in Nigerian naira. Whole amounts have no decimals: ₦1,500. Others keep two: ₦1,500.50.
export const CURRENCY_SYMBOL = '₦';

export const formatNaira = (amount) => {
    const n = Number(amount) || 0;
    const whole = Number.isInteger(n);
    return `${CURRENCY_SYMBOL}${n.toLocaleString('en-NG', {
        minimumFractionDigits: whole ? 0 : 2,
        maximumFractionDigits: 2,
    })}`;
};

// "Just now", "5 min ago", "3 h ago", "Yesterday", then a short date
export const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
};
