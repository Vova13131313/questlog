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

// DOM elements
const questListEl = document.getElementById("quest-items-list");
const questDetailsEl = document.getElementById("quest-details");

// Function to render the quest list
function renderQuestList() {
    questListEl.innerHTML = "";
    quests.forEach(q => {
        const iconVal = categoryIcons[q.category] || "?";
        const iconHtml = (iconVal.startsWith('data:') || iconVal.includes('.'))
            ? `<img src="${iconVal}" style="width: 28px; height: 28px; object-fit: contain;">`
            : iconVal;

        const formattedDeadline = formatDeadlineDisplay(q.deadline);
        const timeLeftStr = getFormattedTimeLeft(q.deadline);

        const li = document.createElement("li");
        li.className = `quest-card ${q.id === selectedQuestId ? 'selected' : ''}`;
        li.innerHTML = `
            <div class="quest-card-icon">${iconHtml}</div>
            <div class="quest-card-info">
                <div class="quest-card-title">${q.title}</div>
                <div class="quest-card-timer">${formattedDeadline}; ${timeLeftStr}</div>
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
    const current = quests.find(q => q.id === selectedQuestId);
    if (!current) {
        questDetailsEl.innerHTML = `<div style="text-align: center; color: var(--text-muted); margin-top: 50px;">Select a quest er create a new one</div>`;
        return;
    }

    const formattedDeadline = formatDeadlineDisplay(current.deadline);
    const timeLeftStr = getFormattedTimeLeft(current.deadline);

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
            <div class="quest-category">${current.category}</div>
            <button class="track-btn" id="track-btn">
                ${current.isTracked ? "Untrack" : "Track"}
            </button>
            <div class="quest-timer-details">
                <div>Deadline: ${formattedDeadline}</div>
                <div>Time left: ${timeLeftStr}</div>
            </div>
        </div>
    `;

    document.getElementById("track-btn").onclick = () => {
        current.isTracked = !current.isTracked;
        saveQuestsToFile(quests);
        renderQuestDetails();
    };

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

    const categoryNames = Object.keys(categoryIcons);
    let categoryOptionsHtml = "";

    if (categoryNames.length === 0) {
        categoryOptionsHtml = `<option value="">No categories created</option>`;
    } else {
        categoryNames.forEach(category => {
            categoryOptionsHtml += `<option value="${category}">${category}</option>`;
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
                            <label class="form-label">Category</label>
                            <select id="quest-category-select" class="form-input">
                                ${categoryOptionsHtml}
                            </select>
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

    // Cancel
    document.getElementById("cancel-quest-btn").onclick = () => {
        renderQuestDetails();
    };

    // Save
    document.getElementById("save-quest-btn").onclick = () => {
        const title = document.getElementById("quest-title-input").value.trim();
        const description = document.getElementById("quest-description-input").value.trim();
        const category = document.getElementById("quest-category-select").value;
        const deadline = document.getElementById("quest-deadline-input").value;

        if (!title) {
            showError("Enter a quest title");
            return;
        }

        if (!category) {
            showError("Create a category first");
            return;
        }

        if (!deadline) {
            showError("Set a deadline date and time");
            return;
        }

        if (questToEdit) {
            questToEdit.title = title;
            questToEdit.description = description;
            questToEdit.category = category;
            questToEdit.deadline = deadline;
            selectedQuestId = questToEdit.id;
        } else {
            const newQuest = {
                id: Date.now(),
                title: title,
                description: description,
                category: category,
                deadline: deadline,
                isTracked: false
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

if (quests.length > 0 && !quests.some(q => q.id === selectedQuestId)) {
    selectedQuestId = quests[0].id;
}

renderQuestList();
renderQuestDetails();

// Updating timers every minute
setInterval(() => {
    renderQuestList();
    if (isTimerUpdatingAllowed) {
        renderQuestDetails();
    }
}, 60000)

// Dropdown menu
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

// Handle Escape key to close the window
if (window.require) {
    const { ipcRenderer } = window.require('electron');

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            ipcRenderer.send('hide-window');
        }
    });
}