'use client';

import React from 'react';

type CellValue = 'R' | 'Y' | null;

interface GameBoardProps {
  board: CellValue[][];
  currentTurn: 'R' | 'Y';
  myColor: 'R' | 'Y';
  onColumnClick: (column: number) => void;
  disabled: boolean;
  players: Array<{ username: string; color: 'R' | 'Y'; type: 'human' | 'bot'; connected: boolean }>;
  winner: 'R' | 'Y' | 'draw' | null;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  currentTurn,
  myColor,
  onColumnClick,
  disabled,
  players,
  winner,
}) => {
  const isMyTurn = currentTurn === myColor && !disabled;
  const ROWS = 6;
  const COLS = 7;

  const getCellColor = (value: CellValue) => {
    if (value === 'R') return 'bg-red-500';
    if (value === 'Y') return 'bg-yellow-400';
    return 'bg-white';
  };

  const canDropInColumn = (col: number) => {
    return board[0][col] === null;
  };

  const handleColumnClick = (col: number) => {
    if (isMyTurn && canDropInColumn(col)) {
      onColumnClick(col);
    }
  };

  const getPlayerInfo = (color: 'R' | 'Y') => {
    const player = players.find(p => p.color === color);
    if (!player) return { name: '?', isBot: false, connected: true };
    return {
      name: player.username,
      isBot: player.type === 'bot',
      connected: player.connected
    };
  };

  const redPlayer = getPlayerInfo('R');
  const yellowPlayer = getPlayerInfo('Y');

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-5xl mx-auto justify-center">
      {/* Players Info */}
      <div className="w-full grid grid-cols-2 gap-6">
        <div className={`p-6 rounded-2xl border-2 transition-all transform ${currentTurn === 'R' ? 'bg-gradient-to-br from-red-900 to-red-800 border-red-400 ring-2 ring-red-300 shadow-2xl shadow-red-500/50 scale-105' : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-500'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full font-black text-lg flex items-center justify-center ${currentTurn === 'R' ? 'bg-red-500 ring-3 ring-red-300 animate-pulse text-white' : 'bg-red-500 text-white'}`}>R</div>
            <div>
              <p className="font-black text-xl text-white tracking-wide">
                {redPlayer.name} {redPlayer.isBot && '🤖 Bot'}
              </p>
              <p className="text-sm text-slate-200 font-semibold">
                {myColor === 'R' ? '👤 You' : ''}
                {!redPlayer.connected && ' ❌ Disconnected'}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-2xl border-2 transition-all transform ${currentTurn === 'Y' ? 'bg-gradient-to-br from-yellow-900 to-yellow-800 border-yellow-400 ring-2 ring-yellow-300 shadow-2xl shadow-yellow-500/50 scale-105' : 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-500'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full font-black text-lg flex items-center justify-center ${currentTurn === 'Y' ? 'bg-yellow-400 ring-3 ring-yellow-300 animate-pulse text-slate-900' : 'bg-yellow-400 text-slate-900'}`}>Y</div>
            <div>
              <p className="font-black text-xl text-white tracking-wide">
                {yellowPlayer.name} {yellowPlayer.isBot && '🤖 Bot'}
              </p>
              <p className="text-sm text-slate-300">
                {myColor === 'Y' ? '👤 You' : ''}
                {!yellowPlayer.connected && ' ❌ Disconnected'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Turn Indicator */}
      {!winner && (
        <div className="text-center w-full">
          <p className={`text-xl font-black px-8 py-4 rounded-2xl inline-block tracking-wide ${
            isMyTurn 
              ? 'bg-gradient-to-r from-green-500 to-green-600 border-2 border-green-300 text-white animate-pulse shadow-xl shadow-green-500/50' 
              : 'bg-gradient-to-r from-slate-700 to-slate-800 border-2 border-slate-500 text-slate-200'
          }`}>
            {isMyTurn ? (
              <span>🎮 Your Turn! Make a move...</span>
            ) : (
              <span>⏳ Opponent's Turn</span>
            )}
          </p>
        </div>
      )}

      {/* Winner Display */}
      {winner && (
        <div className="text-center p-8 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-3xl shadow-2xl w-full border-3 border-purple-300 transform scale-105">
          <p className="text-4xl font-black text-white drop-shadow-lg">
            {winner === 'draw' ? (
              "🤝 It's a Draw!"
            ) : winner === myColor ? (
              '🏆 You Win! 🎉'
            ) : (
              '💔 You Lost'
            )}
          </p>
        </div>
      )}

      {/* Game Board */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-900 p-8 rounded-3xl shadow-2xl border-4 border-blue-300">
        <div className="grid grid-cols-7 gap-3 bg-blue-950 p-6 rounded-2xl">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleColumnClick(colIndex)}
                disabled={!isMyTurn || !canDropInColumn(colIndex) || winner !== null}
                className={`
                  w-20 h-20 rounded-full transition-all duration-200 font-bold text-sm
                  ${getCellColor(cell)}
                  ${isMyTurn && canDropInColumn(colIndex) && !winner ? 'hover:ring-4 hover:ring-yellow-300 cursor-pointer transform hover:scale-125 hover:shadow-2xl hover:shadow-yellow-300/70 hover:-translate-y-2' : ''}
                  ${!isMyTurn || !canDropInColumn(colIndex) || winner ? 'cursor-not-allowed opacity-90' : ''}
                  shadow-lg border-2 border-blue-700
                `}
                title={canDropInColumn(colIndex) ? `Click to drop in column ${colIndex + 1}` : 'Column is full'}
              />
            ))
          )}
        </div>
      </div>

      {/* Column Numbers */}
      <div className="flex gap-2 justify-center">
        {Array.from({ length: COLS }, (_, i) => (
          <div key={i} className="w-16 text-center font-bold text-slate-400 text-lg">
            {i + 1}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="text-center text-slate-400 text-sm max-w-2xl">
        <p>💡 Click on any column number (1-7) to drop your disc</p>
      </div>
    </div>
  );
};