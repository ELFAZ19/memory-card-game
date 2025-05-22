// Game Configuration
const cardSets = {
  easy: [
    { id: 1, name: "Spade", emoji: "♠" },
    { id: 2, name: "Heart", emoji: "♥" },
    { id: 3, name: "Club", emoji: "♣" },
  ],
  medium: [
    { id: 1, name: "Diamond", emoji: "♦" },
    { id: 2, name: "Star", emoji: "★" },
    { id: 3, name: "Moon", emoji: "☽" },
    { id: 4, name: "Sun", emoji: "☀" },
  ],
  hard: [
    { id: 1, name: "Castle", emoji: "♔" },
    { id: 2, name: "Knight", emoji: "♘" },
    { id: 3, name: "Queen", emoji: "♕" },
    { id: 4, name: "King", emoji: "♚" },
    { id: 5, name: "Crown", emoji: "👑" },
  ],
};

const gameSettings = {
  easy: {
    moveLimit: 20,
    baseScore: 1000,
    perfectBonus: 500,
    movePenalty: 20,
    timeBonusMax: 300,
  },
  medium: {
    moveLimit: 30,
    baseScore: 1500,
    perfectBonus: 750,
    movePenalty: 15,
    timeBonusMax: 450,
  },
  hard: {
    moveLimit: 40,
    baseScore: 2000,
    perfectBonus: 1000,
    movePenalty: 10,
    timeBonusMax: 600,
  },
};

// Game State
let cards = [];
let flippedCards = [];
let matchedIds = new Set();
let moves = 0;
let seconds = 0;
let timer = null;
let gameActive = false;
let currentDifficulty = "medium";
let bestScores = JSON.parse(localStorage.getItem("luxuryMemoryBestScores")) || {
  easy: null,
  medium: null,
  hard: null,
};
let soundEnabled = localStorage.getItem("luxuryMemorySoundEnabled") !== "false";

// DOM Elements
const elements = {
  gameBoard: document.getElementById("game-board"),
  movesDisplay: document.getElementById("moves"),
  movesLeftDisplay: document.getElementById("moves-left"),
  timeDisplay: document.getElementById("time"),
  bestDisplay: document.getElementById("best"),
  restartBtn: document.getElementById("restart-btn"),
  modal: document.getElementById("modal"),
  finalMoves: document.getElementById("final-moves"),
  finalTime: document.getElementById("final-time"),
  finalScore: document.getElementById("final-score"),
  efficiencyDisplay: document.getElementById("efficiency"),
  bestMessage: document.getElementById("best-message"),
  playAgainBtn: document.getElementById("play-again-btn"),
  shareBtn: document.getElementById("share-btn"),
  soundBtn: document.getElementById("sound-btn"),
  modalTitle: document.querySelector(".modal-content h2"),
  difficultyBtns: document.querySelectorAll(".difficulty-btn"),
  flipSound: document.getElementById("flip-sound"),
  matchSound: document.getElementById("match-sound"),
  winSound: document.getElementById("win-sound"),
  loseSound: document.getElementById("lose-sound"),
};

// Initialize Game
function initGame() {
  moves = 0;
  seconds = 0;
  flippedCards = [];
  matchedIds.clear();
  gameActive = true;

  elements.movesDisplay.textContent = moves;
  elements.movesLeftDisplay.textContent =
    gameSettings[currentDifficulty].moveLimit;
  updateTimerDisplay();
  clearInterval(timer);

  const set = cardSets[currentDifficulty];
  elements.bestDisplay.textContent = bestScores[currentDifficulty] ?? "--";

  // Create card pairs with unique IDs
  cards = set
    .flatMap((card) => [
      { ...card, uniqueId: crypto.randomUUID() },
      { ...card, uniqueId: crypto.randomUUID() },
    ])
    .sort(() => Math.random() - 0.5);

  renderCards();
  startTimer();
  adjustCardGrid();
}

// Render Cards
function renderCards() {
  elements.gameBoard.innerHTML = "";
  cards.forEach((card) => {
    const cardElement = createCardElement(card);
    elements.gameBoard.appendChild(cardElement);
  });
  updateMovesDisplay();
}

