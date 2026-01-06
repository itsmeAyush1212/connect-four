"use client";

import { useEffect, useState } from "react";
import { createSocket } from "@/app/lib/socket";

export function useGameSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [board, setBoard] = useState<(string | null)[][]>(
    Array(7).fill(null).map(() => Array(6).fill(null))
  );
  const [status, setStatus] = useState("Waiting...");
  const [yourTurn, setYourTurn] = useState(false);

  useEffect(() => {
    const ws = createSocket();
    setSocket(ws);

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "JOIN_GAME",
          username: localStorage.getItem("username"),
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "GAME_START") {
        setStatus("Game Started");
        setYourTurn(data.yourTurn);
      }

      if (data.type === "MOVE_MADE") {
        setBoard(data.board);
        setYourTurn(data.yourTurn);
      }

      if (data.type === "GAME_OVER") {
        setStatus(`Winner: ${data.winner}`);
      }
    };

    return () => ws.close();
  }, []);

  const makeMove = (column: number) => {
    if (!yourTurn || !socket) return;
    socket.send(JSON.stringify({ type: "MAKE_MOVE", column }));
  };

  return { board, makeMove, status, yourTurn };
}
