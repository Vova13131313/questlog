const {
    loadCategoriesFromFile,
    saveCategoriesToFile,
    loadQuestsFromFile,
    saveQuestsToFile
} = require('./src/storage');

const {
    getFormattedTimeLeft,
    formatDeadlineDisplay,
    getDefaultDeadlineString
} = require('./src/utils');

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
        renderQuestDetails();
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
        renderQuestCreateForm(current);
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

// Create category form
function renderCategoryCreateForm() {
    isTimerUpdatingAllowed = false;

    questDetailsEl.innerHTML = `
        <div class="form-container">
            <div>
                <div class="details-header">
                    <div class="header-spacer"></div>
                    <h2 class="details-title">New category</h2>
                    <div class="header-spacer"></div>
                </div>

                <div class="details-body" style="display: flex; flex-direction: column; gap: 20px;">
                    <div class="form-group">
                        <label class="form-label">Category name</label>
                        <input type="text" id="category-name-input" class="form-input" placeholder="Work, study, hobby etc...">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Icon type</label>
                        <div class="icon-type-selector">
                            <label class="radio-btn-label active" id="label-emoji">
                                <input type="radio" name="icon-type" value="emoji" checked id="type-emoji"> Symbol / Emoji
                            </label>
                            <label class="radio-btn-label" id="label-file">
                                <input type="radio" name="icon-type" value="file" id="type-file"> Image
                            </label>
                        </div>
                    </div>

                    <div class="form-group" id="group-emoji">
                        <label class="form-label">Icon (emoji)</label>
                        <input type="text" id="category-emoji-input" class="form-input" placeholder="📖, ⚔️, 💼..." maxlength="4">
                    </div>

                    <div class="form-group" id="group-file" style="display: none">
                        <label class="form-label">Image file</label>
                        <div class="file-input-wrapper">
                            <div class="form-input file-input-custom">
                                <span id="file-name-display" class="file-name-text">Choose image file...</span>
                                <span>📁</span>
                            </div>
                            <input type="file" id="category-file-input" accept="image/*" class="file-input-hidden">
                        </div>
                    </div>

                    <div id="form-error-msg" class="form-error"></div>
                </div>
            </div>

            <div class="form-actions">
                <button class="track-btn" id="save-category-btn">Save</button>
                <button class="btn-secondary" id="cancel-category-btn">Cancel</button>
            </div>
        </div>
    `;
    
    // Emoji & file switching
    const typeEmoji = document.getElementById("type-emoji");
    const typeFile = document.getElementById("type-file");
    const groupEmoji = document.getElementById("group-emoji");
    const groupFile = document.getElementById("group-file");
    const labelEmoji = document.getElementById("label-emoji");
    const labelFile = document.getElementById("label-file");
    const fileInput = document.getElementById("category-file-input");
    const fileNameDisplay = document.getElementById("file-name-display");
    const errorMsg = document.getElementById("form-error-msg");

    function showError(text) {
        errorMsg.textContent = text;
        errorMsg.style.display = "block";
    }

    function hideError() {
        errorMsg.style.display = "none";
    }

    typeEmoji.onchange = () => {
        groupEmoji.style.display = "flex";
        groupFile.style.display = "none";
        labelEmoji.classList.add("active");
        labelFile.classList.remove("active");
    };

    typeFile.onchange = () => {
        groupEmoji.style.display = "none";
        groupFile.style.display = "flex";
        labelEmoji.classList.remove("active");
        labelFile.classList.add("active");
    };

    fileInput.onchange = () => {
        if (fileInput.files && fileInput.files[0]) {
            fileNameDisplay.textContent = fileInput.files[0].name;
            fileNameDisplay.style.color = "var(--gold)";
            hideError();
        }
    }

    // Cancel
    document.getElementById("cancel-category-btn").onclick = () => {
        renderQuestDetails();
    }

    // Save
    document.getElementById("save-category-btn").onclick = () => {
        const name = document.getElementById("category-name-input").value.trim();
        if (!name) {
            showError("Enter category name");
            return
        }

        if (typeEmoji.checked) {
            const emoji = document.getElementById("category-emoji-input").value.trim();
            if (emoji) {
                categoryIcons[name] = emoji;
                saveCategoriesToFile(categoryIcons);
                renderQuestDetails();
            } else {
                showError("Enter symbol / emoji");
            }
        }

        if (typeFile.checked) {
            const fileInput = document.getElementById("category-file-input");
            if (fileInput.files && fileInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    categoryIcons[name] = e.target.result;
                    saveCategoriesToFile(categoryIcons);
                    renderQuestDetails();
                };
                reader.readAsDataURL(fileInput.files[0]);
            } else {
                showError("Choose image file")
            }
        }
    };
}

