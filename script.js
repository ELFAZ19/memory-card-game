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
const bestMessage = document.getElementById("best-message");
const playAgainBtn = document.getElementById("play-again-btn");
const shareBtn = document.getElementById("share-btn");
const soundBtn = document.getElementById("sound-btn");
const difficultyBtns = document.querySelectorAll(".difficulty-btn");
const flipSound = document.getElementById("flip-sound");
const matchSound = document.getElementById("match-sound");
const winSound = document.getElementById("win-sound");

// Responsive Grid
window.addEventListener("resize", adjustCardGrid);
function adjustCardGrid() {
  const headerHeight = document.querySelector(".game-header").offsetHeight;
  const availableHeight = window.innerHeight - headerHeight - 40;
  gameBoard.style.height = `${availableHeight}px`;
  const aspectRatio = window.innerWidth / window.innerHeight;
  gameBoard.style.gridTemplateColumns =
    aspectRatio < 0.8 ? "repeat(3, 1fr)" : "repeat(4, 1fr)";
}

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

// Render Cards
function renderCards() {
  gameBoard.innerHTML = "";

  cards.forEach((card) => {
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
          <div class="card-front">${card.emoji}</div>
          <div class="card-back"></div>
        </div>
      `;

    if (!isMatched) {
      cardElement.addEventListener("click", () => handleCardClick(card));
    }

    gameBoard.appendChild(cardElement);
  });
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

  if (soundEnabled) {
    flipSound.currentTime = 0;
    flipSound.play();
  }

  flippedCards.push(card);
  renderCards();

  if (flippedCards.length === 2) {
    moves++;
    movesDisplay.textContent = moves;

    const [card1, card2] = flippedCards;
    if (card1.id === card2.id) {
      matchedIds.add(card1.id);
      flippedCards = [];

      if (matchedIds.size === cardSets[currentDifficulty].length) {
        setTimeout(endGame, 500);
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
function calculateScore() {
  const timePenalty = Math.floor(seconds / 5);
  const movePenalty = moves - cardSets[currentDifficulty].length;
  return Math.max(100, 1000 - timePenalty - movePenalty);
}

// End Game
function endGame() {
  gameActive = false;
  clearInterval(timer);

  if (soundEnabled) {
    winSound.currentTime = 0;
    winSound.play();
  }

  const score = calculateScore();
  finalMoves.textContent = moves;
  finalTime.textContent = timeDisplay.textContent;
  finalScore.textContent = score;

  if (!bestScores[currentDifficulty] || moves < bestScores[currentDifficulty]) {
    bestScores[currentDifficulty] = moves;
    localStorage.setItem("luxuryMemoryBestScores", JSON.stringify(bestScores));
    bestDisplay.textContent = moves;
    bestMessage.style.display = "block";
  } else {
    bestMessage.style.display = "none";
  }

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

// Event Listeners
restartBtn.addEventListener("click", initGame);
playAgainBtn.addEventListener("click", () => {
  modal.style.display = "none";
  initGame();
});
shareBtn.addEventListener("click", shareGame);
soundBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundBtn.textContent = soundEnabled ? "🔊" : "🔇";
});
difficultyBtns.forEach((btn) => {
  btn.addEventListener("click", () => setDifficulty(btn.dataset.difficulty));
});

// Start game on load
window.addEventListener("DOMContentLoaded", initGame);
