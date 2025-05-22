// Enhanced Game Data with Luxury Symbols
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

// Game settings by difficulty level
const gameSettings = {
  easy: {
    moveLimit: 20,
    baseScore: 1000,
    perfectBonus: 500,
    timeBonus: 300,
    movePenalty: 20,
  },
  medium: {
    moveLimit: 30,
    baseScore: 1500,
    perfectBonus: 750,
    timeBonus: 400,
    movePenalty: 15,
  },
  hard: {
    moveLimit: 40,
    baseScore: 2000,
    perfectBonus: 1000,
    timeBonus: 500,
    movePenalty: 10,
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
let soundEnabled = true;

// DOM Elements
const gameBoard = document.getElementById("game-board");
const movesDisplay = document.getElementById("moves");
const timeDisplay = document.getElementById("time");
const bestDisplay = document.getElementById("best");
const restartBtn = document.getElementById("restart-btn");
const modal = document.getElementById("modal");
const finalMoves = document.getElementById("final-moves");
const finalTime = document.getElementById("final-time");
const finalScore = document.getElementById("final-score");
const efficiencyDisplay = document.getElementById("efficiency");
const bestMessage = document.getElementById("best-message");
const playAgainBtn = document.getElementById("play-again-btn");
const shareBtn = document.getElementById("share-btn");
const soundBtn = document.getElementById("sound-btn");
const difficultyBtns = document.querySelectorAll(".difficulty-btn");
const flipSound = document.getElementById("flip-sound");
const matchSound = document.getElementById("match-sound");
const winSound = document.getElementById("win-sound");

// Initialize Game
function initGame() {
  moves = 0;
  seconds = 0;
  flippedCards = [];
  matchedIds.clear();
  gameActive = true;

  movesDisplay.textContent = moves;
  updateTimerDisplay();
  clearInterval(timer);

  bestDisplay.textContent = bestScores[currentDifficulty] ?? "--";

  const set = cardSets[currentDifficulty];
  cards = set
    .flatMap((card) => [
      { ...card, uniqueId: crypto.randomUUID() },
      { ...card, uniqueId: crypto.randomUUID() },
    ])
    .sort(() => Math.random() - 0.5);

  renderCards();
  startTimer();
}

// Create card element
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

// Render all cards
function renderCards() {
  gameBoard.innerHTML = "";
  cards.forEach((card) => {
    gameBoard.appendChild(createCardElement(card));
  });
}

// Handle card clicks
function handleCardClick(card) {
  if (
    !gameActive ||
    flippedCards.length === 2 ||
    flippedCards.some((c) => c.uniqueId === card.uniqueId) ||
    matchedIds.has(card.id)
  ) {
    return;
  }

  if (moves >= gameSettings[currentDifficulty].moveLimit) {
    endGame(false);
    return;
  }

  if (soundEnabled) {
    flipSound.currentTime = 0;
    flipSound.play();
  }

  flippedCards.push(card);
  renderCards();
  checkForMatch();
}

// Check for matches
function checkForMatch() {
  if (flippedCards.length === 2) {
    moves++;
    movesDisplay.textContent = moves;

    const [card1, card2] = flippedCards;
    if (card1.id === card2.id) {
      matchedIds.add(card1.id);
      flippedCards = [];

      if (matchedIds.size === cardSets[currentDifficulty].length) {
        setTimeout(() => endGame(true), 500);
      } else {
        renderCards();
      }

      if (soundEnabled) {
        matchSound.currentTime = 0;
        matchSound.play();
      }
    } else {
      setTimeout(() => {
        flippedCards = [];
        renderCards();
      }, 1000);
    }
  }
}

// Calculate efficiency grade
function calculateEfficiency() {
  const pairs = cardSets[currentDifficulty].length;
  const perfectMoves = pairs * 2;
  const efficiencyRatio = perfectMoves / moves;

  if (efficiencyRatio >= 0.9) return { grade: "A+", color: "#4CAF50" };
  if (efficiencyRatio >= 0.8) return { grade: "A", color: "#4CAF50" };
  if (efficiencyRatio >= 0.7) return { grade: "B", color: "#8BC34A" };
  if (efficiencyRatio >= 0.6) return { grade: "C", color: "#FFC107" };
  if (efficiencyRatio >= 0.5) return { grade: "D", color: "#FF9800" };
  return { grade: "F", color: "#F44336" };
}

// Calculate score
function calculateScore(isWin) {
  const settings = gameSettings[currentDifficulty];
  const pairs = cardSets[currentDifficulty].length;
  const perfectMoves = pairs * 2;

  let score = 0;
  let efficiency = { grade: "F", color: "#F44336" };

  if (isWin) {
    score = settings.baseScore;
    const moveEfficiency =
      1 - (moves - perfectMoves) / (settings.moveLimit - perfectMoves);
    score += Math.floor(settings.perfectBonus * moveEfficiency);
    const timeEfficiency = 1 - seconds / (pairs * 10);
    score += Math.floor(settings.timeBonus * timeEfficiency);
    efficiency = calculateEfficiency();
  } else {
    const completionRatio = matchedIds.size / pairs;
    score = Math.floor(settings.baseScore * completionRatio * 0.5);
    efficiency = { grade: "N/A", color: "#9E9E9E" };
  }

  score = Math.max(
    100,
    Math.min(
      score,
      settings.baseScore + settings.perfectBonus + settings.timeBonus
    )
  );

  return { score, efficiency };
}

// End game
function endGame(isWin) {
  gameActive = false;
  clearInterval(timer);

  if (soundEnabled) {
    isWin ? winSound.play() : loseSound.play();
  }

  const { score, efficiency } = calculateScore(isWin);
  finalMoves.textContent = moves;
  finalTime.textContent = timeDisplay.textContent;
  finalScore.textContent = score;
  efficiencyDisplay.textContent = efficiency.grade;
  efficiencyDisplay.style.color = efficiency.color;

  if (
    isWin &&
    (!bestScores[currentDifficulty] || score > bestScores[currentDifficulty])
  ) {
    bestScores[currentDifficulty] = score;
    localStorage.setItem("luxuryMemoryBestScores", JSON.stringify(bestScores));
    bestDisplay.textContent = score;
    bestMessage.style.display = "block";
  } else {
    bestMessage.style.display = "none";
  }

  const modalTitle = document.querySelector(".modal-content h2");
  if (isWin) {
    modalTitle.textContent =
      efficiency.grade === "A+"
        ? "✨ Perfect Game! ✨"
        : `✨ You Won! ✨ (${efficiency.grade})`;
    modalTitle.style.color = "#4CAF50";
  } else {
    modalTitle.textContent = "😞 Out of Moves!";
    modalTitle.style.color = "#F44336";
  }

  modal.style.display = "flex";
  document.querySelector(".modal-content").classList.add("animate__bounceIn");
}

// Set difficulty
function setDifficulty(difficulty) {
  currentDifficulty = difficulty;
  difficultyBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.difficulty === difficulty);
  });
  initGame();
}

