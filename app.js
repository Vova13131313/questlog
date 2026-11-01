// Sample data for quests and categories
const categoryIcons = {
    "Category 1": "📖",
    "Category 2": "🎮"
};

const quests = [
    {
        id: 1,
        title: "Quest title 1",
        description: "Quest description 1",
        category: "Category 1",
        deadline: "02.11.2026",
        timeLeft: "1 day left",
        isTracked: true
    },
    {
        id: 2,
        title: "Quest title 2",
        description: "Quest description 2",
        category: "Category 2",
        deadline: "03.11.2026",
        timeLeft: "2 days left",
        isTracked: false
    }
];

let selectedQuestId = 1;

const questListEl = document.getElementById("quest-items-list");
const questDetailsEl = document.getElementById("quest-details");

function renderQuestList() {
    questListEl.innerHTML = "";
    quests.forEach(q => {
        const icon = categoryIcons[q.category] || "?";
        const li = document.createElement("li");
        li.className = "quest-card ${q.id === selectedQuestId ? 'selected' : ''}";
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
        renderQuestDetails();
    };
}

renderQuestList();
renderQuestDetails();