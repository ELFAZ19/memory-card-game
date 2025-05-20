import { useEffect, useState } from "react";

const Header = ({ moves, gameWon, restartGame }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval = null;
    if (!gameWon) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameWon]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <header>
      <h1>Memory Game</h1>
      <div className="stats">
        <div>Time: {formatTime(seconds)}</div>
        <div>Moves: {moves}</div>
      </div>
      <button onClick={restartGame}>Restart</button>
    </header>
  );
};

export default Header;
