const {
    saveCategoriesToFile,
    saveQuestsToFile
} = require('./storage');

const {
    getDefaultDeadlineString
} = require('./utils');

// Create category form
function renderCategoryCreateForm(context, categoryToEdit = null, returnToSettings = false) {
    const {
        questDetailsEl,
        categoryIcons,
        quests,
        setTimerUpdatingAllowed,
        renderQuestDetails,
        renderQuestList
    } = context;

    setTimerUpdatingAllowed(false);

    const initialName = categoryToEdit || "";
    const initialIcon = categoryToEdit ? (categoryIcons[categoryToEdit] || "") : "";
    const isFileIcon = initialIcon.startsWith('data:') || initialIcon.includes('.');

    const formTitle = categoryToEdit ? "Edit Category" : "New Category";
    let iconFileResult = isFileIcon ? initialIcon : null;

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
                        <input type="text" id="category-name-input" class="form-input" value="${initialName}" placeholder="Work, study, hobby etc...">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Icon type</label>
                        <div class="icon-type-selector">
                            <label class="radio-btn-label ${!isFileIcon ? 'active' : ''}" id="label-emoji">
                                <input type="radio" name="icon-type" value="emoji" ${!isFileIcon ? 'checked' : ''} id="type-emoji"> Symbol / Emoji
                            </label>
                            <label class="radio-btn-label ${isFileIcon ? 'active' : ''}" id="label-file">
                                <input type="radio" name="icon-type" value="file" ${isFileIcon ? 'checked' : ''} id="type-file"> Image
                            </label>
                        </div>
                    </div>

                    <div class="form-group" id="group-emoji" style="display: ${!isFileIcon ? 'flex' : 'none'}">
                        <label class="form-label">Icon (emoji)</label>
                        <input type="text" id="category-emoji-input" class="form-input" value="${!isFileIcon ? initialIcon : ''}" placeholder="🕮, ⚔..." maxlength="4">
                    </div>

                    <div class="form-group" id="group-file" style="display: ${isFileIcon ? 'flex' : 'none'}">
                        <label class="form-label">Image file</label>
                        <div class="file-input-wrapper">
                            <div class="form-input file-input-custom">
                                <span id="file-name-display" class="file-name-text" style="${isFileIcon ? 'color: var(--gold);' : ''}">
                                    ${isFileIcon ? 'Image loaded' : 'Choose image file...'}
                                </span>
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

    function handleBack() {
        if (returnToSettings) {
            renderSettingsForm(context);
        } else {
            renderQuestDetails();
        }
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

            const reader = new FileReader();
            reader.onload = function (e) {
                iconFileResult = e.target.result;
            };
            reader.readAsDataURL(fileInput.files[0]);
        }
    }

    // Cancel
    document.getElementById("cancel-category-btn").onclick = () => {
        handleBack();
    }

    // Save
    document.getElementById("save-category-btn").onclick = () => {
        const name = document.getElementById("category-name-input").value.trim();
        if (!name) {
            showError("Enter category name");
            return
        }

        let newIcon = "";

        if (typeEmoji.checked) {
            const emoji = document.getElementById("category-emoji-input").value.trim();
            if (!emoji) {
                showError("Enter symbol / emoji");
                return;
            }
            newIcon = emoji;
        } else if (typeFile.checked) {
            if (!iconFileResult) {
                showError("Choose image file");
                return;
            }
            newIcon = iconFileResult;
        }

        if (categoryToEdit && categoryToEdit !== name) {
            delete categoryIcons[categoryToEdit];
            quests.forEach(q => {
                if (Array.isArray(q.categories)) {
                    q.categories = q.categories.map(c => c === categoryToEdit ? name : c);
                }
            });
            saveQuestsToFile(quests);
        }

        categoryIcons[name] = newIcon;
        saveCategoriesToFile(categoryIcons);
        renderQuestList();
        handleBack();
    };
}

// Create quest form
function renderQuestCreateForm(context, questToEdit = null) {
    const {
        questDetailsEl,
        categoryIcons,
        quests,
        setTimerUpdatingAllowed,
        setSelectedQuestId,
        renderQuestList,
        renderQuestDetails
    } = context;

    setTimerUpdatingAllowed(false);

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
            setSelectedQuestId(questToEdit.id);
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
            setSelectedQuestId(newQuest.id);
        }

        saveQuestsToFile(quests);
        renderQuestList();
        renderQuestDetails();
    };
}

function renderSettingsForm(context) {
    const {
        questDetailsEl,
        categoryIcons,
        quests,
        setTimerUpdatingAllowed,
        renderQuestDetails,
        renderQuestList
    } = context;

    setTimerUpdatingAllowed(false);

    const categoryNames = Object.keys(categoryIcons).sort((a, b) => a.localeCompare(b));
    let categoriesListHtml = "";

    if (categoryNames.length === 0) {
        categoriesListHtml = `<div style="text-align: center; color: var(--text-muted); padding: 20px 0;">No categories created yet</div>`
    } else {
        categoryNames.forEach(category => {
            const iconVal = categoryIcons[category] || "?";
            const iconHtml = (iconVal.startsWith('data:') || iconVal.includes('.'))
                ? `<img src="${iconVal}" style="width: 22px; height 22px; object-fit: contain;">`
                : iconVal;

            categoriesListHtml += `
                <div class="settings-category-item">
                    <div class="settings-category-info">
                        <div class="settings-category-icon">${iconHtml}</div>
                        <span>${category}</span>
                    </div>
                    <div class="settings-category-actions">
                        <button class="btn-icon-action edit-action" data-category="${category}" title="Edit category">✏️</button>
                        <button class="btn-icon-action delete-action" data-category="${category}" title="Delete category">🗑️</button>
                    </div>
                </div>
            `;
        });
    }

    questDetailsEl.innerHTML = `
        <div class="form-container">
            <div>
                <div class="details-header">
                    <div class="header-spacer"></div>
                    <h2 class="details-title">Settings</h2>
                    <div class="header-spacer"></div>
                </div>

                <div class="details-body" style="display: flex; flex-direction: column; gap: 20px;">
                    <div class="form-group settings-category-manager">
                        <label class="form-label">Categories</label>
                        <div class="settings-category-list">
                            ${categoriesListHtml}
                        </div>
                    </div>
                </div>
            </div>

            <div class="form-actions">
                <button class="btn-secondary" id="close-settings-btn" style="width: 200px;">Back</button>
            </div>
        </div>
    `;

    const editBtns = questDetailsEl.querySelectorAll(".edit-action");
    editBtns.forEach(btn => {
        btn.onclick = () => {
            const categoryName = btn.getAttribute("data-category");
            renderCategoryCreateForm(context, categoryName, true);
        };
    });

    const deleteBtns = questDetailsEl.querySelectorAll(".delete-action");
    deleteBtns.forEach(btn => {
        btn.onclick = () => {
            const categoryName = btn.getAttribute("data-category");

            delete categoryIcons[categoryName];
            saveCategoriesToFile(categoryIcons);

            quests.forEach(q => {
                if (Array.isArray(q.categories)) {
                    q.categories = q.categories.filter(c => c !== categoryName);
                }
            });
            saveQuestsToFile(quests);

            renderQuestList();
            renderSettingsForm(context);
        };
    });

    document.getElementById("close-settings-btn").onclick = () => {
        renderQuestDetails();
    };
}

module.exports = {
    renderCategoryCreateForm,
    renderQuestCreateForm,
    renderSettingsForm
};