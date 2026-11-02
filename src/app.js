const {
    loadCategoriesFromFile,
    saveCategoriesToFile,
    loadQuestsFromFile,
    saveQuestsToFile
} = require('./src/storage');

const {
    getFormattedTimeLeft,
    formatDeadlineDisplay
} = require('./src/utils');

let quests = [];
let categoryIcons = {};
let selectedQuestId = 1;

// DOM elements
const questListEl = document.getElementById("quest-items-list");
const questDetailsEl = document.getElementById("quest-details");

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
        saveQuestsToFile(quests);
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