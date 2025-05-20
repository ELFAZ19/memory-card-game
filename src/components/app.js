import { useState } from "react";
import Header from "./components/Header";
import GameBoard from "./components/GameBoard";
import Modal from "./components/Modal";
import "./App.css";

// Sample card data
const cardImages = [
  { id: 1, pairId: 2, src: "/images/1.png" },
  { id: 2, pairId: 1, src: "/images/2.png" },
  { id: 3, pairId: 4, src: "/images/3.png" },
  { id: 4, pairId: 3, src: "/images/4.png" },
  // Add more pairs as needed
];

function App() {
  const [cards, setCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  const shuffleCards = () => {
    const shuffledCards = [...cardImages, ...cardImages]
      .sort(() => Math.random() - 0.5)
      .map((card, index) => ({ ...card, id: index }));

    setCards(shuffledCards);
    setMoves(0);
    setGameWon(false);
  };

  const restartGame = () => {
    shuffleCards();
  };

  useEffect(() => {
    shuffleCards();
  }, []);

  return (
    <div className="App">
      <Header moves={moves} gameWon={gameWon} restartGame={restartGame} />
      <GameBoard cards={cards} setMoves={setMoves} setGameWon={setGameWon} />
      {gameWon && <Modal moves={moves} restartGame={restartGame} />}
    </div>
  );
}

export default App;
