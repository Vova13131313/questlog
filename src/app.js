const {
    loadCategoriesFromFile,
    loadQuestsFromFile,
    saveQuestsToFile
} = require('./src/storage');

const {
    getFormattedTimeLeft,
    formatDeadlineDisplay
} = require('./src/utils');

const {
    getSortedQuests
} = require('./src/filters');

const {
    renderCategoryCreateForm,
    renderQuestCreateForm,
    renderSettingsForm
} = require('./src/forms');

let quests = [];
let categoryIcons = {};
let selectedQuestId = 1;
let isTimerUpdatingAllowed = true;
let activeFilterCategories = [];
let filterMode = 'OR';
let searchQuery = '';

// DOM elements
const questListEl = document.getElementById("quest-items-list");
const questDetailsEl = document.getElementById("quest-details");
const searchInputEl = document.getElementById("search-input");

function setTimerUpdatingAllowed(value) {
    isTimerUpdatingAllowed = value;
}

function setSelectedQuestId(id) {
    selectedQuestId = id;
}

function getFormContext() {
    return {
        questDetailsEl,
        categoryIcons,
        quests,
        setTimerUpdatingAllowed,
        setSelectedQuestId,
        renderQuestList,
        renderQuestDetails
    };
}

// Function to render the quest list
function renderQuestList() {
    questListEl.innerHTML = "";
    const sortedQuests = getSortedQuests();

    if (sortedQuests.length > 0) {
        const isSelectedVisible = sortedQuests.some(q => String(q.id) === String(selectedQuestId));
        if (!isSelectedVisible) {
            selectedQuestId = sortedQuests[0].id;
            renderQuestDetails();
        }
    } else {
        selectedQuestId = null;
        if (isTimerUpdatingAllowed) {
            renderQuestDetails();
        }
    }

    sortedQuests.forEach(q => {
        const status = q.status;
        const firstCategory = (Array.isArray(q.categories) && q.categories.length > 0) ? q.categories[0] : "";
        const iconVal = categoryIcons[firstCategory] || "?";
        const iconHtml = (iconVal.startsWith('data:') || iconVal.includes('.'))
            ? `<img src="${iconVal}" style="width: 28px; height: 28px; object-fit: contain;">`
            : iconVal;

        const formattedDeadline = formatDeadlineDisplay(q.deadline);
        const timeLeftStr = status === 'completed' ? '' : `; ${getFormattedTimeLeft(q.deadline)}`;

        let badgeHtml = "";
        if (status === 'tracked') {
            badgeHtml = `<span class="quest-status-badge badge-tracked">Tracked</span>`;
        } else if (status === 'completed') {
            badgeHtml = `<span class="quest-status-badge badge-completed">Completed</span>`;
        }

        const li = document.createElement("li");
        li.className = `quest-card ${status} ${String(q.id) === String(selectedQuestId) ? 'selected' : ''}`;
        li.innerHTML = `
            <div class="quest-card-icon">${iconHtml}</div>
            <div class="quest-card-info">
                <div class="quest-card-title">${q.title} ${badgeHtml}</div>
                <div class="quest-card-timer">${formattedDeadline}${timeLeftStr}</div>
            </div>
        `;
        li.onclick = () => {
            selectedQuestId = q.id;
            renderQuestList();
            renderQuestDetails();
        };
        questListEl.appendChild(li);
    });
}

