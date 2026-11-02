// Sample data for quests and categories
const categoryIcons = {
    "Category 1": "📖",
    "Category 2": "🎮"
};

const console = require('console');

// Node.js modules
const fs = require('fs');
const path = require('path');

// Quests file path
const DB_PATH = path.join(__dirname, 'data/quests.json');

let quests = [];
let selectedQuestId = 1;

// DOM elements
const questListEl = document.getElementById("quest-items-list");
const questDetailsEl = document.getElementById("quest-details");

// Read quests from json
function loadQuestsFromFile() {
    try {
        if (fs.existsSync(DB_PATH)) {
            const rawData = fs.readFileSync(DB_PATH, 'utf-8');
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
        fs.writeFileSync(DB_PATH, JSON.stringify(quests, null, 2), 'utf-8');
    } catch (error) {
        console.error("Error saving to quests.json: ", error);
    }
}

// Function to render the quest list
function renderQuestList() {
    questListEl.innerHTML = "";
    quests.forEach(q => {
        const icon = categoryIcons[q.category] || "?";
        const li = document.createElement("li");
        li.className = `quest-card ${q.id === selectedQuestId ? 'selected' : ''}`;
        li.innerHTML = `
            <div class="quest-card-icon">${icon}</div>
            <div class="quest-card-info">
                <div class="quest-card-title">${q.title}</div>
                <div class="quest-card-timer">Time left: ${q.timeLeft}</div>
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
                <div>Deadline: ${current.deadline}</div>
                <div>Time left: ${current.timeLeft}</div>
            </div>
        </div>
    `;

    document.getElementById("track-btn").onclick = () => {
        current.isTracked = !current.isTracked;
        saveQuestsToFile();
        renderQuestDetails();
    };
}

// Initialization
loadQuestsFromFile();
if (quests.length > 0 && !quests.some(q => q.id === selectedQuestId)) {
    selectedQuestId = quests[0].id;
}
renderQuestList();
renderQuestDetails();

// Handle Escape key to close the window
if (window.require) {
    const { ipcRenderer } = window.require('electron');

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            ipcRenderer.send('hide-window');
        }
    });
}