import { useState } from "react";
import "./styles/card.css";

const Card = ({ card, handleChoice, flipped, disabled }) => {
  const handleClick = () => {
    if (!disabled) {
      handleChoice(card);
    }
  };

  return (
    <div className={`card ${flipped ? "flipped" : ""}`}>
      <div className="front">
        <img src={card.src} alt="card front" />
      </div>
      <div className="back" onClick={handleClick}>
        <img src="/images/cover.png" alt="card back" />
      </div>
    </div>
  );
};

export default Card;
