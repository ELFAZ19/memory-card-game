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
    moveLimit: 20, // Maximum allowed moves
    baseScore: 1000, // Base points for completing
    perfectBonus: 500, // Bonus for perfect game
    timeBonus: 300, // Maximum time bonus
    movePenalty: 20, // Points lost per extra move
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

  // Update UI
  movesDisplay.textContent = moves;
  movesLeftDisplay.textContent = gameSettings[currentDifficulty].moveLimit;
  updateTimerDisplay();
  clearInterval(timer);

  // Reset move counter color
  movesLeftDisplay.style.color = "#4CAF50";

  // Load best score
  bestDisplay.textContent = bestScores[currentDifficulty] ?? "--";

  // Create card pairs and shuffle
  const set = cardSets[currentDifficulty];
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

// Adjust grid layout based on screen size
function adjustCardGrid() {
  const headerHeight = document.querySelector(".game-header").offsetHeight;
  const availableHeight = window.innerHeight - headerHeight - 40;
  gameBoard.style.height = `${availableHeight}px`;

  const aspectRatio = window.innerWidth / window.innerHeight;
  gameBoard.style.gridTemplateColumns =
    aspectRatio < 0.8 ? "repeat(3, 1fr)" : "repeat(4, 1fr)";
}

// Create card element with flip animation
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

// Render all cards and update moves left
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
    movesLeftDisplay.style.color = "#ff5252"; // Red
  } else if (movesLeft < gameSettings[currentDifficulty].moveLimit * 0.6) {
    movesLeftDisplay.style.color = "#ffb74d"; // Orange
  }
}

// Handle card clicks with flip animation
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

  // Play sound
  if (soundEnabled) {
    flipSound.currentTime = 0;
    flipSound.play();
  }

  // Flip animation
  const cardElement = document.querySelector(`[data-id="${card.uniqueId}"]`);
  cardElement.classList.add("flipping");
  setTimeout(() => {
    cardElement.classList.remove("flipping");
    flippedCards.push(card);
    renderCards();
    checkForMatch();
  }, 150);
}

// Check for matches after flipping two cards
function checkForMatch() {
  if (flippedCards.length === 2) {
    moves++;
    movesDisplay.textContent = moves;

    const [card1, card2] = flippedCards;
    if (card1.id === card2.id) {
      // Match found
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
      // No match - flip back after delay
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

// Calculate efficiency grade (A+ to F)
function calculateEfficiency() {
  const pairs = cardSets[currentDifficulty].length;
  const perfectMoves = pairs * 2; // Minimum possible moves
  const efficiencyRatio = perfectMoves / moves;

  if (efficiencyRatio >= 0.9) return { grade: "A+", color: "#4CAF50" };
  if (efficiencyRatio >= 0.8) return { grade: "A", color: "#4CAF50" };
  if (efficiencyRatio >= 0.7) return { grade: "B", color: "#8BC34A" };
  if (efficiencyRatio >= 0.6) return { grade: "C", color: "#FFC107" };
  if (efficiencyRatio >= 0.5) return { grade: "D", color: "#FF9800" };
  return { grade: "F", color: "#F44336" };
}

// Calculate score based on performance
function calculateScore(isWin) {
  const settings = gameSettings[currentDifficulty];
  const pairs = cardSets[currentDifficulty].length;
  const perfectMoves = pairs * 2; // Minimum possible moves

  let score = 0;
  let efficiency = { grade: "F", color: "#F44336" };

  if (isWin) {
    // Base score
    score = settings.baseScore;

    // Efficiency bonus
    const moveEfficiency =
      1 - (moves - perfectMoves) / (settings.moveLimit - perfectMoves);
    score += Math.floor(settings.perfectBonus * moveEfficiency);

    // Time bonus (faster = better)
    const timeEfficiency = 1 - seconds / (pairs * 10);
    score += Math.floor(settings.timeBonus * timeEfficiency);

    efficiency = calculateEfficiency();
  } else {
    // Partial score for incomplete games
    const completionRatio = matchedIds.size / pairs;
    score = Math.floor(settings.baseScore * completionRatio * 0.5);
    efficiency = { grade: "N/A", color: "#9E9E9E" };
  }

  // Ensure score is within bounds
  score = Math.max(
    100,
    Math.min(
      score,
      settings.baseScore + settings.perfectBonus + settings.timeBonus
    )
  );

  return { score, efficiency };
}

// End game (win or lose)
function endGame(isWin) {
  gameActive = false;
  clearInterval(timer);

  // Play sound
  if (soundEnabled) {
    isWin ? winSound.play() : loseSound.play();
  }

  // Calculate results
  const { score, efficiency } = calculateScore(isWin);
  finalMoves.textContent = moves;
  finalTime.textContent = timeDisplay.textContent;
  finalScore.textContent = score;
  efficiencyDisplay.textContent = efficiency.grade;
  efficiencyDisplay.style.color = efficiency.color;

  // Update best score if needed
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

  // Update modal title based on performance
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

  // Show modal with animation
  modal.style.display = "flex";
  document.querySelector(".modal-content").classList.add("animate__bounceIn");
}

// Set difficulty level
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

// Toggle sound on/off
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

// Initialize game on load
window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("luxuryMemorySoundEnabled") === "false") {
    soundEnabled = false;
    soundBtn.textContent = "🔇";
  }
  initGame();
});
