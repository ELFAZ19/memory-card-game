// Game Data - Using emoji cards (no images needed)
const cardData = [
  { id: 1, pairId: 2, name: "Apple", emoji: "🍎" },
  { id: 2, pairId: 1, name: "Apple", emoji: "🍏" },
  { id: 3, pairId: 4, name: "Banana", emoji: "🍌" },
  { id: 4, pairId: 3, name: "Banana", emoji: "🍌" },
  { id: 5, pairId: 6, name: "Orange", emoji: "🍊" },
  { id: 6, pairId: 5, name: "Orange", emoji: "🍊" },
  { id: 7, pairId: 8, name: "Grapes", emoji: "🍇" },
  { id: 8, pairId: 7, name: "Grapes", emoji: "🍇" },
  { id: 9, pairId: 10, name: "Strawberry", emoji: "🍓" },
  { id: 10, pairId: 9, name: "Strawberry", emoji: "🍓" },
];

// Game State
let cards = [];
let flippedCards = [];
let matchedPairs = [];
let moves = 0;
let seconds = 0;
let timer = null;
let gameActive = false;
let bestScore = localStorage.getItem("memoryGameBestScore") || null;

// DOM Elements
const gameBoard = document.getElementById("game-board");
const movesDisplay = document.getElementById("moves");
const timeDisplay = document.getElementById("time");
const bestDisplay = document.getElementById("best");
const restartBtn = document.getElementById("restart-btn");
const modal = document.getElementById("modal");
const finalMoves = document.getElementById("final-moves");
const finalTime = document.getElementById("final-time");
const bestMessage = document.getElementById("best-message");
const playAgainBtn = document.getElementById("play-again-btn");

// Initialize Game
function initGame() {
  // Reset game state
  moves = 0;
  seconds = 0;
  flippedCards = [];
  matchedPairs = [];
  gameActive = true;

  // Update UI
  movesDisplay.textContent = moves;
  updateTimerDisplay();
  clearInterval(timer);

  // Load best score
  if (bestScore) {
    bestDisplay.textContent = bestScore;
  } else {
    bestDisplay.textContent = "--";
  }

  // Create and shuffle cards
  cards = [...cardData, ...cardData]
    .sort(() => Math.random() - 0.5)
    .map((card, index) => ({ ...card, uniqueId: index }));

  renderCards();
  startTimer();
}

// Render Cards
function renderCards() {
  gameBoard.innerHTML = "";

  cards.forEach((card) => {
    const cardElement = document.createElement("div");
    cardElement.className = "card";
    cardElement.dataset.id = card.uniqueId;

    // Check if card is flipped or matched
    const isFlipped = flippedCards.some((c) => c.uniqueId === card.uniqueId);
    const isMatched = matchedPairs.includes(card.id);

    if (isFlipped || isMatched) {
      cardElement.classList.add("flipped");
    }

    if (isMatched) {
      cardElement.classList.add("matched");
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
  if (!gameActive || flippedCards.length >= 2) return;

  // Don't allow clicking already flipped cards
  if (flippedCards.some((c) => c.uniqueId === card.uniqueId)) return;

  // Flip the card
  flippedCards.push(card);
  renderCards();

  // If two cards are flipped, check for match
  if (flippedCards.length === 2) {
    moves++;
    movesDisplay.textContent = moves;

    if (flippedCards[0].pairId === flippedCards[1].id) {
      // Match found
      matchedPairs.push(flippedCards[0].id, flippedCards[1].id);
      flippedCards = [];

      // Check for win
      if (matchedPairs.length === cardData.length) {
        setTimeout(endGame, 500);
      } else {
        renderCards();
      }
    } else {
      // No match - flip back after delay
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

// End Game
function endGame() {
  gameActive = false;
  clearInterval(timer);

  // Update modal
  finalMoves.textContent = moves;
  finalTime.textContent = timeDisplay.textContent;

  // Check for new best score
  if (!bestScore || moves < bestScore) {
    bestScore = moves;
    localStorage.setItem("memoryGameBestScore", bestScore);
    bestDisplay.textContent = bestScore;
    bestMessage.style.display = "block";
  } else {
    bestMessage.style.display = "none";
  }

  // Show modal with animations
  modal.style.display = "flex";
  bestMessage.classList.add("tada");
}

// Event Listeners
restartBtn.addEventListener("click", initGame);
playAgainBtn.addEventListener("click", () => {
  modal.style.display = "none";
  initGame();
});

// Start the game when page loads
window.addEventListener("DOMContentLoaded", initGame);
