export function formatDuration(seconds) {
    let result = [];

    const days = Math.floor(seconds / 86400);
    seconds -= days * 86400;

    const hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;

    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    seconds = Math.floor(seconds);

    if (days >= 1) {
        result.push(`${days}d`);
    }

    if (hours >= 1 || days >= 1) {
        result.push(`${hours}h`);
    }

    if (minutes >= 1 || hours >= 1 || days >= 1) {
        result.push(`${minutes}m`);
    }

    result.push(`${seconds}s`);

    result = result.join(' ');

    return result;
};

export function formatByteSize(bytes) {
    let suffix = ' bytes';
    let largerThanBytes = false;

    if (bytes >= (1024 * 1024 * 1024 * 1024)) {
        bytes /= (1024 * 1024 * 1024 * 1024) / 100;
        suffix = 'TB';
        largerThanBytes = true;
    }

    if (!largerThanBytes && bytes >= (1024 * 1024 * 1024)) {
        bytes /= (1024 * 1024 * 1024) / 100;
        suffix = 'GB';
        largerThanBytes = true;
    }

    if (!largerThanBytes && bytes >= (1024 * 1024)) {
        bytes /= (1024 * 1024) / 100;
        suffix = 'MB';
        largerThanBytes = true;
    }
    
    if (!largerThanBytes && bytes >= 1024) {
        bytes /= 1024 / 100;
        suffix = 'KB';
        largerThanBytes = true;
    }

    return (largerThanBytes ? (Math.floor(bytes) / 100).toFixed(2) : bytes) + suffix;
}
