// Formatting time left
function getFormattedTimeLeft(deadlineStr) {
    if (!deadlineStr) return "No deadline";

    const now = new Date();
    const deadline = new Date(deadlineStr);
    const diffMs = deadline - now;

    if (diffMs <= 0) {
        return "Expired";
    }

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24) / 60));
    const minutes = totalMinutes % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);

    return parts.join(" ");
}

// Formatting date & time
function formatDeadlineDisplay(deadlineStr) {
    if (!deadlineStr) return "-";
    const d = new Date(deadlineStr);
    if (isNaN(d.getTime())) return deadlineStr;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// Default deadline
function getDefaultDeadlineString() {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

module.exports = {
    getFormattedTimeLeft,
    formatDeadlineDisplay,
    getDefaultDeadlineString
};