function createCardElement(card) {
  const cardElement = document.createElement("div");
  cardElement.className = "card";
  cardElement.dataset.id = card.uniqueId;

  const isFlipped = flippedCards.some((c) => c.uniqueId === card.uniqueId);
  const isMatched = matchedIds.has(card.id);

  if (isFlipped || isMatched) cardElement.classList.add("flipped");
  if (isMatched) {
    cardElement.classList.add("matched");
    cardElement.style.pointerEvents = "none";
  }

  cardElement.innerHTML = `
    <div class="card-inner">
      <div class="card-face card-front">${card.emoji}</div>
      <div class="card-face card-back"></div>
    </div>
  `;

  if (!isMatched) {
    cardElement.addEventListener("click", () => handleCardClick(card));
  }

  return cardElement;
}

function updateMovesDisplay() {
  const settings = gameSettings[currentDifficulty];
  const movesLeft = settings.moveLimit - moves;

  elements.movesDisplay.textContent = moves;
  elements.movesLeftDisplay.textContent = movesLeft;

  // Color coding based on remaining moves
  if (movesLeft < settings.moveLimit * 0.25) {
    elements.movesLeftDisplay.style.color = "#ff5252";
  } else if (movesLeft < settings.moveLimit * 0.5) {
    elements.movesLeftDisplay.style.color = "#ffb74d";
  } else {
    elements.movesLeftDisplay.style.color = "#4CAF50";
  }
}

// Handle Card Click
function handleCardClick(card) {
  if (
    !gameActive ||
    flippedCards.length === 2 ||
    flippedCards.some((c) => c.uniqueId === card.uniqueId) ||
    matchedIds.has(card.id)
  ) {
    return;
  }

  // Check move limit
  if (moves >= gameSettings[currentDifficulty].moveLimit) {
    endGame(false);
    return;
  }

  playSound(elements.flipSound);
  flipCard(card);
}

function flipCard(card) {
  const cardElement = document.querySelector(`[data-id="${card.uniqueId}"]`);
  cardElement.classList.add("flipping");

  setTimeout(() => {
    cardElement.classList.remove("flipping");
    flippedCards.push(card);
    renderCards();

    if (flippedCards.length === 2) {
      moves++;
      checkForMatch();
    }
  }, 150);
}

function checkForMatch() {
  const [card1, card2] = flippedCards;

  if (card1.id === card2.id) {
    handleMatch();
  } else {
    handleMismatch();
  }
}

function handleMatch() {
  matchedIds.add(flippedCards[0].id);
  playSound(elements.matchSound);

  if (matchedIds.size === cardSets[currentDifficulty].length) {
    setTimeout(() => endGame(true), 500);
  } else {
    flippedCards = [];
    renderCards();
  }
}

function handleMismatch() {
  setTimeout(() => {
    flippedCards.forEach((card) => {
      const cardElement = document.querySelector(
        `[data-id="${card.uniqueId}"]`
      );
      cardElement.classList.add("flipping");
    });

    setTimeout(() => {
      flippedCards = [];
      renderCards();
    }, 150);
  }, 1000);
}

// Game End Logic
function endGame(isWin) {
  gameActive = false;
  clearInterval(timer);
  playSound(isWin ? elements.winSound : elements.loseSound);

  const { score, efficiency } = calculateScore(isWin);
  updateResultsModal(isWin, score, efficiency);
  updateBestScores(isWin, score);

  elements.modal.style.display = "flex";
  document.querySelector(".modal-content").classList.add("animate__bounceIn");
}

function calculateScore(isWin) {
  const settings = gameSettings[currentDifficulty];
  const pairs = cardSets[currentDifficulty].length;
  const perfectMoves = pairs * 2; // Minimum possible moves
  let score = 0;
  let efficiency = "F";

  if (isWin) {
    // Base score
    score = settings.baseScore;

    // Efficiency bonus (based on moves used)
    const moveEfficiency = Math.max(
      0,
      1 - (moves - perfectMoves) / (settings.moveLimit - perfectMoves)
    );
    score += Math.floor(settings.perfectBonus * moveEfficiency);

    // Time bonus (based on speed)
    const timeEfficiency = 1 - seconds / (pairs * 10);
    score += Math.floor(settings.timeBonusMax * timeEfficiency);

    efficiency = calculateEfficiencyGrade(moves, pairs);
  } else {
    // Partial score for incomplete games
    const completionRatio = matchedIds.size / pairs;
    score = Math.floor(settings.baseScore * completionRatio * 0.5);
    efficiency = "N/A";
  }

  score = Math.max(
    100,
    Math.min(
      score,
      settings.baseScore + settings.perfectBonus + settings.timeBonusMax
    )
  );
  return { score, efficiency };
}