// Share game results
function shareGame() {
  const gameUrl = window.location.href;
  const shareText = `I scored ${finalScore.textContent} points in Luxury Memory (${currentDifficulty} mode) with ${efficiencyDisplay.textContent} efficiency! Time: ${finalTime.textContent}, Moves: ${finalMoves.textContent}. Can you beat me? ${gameUrl}`;

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

// Toggle sound
function toggleSound() {
  soundEnabled = !soundEnabled;
  soundBtn.textContent = soundEnabled ? "🔊" : "🔇";
  localStorage.setItem("luxuryMemorySoundEnabled", soundEnabled);
}

// Timer functions
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
  timeDisplay.textContent = `${mins}:${secs}`;
}

// Event Listeners
restartBtn.addEventListener("click", initGame);
playAgainBtn.addEventListener("click", () => {
  modal.style.display = "none";
  initGame();
});
shareBtn.addEventListener("click", shareGame);
soundBtn.addEventListener("click", toggleSound);
difficultyBtns.forEach((btn) => {
  btn.addEventListener("click", () => setDifficulty(btn.dataset.difficulty));
});

// Initialize game
window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("luxuryMemorySoundEnabled") === "false") {
    soundEnabled = false;
    soundBtn.textContent = "🔇";
  }
  initGame();
});
