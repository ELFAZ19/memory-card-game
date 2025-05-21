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

// Move limits and scoring parameters
const gameSettings = {
  easy: {
    moveLimit: 20,
    baseScore: 1000,
    perfectBonus: 500,
    movePenalty: 20,
  },
  medium: {
    moveLimit: 30,
    baseScore: 1500,
    perfectBonus: 750,
    movePenalty: 15,
  },
  hard: {
    moveLimit: 40,
    baseScore: 2000,
    perfectBonus: 1000,
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
const movesLeftDisplay = document.getElementById("moves-left");
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
const loseSound = document.getElementById("lose-sound");

// Initialize Game
function initGame() {
  moves = 0;
  seconds = 0;
  flippedCards = [];
  matchedIds.clear();
  gameActive = true;

  movesDisplay.textContent = moves;
  movesLeftDisplay.textContent = gameSettings[currentDifficulty].moveLimit;
  updateTimerDisplay();
  clearInterval(timer);

  const set = cardSets[currentDifficulty];
  bestDisplay.textContent = bestScores[currentDifficulty] ?? "--";

  // Duplicate each card for pairs
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

// Render Cards with moves left indicator
function renderCards() {
  gameBoard.innerHTML = "";
  cards.forEach((card) => {
    gameBoard.appendChild(createCardElement(card));
  });

  // Update moves left display
  const movesLeft = gameSettings[currentDifficulty].moveLimit - moves;
  movesLeftDisplay.textContent = movesLeft;

  // Color coding for moves left
  if (movesLeft < gameSettings[currentDifficulty].moveLimit * 0.3) {
    movesLeftDisplay.style.color = "#ff5252";
  } else if (movesLeft < gameSettings[currentDifficulty].moveLimit * 0.6) {
    movesLeftDisplay.style.color = "#ffb74d";
  } else {
    movesLeftDisplay.style.color = "#4CAF50";
  }
}

// Calculate Efficiency Rating (A-F)
function calculateEfficiency(moves, pairs) {
  const perfectMoves = pairs * 2; // Minimum possible moves
  const efficiencyRatio = perfectMoves / moves;

  if (efficiencyRatio >= 0.9) return "A+";
  if (efficiencyRatio >= 0.8) return "A";
  if (efficiencyRatio >= 0.7) return "B";
  if (efficiencyRatio >= 0.6) return "C";
  if (efficiencyRatio >= 0.5) return "D";
  return "F";
}

// Enhanced Scoring System
function calculateScore(isWin) {
  const settings = gameSettings[currentDifficulty];
  const pairs = cardSets[currentDifficulty].length;
  const perfectMoves = pairs * 2; // Minimum possible moves

  let score = 0;
  let efficiency = "F";

  if (isWin) {
    // Base score for completing
    score = settings.baseScore;

    // Efficiency bonus (more points for fewer moves)
    const moveEfficiency =
      1 - (moves - perfectMoves) / (settings.moveLimit - perfectMoves);
    score += Math.floor(settings.perfectBonus * moveEfficiency);

    // Time bonus (faster = better)
    const maxTimeBonus = 500;
    const timeEfficiency = 1 - seconds / (pairs * 10); // Adjust denominator as needed
    score += Math.floor(maxTimeBonus * timeEfficiency);

    efficiency = calculateEfficiency(moves, pairs);
  } else {
    // Partial score for incomplete games
    const completionRatio = matchedIds.size / pairs;
    score = Math.floor(settings.baseScore * completionRatio * 0.5);
    efficiency = "N/A";
  }

  // Ensure score is within reasonable bounds
  score = Math.max(
    100,
    Math.min(score, settings.baseScore + settings.perfectBonus + 500)
  );

  return { score, efficiency };
}

// End Game (win or lose)
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
  efficiencyDisplay.textContent = efficiency;

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

  // Update modal message
  const modalTitle = document.querySelector(".modal-content h2");
  if (isWin) {
    modalTitle.textContent =
      efficiency === "A+"
        ? "✨ Perfect Game! ✨"
        : `✨ You Won! ✨ (${efficiency})`;
    modalTitle.style.color = "#4CAF50";
  } else {
    modalTitle.textContent = "😞 Out of Moves!";
    modalTitle.style.color = "#F44336";
  }

  modal.style.display = "flex";
  document.querySelector(".modal-content").classList.add("animate__bounceIn");
}

// Handle Card Click with Move Limit Check
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

  if (soundEnabled) {
    flipSound.currentTime = 0;
    flipSound.play();
  }

  // Enhanced flip animation
  const cardElement = document.querySelector(`[data-id="${card.uniqueId}"]`);
  cardElement.classList.add("flipping");
  setTimeout(() => {
    cardElement.classList.remove("flipping");
    flippedCards.push(card);
    renderCards();
    checkForMatch();
  }, 150);
}



// Check for matches after flip
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
  timeDisplay.textContent = `${mins}:${secs}`;
}

// Calculate Score
function calculateScore(isWin) {
  const baseScore = isWin ? 1000 : 500;
  const timeBonus = Math.max(0, 300 - Math.floor(seconds / 2));
  const moveBonus = Math.max(0, moveLimits[currentDifficulty] - moves);
  return Math.max(100, baseScore + timeBonus + moveBonus);
}

// End Game (win or lose)
function endGame(isWin) {
  gameActive = false;
  clearInterval(timer);

  if (soundEnabled) {
    isWin ? winSound.play() : loseSound.play();
  }

  const score = calculateScore(isWin);
  finalMoves.textContent = moves;
  finalTime.textContent = timeDisplay.textContent;
  finalScore.textContent = score;

  if (
    isWin &&
    (!bestScores[currentDifficulty] || moves < bestScores[currentDifficulty])
  ) {
    bestScores[currentDifficulty] = moves;
    localStorage.setItem("luxuryMemoryBestScores", JSON.stringify(bestScores));
    bestDisplay.textContent = moves;
    bestMessage.style.display = "block";
  } else {
    bestMessage.style.display = "none";
  }

  // Update modal message based on win/lose
  const modalTitle = document.querySelector(".modal-content h2");
  modalTitle.textContent = isWin ? "✨ You Won! ✨" : "😞 Out of Moves!";
  modalTitle.style.color = isWin ? "#4CAF50" : "#F44336";

  modal.style.display = "flex";
  document.querySelector(".modal-content").classList.add("animate__bounceIn");
}

// Set Difficulty
function setDifficulty(difficulty) {
  currentDifficulty = difficulty;
  difficultyBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.difficulty === difficulty);
  });
  initGame();
}

// Share Game
function shareGame() {
  const gameUrl = window.location.href;
  const shareText = `I scored ${finalScore.textContent} in Luxury Memory (${currentDifficulty} mode)! Time: ${finalTime.textContent}, Moves: ${finalMoves.textContent}. Try it! ${gameUrl}`;

  if (navigator.share) {
    navigator
      .share({ title: "Luxury Memory Game", text: shareText, url: gameUrl })
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

// Toggle Sound
function toggleSound() {
  soundEnabled = !soundEnabled;
  soundBtn.textContent = soundEnabled ? "🔊" : "🔇";
  localStorage.setItem("luxuryMemorySoundEnabled", soundEnabled);
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

// Start game on load
window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("luxuryMemorySoundEnabled") === "false") {
    soundEnabled = false;
    soundBtn.textContent = "🔇";
  }
  initGame();
});
