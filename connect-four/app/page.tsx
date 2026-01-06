'use client';

import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import { Leaderboard } from './components/Leaderboard';

type GameStatus = 'lobby' | 'matchmaking' | 'playing' | 'finished' | 'leaderboard';

export default function Home() {
  const [gameStatus, setGameStatus] = useState<GameStatus>('lobby');
  const [socket, setSocket] = useState<any>(null);
  const [game, setGame] = useState<any>(null);
  const [username, setUsername] = useState<string>('');
  const [yourColor, setYourColor] = useState<'R' | 'Y' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    console.log('🔌 Attempting to connect to:', process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001');

    newSocket.on('connect', () => {
      console.log('✅ Socket Connected! ID:', newSocket.id);
      console.log('Socket Connected:', newSocket.connected);
    });

    newSocket.on('connect_error', (error: any) => {
      console.error('❌ Connection Error:', error);
    });

    newSocket.on('matchmaking_started', (data: any) => {
      console.log('🔍 Matchmaking started:', data);
      setGameStatus('matchmaking');
    });

    newSocket.on('game_started', (data: any) => {
      console.log('🎮 Game started:', data);
      setGame(data.game);
      setYourColor(data.yourColor);
      setGameStatus('playing');
      setErrorMessage('');
    });

    newSocket.on('move_made', (data: any) => {
      console.log('📍 Move made:', data);
      setGame(data.game);
    });

    newSocket.on('game_finished', (data: any) => {
      console.log('🏁 Game finished:', data);
      setGame(data.game);
      setGameStatus('finished');
    });

    newSocket.on('player_disconnected', (data: any) => {
      setErrorMessage(`${data.username} disconnected. Reconnect window: ${data.reconnectWindow}s`);
    });

    newSocket.on('player_reconnected', (data: any) => {
      setGame(data.game);
      setErrorMessage(`${data.username} reconnected!`);
    });

    newSocket.on('game_forfeited', (data: any) => {
      setGame(data.game);
      setGameStatus('finished');
      setErrorMessage(`${data.forfeitedBy} forfeited. ${data.winner} wins!`);
    });

    newSocket.on('error', (data: any) => {
      console.error('🔴 Socket Error:', data);
      setErrorMessage(data.message);
    });

    newSocket.on('move_error', (data: any) => {
      console.error('🔴 Move Error:', data);
      setErrorMessage(data.message);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setErrorMessage('Disconnected from server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleFindMatch = (enteredUsername: string) => {
    setUsername(enteredUsername);
    console.log('Finding match with username:', enteredUsername);
    console.log('Socket state:', socket);
    if (socket && socket.connected) {
      console.log('Emitting find_match event');
      socket.emit('find_match', { username: enteredUsername });
    } else {
      setErrorMessage('Not connected to server. Please wait and try again.');
    }
  };

  const handleMakeMove = (column: number) => {
    if (socket && game) {
      socket.emit('make_move', { gameId: game.id, column });
    }
  };

  const handlePlayAgain = () => {
    if (socket) {
      setGameStatus('lobby');
      setGame(null);
      setYourColor(null);
      setErrorMessage('');
    }
  };

  const handleViewLeaderboard = () => {
    setGameStatus('leaderboard');
  };

  const handleBackToLobby = () => {
    setGameStatus('lobby');
  };

  return (
    <main className='min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 text-white flex flex-col'>
      <div className='flex-1 container mx-auto px-4 py-8 flex flex-col'>
        {/* Header */}
        <div className='text-center mb-12 flex-shrink-0'>
          <h1 className='text-7xl md:text-8xl font-black mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent drop-shadow-lg'>
            🎮 4 In A Row
          </h1>
          <p className='text-purple-300 text-xl md:text-2xl font-semibold tracking-wide'>Challenge your mind. Compete globally. Win glory.</p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className='max-w-3xl mx-auto mb-6 bg-gradient-to-r from-red-900 to-red-800 bg-opacity-60 border-2 border-red-400 text-red-100 px-8 py-5 rounded-xl shadow-2xl flex items-center gap-4 backdrop-blur-sm'>
            <span className='text-3xl animate-bounce'>⚠️</span>
            <span className='font-semibold text-lg'>{errorMessage}</span>
          </div>
        )}

        {/* Content */}
        <div className='max-w-6xl mx-auto flex-1 flex flex-col justify-center'>
          {gameStatus === 'lobby' && (
            <Lobby onFindMatch={handleFindMatch} onViewLeaderboard={handleViewLeaderboard} />
          )}

          {gameStatus === 'matchmaking' && (
            <div className='flex justify-center items-center py-20'>
              <div className='text-center bg-slate-800 rounded-2xl p-12 border-2 border-slate-700 shadow-2xl max-w-sm'>
                <div className='animate-spin rounded-full h-16 w-16 border-4 border-slate-600 border-t-blue-500 mx-auto mb-6'></div>
                <p className='text-2xl font-semibold mb-3'>🔍 Searching for opponent...</p>
                <p className='text-slate-400 text-sm'>This usually takes a few seconds</p>
              </div>
            </div>
          )}

          {gameStatus === 'playing' && game && yourColor && (
            <GameBoard
              board={game.board}
              currentTurn={game.currentTurn}
              myColor={yourColor}
              onColumnClick={handleMakeMove}
              disabled={game.currentTurn !== yourColor || game.status !== 'playing'}
              players={game.players}
              winner={game.winner}
            />
          )}

          {gameStatus === 'finished' && game && (
            <div className='max-w-2xl mx-auto'>
              <div className='bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-10 text-center border-2 border-slate-700 shadow-2xl mb-8'>
                <h2 className='text-4xl font-bold mb-4'>
                  {game.winner === 'draw' 
                    ? "🤝 It's a Draw!" 
                    : game.winner === yourColor 
                    ? '🏆 Victory! 🎉' 
                    : '💔 Defeat'}
                </h2>
                <p className='text-lg text-slate-300 mb-2'>
                  <span className='font-semibold'>{game.players[0].username}</span> 
                  {' vs '} 
                  <span className='font-semibold'>{game.players[1].username}</span>
                </p>
                <p className='text-slate-400 text-sm mb-8'>Game ended after {game.moves?.length || 0} moves</p>
                <div className='flex gap-4 justify-center'>
                  <button
                    onClick={handlePlayAgain}
                    className='bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg'
                  >
                    🔄 Play Again
                  </button>
                  <button
                    onClick={handleViewLeaderboard}
                    className='bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg'
                  >
                    📊 Leaderboard
                  </button>
                </div>
              </div>
            </div>
          )}

          {gameStatus === 'leaderboard' && (
            <div className='bg-slate-800 rounded-2xl p-8 border-2 border-slate-700'>
              <Leaderboard onBack={handleBackToLobby} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
