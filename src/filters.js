// Filtering quests
function getFilteredQuests() {
    let result = quests;

    if (activeFilterCategories.length > 0) {
        result = result.filter(q => {
            const questCategories = q.categories || [];
            if (filterMode === 'AND') {
                return activeFilterCategories.every(category => questCategories.includes(category));
            } else {
                return activeFilterCategories.some(category => questCategories.includes(category));
            }
        });
    }

    if (searchQuery) {
        result = result.filter(q => {
            const titleMatch = q.title && q.title.toLowerCase().includes(searchQuery);
            const descriptionMatch = q.description && q.description.toLowerCase().includes(searchQuery);
            return titleMatch || descriptionMatch;
        });
    }

    return result;
}

// Sorting quests
function getSortedQuests() {
    const priority = { 'tracked': 1, 'untracked': 2, 'completed': 3 };
    const filteredQuests = getFilteredQuests();

    return [...filteredQuests].sort((a, b) => {
        const statusA = a.status || 'untracked';
        const statusB = b.status || 'untracked';
        
        if (priority[statusA] !== priority[statusB]) {
            return priority[statusA] - priority[statusB];
        }

        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;

        const dateA = new Date(a.deadline).getTime();
        const dateB = new Date(b.deadline).getTime();

        return dateA - dateB;
    });
}

module.exports = {
    getFilteredQuests,
    getSortedQuests
};