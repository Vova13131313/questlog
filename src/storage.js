// Node.js modules
const fs = require('fs');
const path = require('path');

// Quests file path
const QUESTS_PATH = path.join(__dirname, '../data/quests.json');
const CATEGORIES_PATH = path.join(__dirname, '../data/categories.json');

// Read categories from json
function loadCategoriesFromFile() {
    try {
        if (fs.existsSync(CATEGORIES_PATH)) {
            const rawData = fs.readFileSync(CATEGORIES_PATH, 'utf-8');
            categoryIcons = JSON.parse(rawData);
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
            quests = JSON.parse(rawData);
        } else {
            const defaultQuests = [];
            saveQuestsToFile(defaultQuests);
            return [];
        }
    } catch (error) {
        console.error("Error while reading quests.json: ", error);
        quests = [];
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