// Create quest form
function renderQuestCreateForm(questToEdit = null) {
    isTimerUpdatingAllowed = false;

    const categoryNames = Object.keys(categoryIcons).sort((a, b) => a.localeCompare(b));
    let categoriesCheckboxesHtml = "";
    let currentCategories = (questToEdit && Array.isArray(questToEdit.categories))
        ? [...questToEdit.categories]
        : [];

    if (categoryNames.length === 0) {
        categoriesCheckboxesHtml = `<div style="color: var(--text-muted); font-size: 13px;">No categories created</div>`;
    } else {
        categoryNames.forEach(category => {
            const isChecked = currentCategories.includes(category) ? "checked" : "";
            categoriesCheckboxesHtml += `
                <label class="category-checkbox-label">
                    <input type="checkbox" name="quest-categories" value="${category}" ${isChecked}>
                    <span>${categoryIcons[category] || ''} ${category}</span>
                </label>
            `;
        });
    }

    const formTitle = questToEdit ? "Edit Quest" : "New Quest";
    const initialTitle = questToEdit ? questToEdit.title : "";
    const initialDescription = questToEdit ? questToEdit.description : "";
    const initialDeadline = questToEdit ? questToEdit.deadline : getDefaultDeadlineString();

    questDetailsEl.innerHTML = `
        <div class="form-container">
            <div>
                <div class="details-header">
                    <div class="header-spacer"></div>
                    <h2 class="details-title">${formTitle}</h2>
                    <div class="header-spacer"></div>
                </div>

                <div class="details-body" style="display: flex; flex-direction: column; gap: 16px;">
                    <div class="form-group">
                        <label class="form-label">Quest title</label>
                        <input type="text" id="quest-title-input" class="form-input" value="${initialTitle}" placeholder="Quest title...">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea id="quest-description-input" class="form-input" placeholder="Quest details and steps...">${initialDescription}</textarea>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="form-group">
                            <label class="form-label">Categories (select one or more)</label>
                            <div class="categories-checkbox-group">
                                ${categoriesCheckboxesHtml}
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Deadline</label>
                            <input type="datetime-local" id="quest-deadline-input" class="form-input" value="${initialDeadline}">
                        </div>
                    </div>

                    <div id="quest-form-error-msg" class="form-error"></div>
                </div>
            </div>

            <div class="form-actions">
                <button class="track-btn" id="save-quest-btn">Save</button>
                <button class="btn-secondary" id="cancel-quest-btn">Cancel</button>
            </div>
        </div>
    `;

    const errorMsg = document.getElementById("quest-form-error-msg");

    function showError(text) {
        errorMsg.textContent = text;
        errorMsg.style.display = "block";
    }

    const checkboxes = questDetailsEl.querySelectorAll('input[name="quest-categories"]');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
            const val = e.target.value;
            if (e.target.checked) {
                if (!currentCategories.includes(val)) {
                    currentCategories.push(val);
                }
            } else {
                currentCategories = currentCategories.filter(category => category !== val);
            }
        });
    });

    // Cancel
    document.getElementById("cancel-quest-btn").onclick = () => {
        renderQuestDetails();
    };

    // Save
    document.getElementById("save-quest-btn").onclick = () => {
        const title = document.getElementById("quest-title-input").value.trim();
        const description = document.getElementById("quest-description-input").value.trim();
        const deadline = document.getElementById("quest-deadline-input").value;

        if (!title) {
            showError("Enter a quest title");
            return;
        }

        if (currentCategories.length === 0) {
            showError("Select at least one category");
            return;
        }

        if (!deadline) {
            showError("Set a deadline date and time");
            return;
        }

        if (questToEdit) {
            questToEdit.title = title;
            questToEdit.description = description;
            questToEdit.categories = currentCategories;
            questToEdit.deadline = deadline;
            selectedQuestId = questToEdit.id;
        } else {
            const newQuest = {
                id: Date.now(),
                title: title,
                description: description,
                categories: currentCategories,
                deadline: deadline,
                status: 'untracked'
            };
            quests.push(newQuest);
            selectedQuestId = newQuest.id;
        }

        saveQuestsToFile(quests);
        renderQuestList();
        renderQuestDetails();
    };
}

// Initialization
loadCategoriesFromFile();
loadQuestsFromFile();

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
    renderCategoryCreateForm();
};

btnCreateQuest.onclick = () => {
    addDropdown.classList.remove("show");
    renderQuestCreateForm();
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

// Handle Escape key to close the window
if (window.require) {
    const { ipcRenderer } = window.require('electron');

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            ipcRenderer.send('hide-window');
        }
    });
}