// Node.js modules
const fs = require('fs');
const path = require('path');
const os = require('os');

// AppData path
const userAppData = process.env.APPDATA ||
    (process.platform === 'darwin'
        ? path.join(os.homedir(), 'Library', 'Application Support')
        : path.join(os.homedir(), '.config'));

const DATA_DIR = path.join(userAppData, 'questlog', 'data');

// Create directory if doesn't exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Quests file path
const QUESTS_PATH = path.join(DATA_DIR, 'quests.json');
const CATEGORIES_PATH = path.join(DATA_DIR, 'categories.json');

// Read categories from json
function loadCategoriesFromFile() {
    try {
        if (fs.existsSync(CATEGORIES_PATH)) {
            const rawData = fs.readFileSync(CATEGORIES_PATH, 'utf-8');
            return JSON.parse(rawData);
        } else {
            const defaultCategories = {};
            saveCategoriesToFile(defaultCategories);
            return defaultCategories;
        }
    } catch (error) {
        console.error("Error while reading categories.json: ", error);
        return {};
    }
}

// Save categories to json
function saveCategoriesToFile(categoryIcons) {
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
            return JSON.parse(rawData);
        } else {
            const defaultQuests = [];
            saveQuestsToFile(defaultQuests);
            return [];
        }
    } catch (error) {
        console.error("Error while reading quests.json: ", error);
        return [];
    }
}

// Save quests to json
function saveQuestsToFile(quests) {
    try {
        fs.writeFileSync(QUESTS_PATH, JSON.stringify(quests, null, 2), 'utf-8');
    } catch (error) {
        console.error("Error saving to quests.json: ", error);
    }
}

module.exports = {
    loadCategoriesFromFile,
    saveCategoriesToFile,
    loadQuestsFromFile,
    saveQuestsToFile
};