// Function to render the quest details
function renderQuestDetails() {
    isTimerUpdatingAllowed = true;
    const current = quests.find(q => String(q.id) === String(selectedQuestId));
    if (!current) {
        questDetailsEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); margin-top: 50px;">Select a quest or create a new one</div>`;
        return;
    }

    const status = current.status;
    const categoriesList = (Array.isArray(current.categories) && current.categories.length > 0)
        ? current.categories.join(", ")
        : "No category";
    const formattedDeadline = formatDeadlineDisplay(current.deadline);
    const timeLeftHtml = status === 'completed' ? '' : `<div>Time left: ${getFormattedTimeLeft(current.deadline)}</div>`;

    let actionButtonsHtml = "";
    if (status === 'untracked') {
        actionButtonsHtml = `<button class="track-btn" id="btn-action-track">Track</button>`;
    } else if (status === 'tracked') {
        actionButtonsHtml = `
            <div class="footer-actions-group">
                <button class="complete-btn" id="btn-action-complete">✔ Mark as completed</button>
                <button class="btn-secondary" id="btn-action-untrack">Untrack</button>
            </div>
        `;
    } else if (status === 'completed') {
        actionButtonsHtml = `<button class="btn-secondary" id="btn-action-restore">Reopen Quest</button>`;
    }

    questDetailsEl.innerHTML = `
        <div>
            <div class="details-header">
                <div class="header-spacer"></div>
                <h2 class="details-title">${current.title}</h2>

                <div class="edit-dropdown-container">
                    <button class="icon-btn edit-btn" id="edit-menu-btn" title="Edit quest">🖉</button>
                    <div class="edit-dropdown-menu" id="edit-dropdown">
                        <button class="dropdown-item" id="btn-edit-quest-option">
                            <span class="dropdown-icon">✏️</span> Edit
                        </button>
                        <button class="dropdown-item delete-item" id="btn-delete-quest-option">
                            <span class="dropdown-icon">🗑️</span> Delete
                        </button>
                    </div>
                </div>
            </div>
            <div class="details-body">
                <p>${current.description}</p>
            </div>
        </div>

        <div class="details-footer">
            <div class="quest-category">${categoriesList}</div>
            <div style="justify-self: center;">
                ${actionButtonsHtml}
            </div>
            <div class="quest-timer-details">
                <div>Deadline: ${formattedDeadline}</div>
                ${timeLeftHtml}
            </div>
        </div>
    `;

    const btnTrack = document.getElementById("btn-action-track");
    const btnComplete = document.getElementById("btn-action-complete");
    const btnUntrack = document.getElementById("btn-action-untrack");
    const btnRestore = document.getElementById("btn-action-restore");

    if (btnTrack) {
        btnTrack.onclick = () => {
            current.status = 'tracked';
            saveQuestsToFile(quests);
            renderQuestList();
            renderQuestDetails();
        };
    }

    if (btnComplete) {
        btnComplete.onclick = () => {
            current.status = 'completed';
            saveQuestsToFile(quests);
            renderQuestList();
            renderQuestDetails();
        };
    }

    if (btnUntrack) {
        btnUntrack.onclick = () => {
            current.status = 'untracked';
            saveQuestsToFile(quests);
            renderQuestList();
            renderQuestDetails();
        };
    }

    if (btnRestore) {
        btnRestore.onclick = () => {
            current.status = 'untracked';
            saveQuestsToFile(quests);
            renderQuestList();
            renderQuestDetails();
        };
    }

    const editMenuBtn = document.getElementById("edit-menu-btn");
    const editDropdown = document.getElementById("edit-dropdown");
    const btnEditOption = document.getElementById("btn-edit-quest-option");
    const btnDeleteOption = document.getElementById("btn-delete-quest-option");

    editMenuBtn.onclick = (e) => {
        e.stopPropagation();
        editDropdown.classList.toggle("show");
    };

    document.addEventListener("click", (e) => {
        if (editDropdown && !editDropdown.contains(e.target) && e.target !== editMenuBtn) {
            editDropdown.classList.remove("show");
        }
    });

    let isConfirmingDelete = false;

    btnEditOption.onclick = () => {
        editDropdown.classList.remove("show");
        renderQuestCreateForm(getFormContext(), current);
    };

    btnDeleteOption.onclick = (e) => {
        e.stopPropagation();

        if (!isConfirmingDelete) {
            isConfirmingDelete = true;
            btnDeleteOption.innerHTML = `<span class="dropdown-icon">⚠️</span> Are you sure?`
            btnDeleteOption.classList.add("confirm-delete")
        } else {
            editDropdown.classList.remove("show");
            deleteQuest(current.id);
        }
    };

    document.addEventListener("click", (e) => {
        if (editDropdown && !editDropdown.contains(e.target) && e.target !== editMenuBtn) {
            editDropdown.classList.remove("show");
            isConfirmingDelete = false;
            btnDeleteOption.innerHTML = `<span class="dropdown-icon">🗑️</span> Delete`;
            btnDeleteOption.classList.remove("confirm-delete");
        }
    });
}

// Delete quest function
function deleteQuest(questId) {
    quests = quests.filter(q => q.id !== questId);
    saveQuestsToFile(quests);

    if (quests.length > 0) {
        selectedQuestId = quests[0].id;
    } else {
        selectedQuestId = null;
    }

    renderQuestList();
    renderQuestDetails();
}

// Initialization
categoryIcons = loadCategoriesFromFile() || {};
quests = loadQuestsFromFile() || [];

if (quests.length > 0) {
    const hasSelected = quests.some(q => String(q.id) === String(selectedQuestId));
    if (!hasSelected) {
        selectedQuestId = quests[0].id;
    }
} else {
    selectedQuestId = null;
}

renderQuestList();
renderQuestDetails();

// Event listener for search input
if (searchInputEl) {
    searchInputEl.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderQuestList();
    });
}

