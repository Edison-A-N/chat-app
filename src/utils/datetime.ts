export const getLocalTimezone = (): string => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

export const formatDateTime = (timestamp: number): string => {
    const d = new Date(timestamp);
    return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};
