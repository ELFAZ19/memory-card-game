// Enhanced Game Data with Luxury Symbols
const cardSets = {
  easy: [
    { id: 1, pairId: 2, name: "Spade", emoji: "♠", difficulty: "easy" },
    { id: 2, pairId: 1, name: "Spade", emoji: "♠", difficulty: "easy" },
    { id: 3, pairId: 4, name: "Heart", emoji: "♥", difficulty: "easy" },
    { id: 4, pairId: 3, name: "Heart", emoji: "♥", difficulty: "easy" },
    { id: 5, pairId: 6, name: "Club", emoji: "♣", difficulty: "easy" },
    { id: 6, pairId: 5, name: "Club", emoji: "♣", difficulty: "easy" },
  ],
  medium: [
    { id: 1, pairId: 2, name: "Diamond", emoji: "♦", difficulty: "medium" },
    { id: 2, pairId: 1, name: "Diamond", emoji: "♦", difficulty: "medium" },
    { id: 3, pairId: 4, name: "Star", emoji: "★", difficulty: "medium" },
    { id: 4, pairId: 3, name: "Star", emoji: "★", difficulty: "medium" },
    { id: 5, pairId: 6, name: "Moon", emoji: "☽", difficulty: "medium" },
    { id: 6, pairId: 5, name: "Moon", emoji: "☽", difficulty: "medium" },
    { id: 7, pairId: 8, name: "Sun", emoji: "☀", difficulty: "medium" },
    { id: 8, pairId: 7, name: "Sun", emoji: "☀", difficulty: "medium" },
  ],
  hard: [
    { id: 1, pairId: 2, name: "Castle", emoji: "♔", difficulty: "hard" },
    { id: 2, pairId: 1, name: "Castle", emoji: "♔", difficulty: "hard" },
    { id: 3, pairId: 4, name: "Knight", emoji: "♘", difficulty: "hard" },
    { id: 4, pairId: 3, name: "Knight", emoji: "♘", difficulty: "hard" },
    { id: 5, pairId: 6, name: "Queen", emoji: "♕", difficulty: "hard" },
    { id: 6, pairId: 5, name: "Queen", emoji: "♕", difficulty: "hard" },
    { id: 7, pairId: 8, name: "King", emoji: "♚", difficulty: "hard" },
    { id: 8, pairId: 7, name: "King", emoji: "♚", difficulty: "hard" },
    { id: 9, pairId: 10, name: "Crown", emoji: "👑", difficulty: "hard" },
    { id: 10, pairId: 9, name: "Crown", emoji: "👑", difficulty: "hard" },
  ],
};

// Game State
let cards = [];
let flippedCards = [];
let matchedPairs = [];
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

  // Load best score for current difficulty
  if (bestScores[currentDifficulty]) {
    bestDisplay.textContent = bestScores[currentDifficulty];
  } else {
    bestDisplay.textContent = "--";
  }

  // Create and shuffle cards for current difficulty
  cards = [...cardSets[currentDifficulty], ...cardSets[currentDifficulty]]
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
    } else if (
      flippedCards.length === 2 &&
      flippedCards.some((c) => c.uniqueId === card.uniqueId)
    ) {
      cardElement.classList.add("mismatch");
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

  // Play flip sound
  if (soundEnabled) {
    flipSound.currentTime = 0;
    flipSound.play();
  }

  // Flip the card
  flippedCards.push(card);
  renderCards();

  // If two cards are flipped, check for match
  if (flippedCards.length === 2) {
    moves++;
    movesDisplay.textContent = moves;

    if (flippedCards[0].pairId === flippedCards[1].id) {
      // Match found
      if (soundEnabled) {
        matchSound.currentTime = 0;
        matchSound.play();
      }

      matchedPairs.push(flippedCards[0].id, flippedCards[1].id);
      flippedCards = [];

      // Check for win
      if (matchedPairs.length === cardSets[currentDifficulty].length) {
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

// Calculate Score
function calculateScore() {
  const timePenalty = Math.floor(seconds / 5);
  const movePenalty = moves - cardSets[currentDifficulty].length;
  const baseScore = 1000;
  return Math.max(100, baseScore - timePenalty - movePenalty);
}

// End Game
function endGame() {
  gameActive = false;
  clearInterval(timer);

  // Play win sound
  if (soundEnabled) {
    winSound.currentTime = 0;
    winSound.play();
  }

  // Calculate final score
  const score = calculateScore();

  // Update modal
  finalMoves.textContent = moves;
  finalTime.textContent = timeDisplay.textContent;
  finalScore.textContent = score;

  // Check for new best score
  if (!bestScores[currentDifficulty] || moves < bestScores[currentDifficulty]) {
    bestScores[currentDifficulty] = moves;
    localStorage.setItem("luxuryMemoryBestScores", JSON.stringify(bestScores));
    bestDisplay.textContent = moves;
    bestMessage.style.display = "block";
  } else {
    bestMessage.style.display = "none";
  }

  // Show modal with animation
  modal.style.display = "flex";
  document.querySelector(".modal-content").classList.add("animate__bounceIn");
}

// Set Difficulty
function setDifficulty(difficulty) {
  currentDifficulty = difficulty;
  difficultyBtns.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.difficulty === difficulty) {
      btn.classList.add("active");
    }
  });
  initGame();
}

// Share Results
function shareResults() {
  const text = `I just scored ${finalScore.textContent} points in Luxury Memory Game! Can you beat my time of ${finalTime.textContent} with ${finalMoves.textContent} moves?`;

  if (navigator.share) {
    navigator
      .share({
        title: "Luxury Memory Game",
        text: text,
        url: window.location.href,
      })
      .catch((err) => {
        console.log("Error sharing:", err);
        copyToClipboard(text);
      });
  } else {
    copyToClipboard(text);
    alert("Results copied to clipboard!");
  }
}

// Copy to Clipboard
function copyToClipboard(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
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

shareBtn.addEventListener("click", shareResults);

soundBtn.addEventListener("click", toggleSound);

difficultyBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    setDifficulty(btn.dataset.difficulty);
  });
});

// Initialize sound preference
if (localStorage.getItem("luxuryMemorySoundEnabled") === "false") {
  soundEnabled = false;
  soundBtn.textContent = "🔇";
} else {
  soundEnabled = true;
  soundBtn.textContent = "🔊";
}

// Start the game when page loads
setDifficulty("medium");