// Updating timers every minute
setInterval(() => {
    renderQuestList();
    if (isTimerUpdatingAllowed) {
        renderQuestDetails();
    }
}, 60000)

// Add dropdown menu
const addBtn = document.getElementById("add-btn");
const addDropdown = document.getElementById("add-dropdown");
const btnCreateCategory = document.getElementById("btn-create-category");
const btnCreateQuest = document.getElementById("btn-create-quest");

addBtn.onclick = (e) => {
    e.stopPropagation();
    addDropdown.classList.toggle("show");
};

document.addEventListener("click", (e) => {
    if (!addDropdown.contains(e.target) && e.target !== addBtn) {
        addDropdown.classList.remove("show");
    }
});

btnCreateCategory.onclick = () => {
    addDropdown.classList.remove("show");
    renderCategoryCreateForm(getFormContext());
};

btnCreateQuest.onclick = () => {
    addDropdown.classList.remove("show");
    renderQuestCreateForm(getFormContext());
};

// Filter dropdown menu
const filterBtn = document.getElementById("filter-btn");
const filterDropdown = document.getElementById("filter-dropdown");

function renderFilterDropdown() {
    if (!filterDropdown) return;

    const categoryNames = Object.keys(categoryIcons).sort((a, b) => a.localeCompare(b));
    let categoriesCheckboxesHtml = "";

    if (categoryNames.length === 0) {
        categoriesCheckboxesHtml = `<div style="color: var(--text-muted); font-size: 13px; padding: 8px;">No categories created</div>`;
    } else {
        categoryNames.forEach(category => {
            const isChecked = activeFilterCategories.includes(category) ? "checked" : "";
            categoriesCheckboxesHtml += `
                <label class="category-checkbox-label">
                    <input type="checkbox" name="filter-categories" value="${category}" ${isChecked}>
                    <span>${categoryIcons[category] || ''} ${category}</span>
                </label>
            `;
        });
    }

    filterDropdown.innerHTML = `
        <div class="filter-dropdown-header">
            <div class="filter-mode-switch">
                <button class="btn-secondary ${filterMode === 'OR' ? 'active' : ''}" id="btn-mode-or" style="padding: 2px 8px; font-size: 11px;">OR</button>
                <button class="btn-secondary ${filterMode === 'AND' ? 'active' : ''}" id="btn-mode-and" style="padding: 2px 8px; font-size: 11px;">AND</button>
            </div>
        </div>
        <div class="filter-categories-list">
            ${categoriesCheckboxesHtml}
        </div>
    `;

    const btnModeOr = document.getElementById("btn-mode-or");
    const btnModeAnd = document.getElementById("btn-mode-and");

    if (btnModeOr) {
        btnModeOr.onclick = (e) => {
            e.stopPropagation();
            if (filterMode !== 'OR') {
                filterMode = 'OR';
                renderFilterDropdown();
                renderQuestList();
            }
        };
    }

    if (btnModeAnd) {
        btnModeAnd.onclick = (e) => {
            e.stopPropagation();
            if (filterMode !== 'AND') {
                filterMode = 'AND';
                renderFilterDropdown();
                renderQuestList();
            }
        };
    }

    const checkboxes = filterDropdown.querySelectorAll('input[name="filter-categories"]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
            const val = e.target.value;
            if (e.target.checked) {
                if (!activeFilterCategories.includes(val)) {
                    activeFilterCategories.push(val);
                }
            } else {
                activeFilterCategories = activeFilterCategories.filter(category => category !== val);
            }
            renderQuestList();
        });
    });
}

if (filterBtn && filterDropdown) {
    filterBtn.onclick = (e) => {
        e.stopPropagation();
        if (addDropdown) addDropdown.classList.remove("show");

        const isShown = filterDropdown.classList.toggle("show");
        if (isShown) {
            renderFilterDropdown();
        }
    };

    document.addEventListener("click", (e) => {
        if (filterDropdown.classList.contains("show") && !filterDropdown.contains(e.target) && e.target !== filterBtn) {
            filterDropdown.classList.remove("show");
        }
    });
}

// Settings button
const settingsBtn = document.getElementById("settings-btn");

if (settingsBtn) {
    settingsBtn.onclick = () => {
        if (addDropdown) addDropdown.classList.remove("show");
        if (filterDropdown) filterDropdown.classList.remove("show");
        renderSettingsForm(getFormContext());
    };
}

// Handle Escape key to close the window
if (window.require) {
    const { ipcRenderer } = window.require('electron');

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            ipcRenderer.send('hide-window');
        }
    });
}