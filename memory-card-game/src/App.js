import { useState, useEffect } from "react";
import Header from "./components/Header";
import GameBoard from "./components/GameBoard";
import Modal from "./components/Modal";
import "./App.css";

// Card data - replace with your actual images
const cardImages = [
  { id: 1, pairId: 2, src: "/images/1.png", name: "Apple" },
  { id: 2, pairId: 1, src: "/images/2.png", name: "Apple" },
  { id: 3, pairId: 4, src: "/images/3.png", name: "Banana" },
  { id: 4, pairId: 3, src: "/images/4.png", name: "Banana" },
  { id: 5, pairId: 6, src: "/images/5.png", name: "Orange" },
  { id: 6, pairId: 5, src: "/images/6.png", name: "Orange" },
  { id: 7, pairId: 8, src: "/images/7.png", name: "Grapes" },
  { id: 8, pairId: 7, src: "/images/8.png", name: "Grapes" },
];

function App() {
  const [cards, setCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [bestScore, setBestScore] = useState(
    localStorage.getItem("bestScore") || null
  );

  // Shuffle cards for new game
  const shuffleCards = () => {
    const shuffledCards = [...cardImages]
      .sort(() => Math.random() - 0.5)
      .map((card, index) => ({ ...card, id: index }));

    setCards(shuffledCards);
    setMoves(0);
    setGameWon(false);
  };

  // Restart game handler
  const restartGame = () => {
    shuffleCards();
  };

  // Initialize game on first render
  useEffect(() => {
    shuffleCards();
  }, []);

  // Update best score when game is won
  useEffect(() => {
    if (gameWon) {
      if (!bestScore || moves < bestScore) {
        setBestScore(moves);
        localStorage.setItem("bestScore", moves);
      }
    }
  }, [gameWon, moves, bestScore]);

  return (
    <div className="App">
      <Header
        moves={moves}
        gameWon={gameWon}
        restartGame={restartGame}
        bestScore={bestScore}
      />
      <GameBoard cards={cards} setMoves={setMoves} setGameWon={setGameWon} />
      {gameWon && (
        <Modal moves={moves} bestScore={bestScore} restartGame={restartGame} />
      )}
    </div>
  );
}

export default App;
