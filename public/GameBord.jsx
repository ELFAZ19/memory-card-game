import { useEffect, useState } from "react";
import Card from "./Card";
import "./styles/gameBoard.css";

const GameBoard = ({ cards, setMoves, setGameWon }) => {
  const [cardChoices, setCardChoices] = useState([]);
  const [disabled, setDisabled] = useState(false);
  const [matchedPairs, setMatchedPairs] = useState([]);

  const handleChoice = (card) => {
    if (cardChoices.length < 2 && !cardChoices.includes(card)) {
      setCardChoices([...cardChoices, card]);
      setMoves((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (cardChoices.length === 2) {
      setDisabled(true);
      if (cardChoices[0].id === cardChoices[1].pairId) {
        setMatchedPairs([...matchedPairs, cardChoices[0].id]);
        setCardChoices([]);
        setDisabled(false);
      } else {
        setTimeout(() => {
          setCardChoices([]);
          setDisabled(false);
        }, 1000);
      }
    }
  }, [cardChoices]);

  useEffect(() => {
    if (matchedPairs.length === cards.length / 2) {
      setGameWon(true);
    }
  }, [matchedPairs]);

  return (
    <div className="game-board">
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          handleChoice={handleChoice}
          flipped={cardChoices.includes(card) || matchedPairs.includes(card.id)}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

export default GameBoard;
