// Node.js modules
const fs = require('fs');
const path = require('path');

// Quests file path
const QUESTS_PATH = path.join(__dirname, 'data/quests.json');
const CATEGORIES_PATH = path.join(__dirname, 'data/categories.json');

let quests = [];
let categoryIcons = {};
let selectedQuestId = 1;

// DOM elements
const questListEl = document.getElementById("quest-items-list");
const questDetailsEl = document.getElementById("quest-details");

// Read categories from json
function loadCategoriesFromFile() {
    try {
        if (fs.existsSync(CATEGORIES_PATH)) {
            const rawData = fs.readFileSync(CATEGORIES_PATH, 'utf-8');
            categoryIcons = JSON.parse(rawData);
        } else {
            categoryIcons = {};
            saveCategoriesToFile();
        }
    } catch (error) {
        console.error("Error while reading categories.json: ", error);
        categoryIcons = {};
    }
}

// Save categories to json
function saveCategoriesToFile() {
    try {
        fs.writeFileSync(CATEGORIES_PATH, JSON.stringify(categoryIcons, null, 2), 'utf-8');
    } catch (error) {
        console.error("Error saving to categories.json: ", error);
    }
}

// Read quests from json
function loadQuestsFromFile() {
    try {
        if (fs.existsSync(QUESTS_PATH)) {
            const rawData = fs.readFileSync(QUESTS_PATH, 'utf-8');
            quests = JSON.parse(rawData);
        } else {
            quests = [];
            saveQuestsToFile();
        }
    } catch (error) {
        console.error("Error while reading quests.json: ", error);
        quests = [];
    }
}

// Save quests to json
function saveQuestsToFile() {
    try {
        fs.writeFileSync(QUESTS_PATH, JSON.stringify(quests, null, 2), 'utf-8');
    } catch (error) {
        console.error("Error saving to quests.json: ", error);
    }
}

// Function to render the quest list
function renderQuestList() {
    questListEl.innerHTML = "";
    quests.forEach(q => {
        const icon = categoryIcons[q.category] || "?";
        const formattedDeadline = formatDeadlineDisplay(q.deadline);
        const timeLeftStr = getFormattedTimeLeft(q.deadline);

        const li = document.createElement("li");
        li.className = `quest-card ${q.id === selectedQuestId ? 'selected' : ''}`;
        li.innerHTML = `
            <div class="quest-card-icon">${icon}</div>
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
    const current = quests.find(q => q.id === selectedQuestId);
    if (!current) return;

        const formattedDeadline = formatDeadlineDisplay(current.deadline);
        const timeLeftStr = getFormattedTimeLeft(current.deadline);

    questDetailsEl.innerHTML = `
        <div>
            <div class="details-header">
            <div class="header-spacer"></div>
                <h2 class="details-title">${current.title}</h2>
                <button class="icon-btn edit-btn" title="Edit quest">🖉</button>
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
        saveQuestsToFile();
        renderQuestDetails();
    };
}

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
    renderQuestDetails();
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
    console.log("Button clicked: Add category");
};

btnCreateQuest.onclick = () => {
    addDropdown.classList.remove("show");
    console.log("Button clicked: Add quest");
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