function calculateEfficiencyGrade(moves, pairs) {
  const perfectMoves = pairs * 2;
  const efficiencyRatio = perfectMoves / moves;

  if (efficiencyRatio >= 0.9) return "A+";
  if (efficiencyRatio >= 0.8) return "A";
  if (efficiencyRatio >= 0.7) return "B";
  if (efficiencyRatio >= 0.6) return "C";
  if (efficiencyRatio >= 0.5) return "D";
  return "F";
}

function updateResultsModal(isWin, score, efficiency) {
  elements.finalMoves.textContent = moves;
  elements.finalTime.textContent = elements.timeDisplay.textContent;
  elements.finalScore.textContent = score;
  elements.efficiencyDisplay.textContent = efficiency;
  elements.efficiencyDisplay.dataset.grade = efficiency;

  if (isWin) {
    elements.modalTitle.textContent =
      efficiency === "A+"
        ? "✨ Perfect Game! ✨"
        : `✨ You Won! ✨ (${efficiency})`;
    elements.modalTitle.style.color = "#4CAF50";
  } else {
    elements.modalTitle.textContent = "😞 Out of Moves!";
    elements.modalTitle.style.color = "#F44336";
  }
}

function updateBestScores(isWin, score) {
  if (
    isWin &&
    (!bestScores[currentDifficulty] || score > bestScores[currentDifficulty])
  ) {
    bestScores[currentDifficulty] = score;
    localStorage.setItem("luxuryMemoryBestScores", JSON.stringify(bestScores));
    elements.bestDisplay.textContent = score;
    elements.bestMessage.style.display = "block";
  } else {
    elements.bestMessage.style.display = "none";
  }
}

// Timer Functions
function startTimer() {
  seconds = 0;
  updateTimerDisplay();
  timer = setInterval(() => {
    seconds++;
    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  elements.timeDisplay.textContent = `${mins}:${secs}`;
}

// Responsive Grid
function adjustCardGrid() {
  const headerHeight = document.querySelector(".game-header").offsetHeight;
  const availableHeight = window.innerHeight - headerHeight - 40;
  elements.gameBoard.style.height = `${availableHeight}px`;

  const aspectRatio = window.innerWidth / window.innerHeight;
  elements.gameBoard.style.gridTemplateColumns =
    aspectRatio < 0.8 ? "repeat(3, 1fr)" : "repeat(4, 1fr)";
}

// Sound Functions
function playSound(soundElement) {
  if (soundEnabled && soundElement) {
    soundElement.currentTime = 0;
    soundElement.play().catch((e) => console.log("Sound play failed:", e));
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  elements.soundBtn.textContent = soundEnabled ? "🔊" : "🔇";
  localStorage.setItem("luxuryMemorySoundEnabled", soundEnabled);
}

// Share Function
function shareGame() {
  const gameUrl = window.location.href;
  const shareText =
    `I scored ${elements.finalScore.textContent} in Luxury Memory (${currentDifficulty} mode)! ` +
    `Time: ${elements.finalTime.textContent}, Moves: ${elements.finalMoves.textContent}, ` +
    `Efficiency: ${elements.efficiencyDisplay.textContent}. Try to beat me! ${gameUrl}`;

  if (navigator.share) {
    navigator
      .share({
        title: "Luxury Memory Game",
        text: shareText,
        url: gameUrl,
      })
      .catch((err) => console.log("Share failed:", err));
  } else if (navigator.clipboard) {
    navigator.clipboard
      .writeText(shareText)
      .then(() => alert("Results copied to clipboard!"))
      .catch(() => prompt("Copy this to share:", shareText));
  } else {
    prompt("Copy this to share:", shareText);
  }
}

// Event Listeners
function setupEventListeners() {
  elements.restartBtn.addEventListener("click", initGame);
  elements.playAgainBtn.addEventListener("click", () => {
    elements.modal.style.display = "none";
    initGame();
  });
  elements.shareBtn.addEventListener("click", shareGame);
  elements.soundBtn.addEventListener("click", toggleSound);

  elements.difficultyBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentDifficulty = btn.dataset.difficulty;
      initGame();
    });
  });

  window.addEventListener("resize", adjustCardGrid);
}

// Initialize
function initializeGame() {
  elements.soundBtn.textContent = soundEnabled ? "🔊" : "🔇";
  setupEventListeners();
  initGame();
}

// Start the game when ready
if (document.readyState === "complete") {
  initializeGame();
} else {
  window.addEventListener("DOMContentLoaded", initializeGame);
}
