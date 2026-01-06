'use client';

import React, { useState } from 'react';

interface LobbyProps {
  onFindMatch: (username: string) => void;
  onViewLeaderboard: () => void;
}

export function Lobby({ onFindMatch, onViewLeaderboard }: LobbyProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setError('Username cannot be empty');
      return;
    }

    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (trimmedUsername.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }

    setError('');
    onFindMatch(trimmedUsername);
  };

  return (
    <div className='flex flex-col items-center justify-center w-full py-8 px-4'>
      {/* Main Card */}
      <div className='w-full max-w-md bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 rounded-3xl shadow-2xl p-10 border-2 border-purple-500 border-opacity-30 backdrop-blur-md'>
        {/* Title */}
        <h2 className='text-5xl font-black mb-3 text-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent drop-shadow-lg'>
          4 In A Row
        </h2>
        <p className='text-center text-purple-300 mb-10 text-base font-semibold tracking-wide'>Challenge your mind with this classic game</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <label className='block text-base font-bold mb-3 text-purple-200 tracking-wide'>Enter your username:</label>
            <input
              type='text'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder='Choose a name (3-20 chars)'
              className='w-full px-5 py-4 rounded-xl bg-slate-700 bg-opacity-50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all text-lg font-semibold border-2 border-slate-600 focus:border-purple-400'
            />
          </div>

          {error && (
            <div className='text-red-300 text-base bg-red-900 bg-opacity-40 border-2 border-red-400 rounded-xl p-4 font-semibold flex items-center gap-2'>
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            type='submit'
            className='w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black py-4 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-xl text-lg tracking-wide uppercase'
          >
            🎮 Find Match
          </button>
        </form>

        {/* Divider */}
        <div className='relative my-8'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t-2 border-slate-600'></div>
          </div>
          <div className='relative flex justify-center text-base'>
            <span className='px-3 bg-slate-900 text-purple-300 font-semibold'>or</span>
          </div>
        </div>

        {/* Leaderboard Button */}
        <button
          onClick={onViewLeaderboard}
          className='w-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white font-black py-4 rounded-xl transition-all transform hover:scale-105 active:scale-95 shadow-xl text-lg tracking-wide uppercase'
        >
          📊 View Leaderboard
        </button>
      </div>

      {/* How to Play Section */}
      <div className='mt-14 max-w-2xl w-full'>
        <h3 className='text-4xl font-black mb-8 text-center bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent'>📖 How to Play</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          <div className='bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 border-2 border-blue-500 border-opacity-50 hover:border-opacity-100 transition-all hover:shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-1'>
            <p className='flex items-start gap-4'>
              <span className='text-blue-300 text-2xl font-black'>①</span>
              <span className='text-slate-100 font-semibold text-lg'>Enter your username</span>
            </p>
          </div>
          <div className='bg-gradient-to-br from-green-900 to-green-800 rounded-xl p-6 border-2 border-green-500 border-opacity-50 hover:border-opacity-100 transition-all hover:shadow-lg hover:shadow-green-500/30 transform hover:-translate-y-1'>
            <p className='flex items-start gap-4'>
              <span className='text-green-300 text-2xl font-black'>②</span>
              <span className='text-slate-100 font-semibold text-lg'>Find opponent or play AI</span>
            </p>
          </div>
          <div className='bg-gradient-to-br from-yellow-900 to-yellow-800 rounded-xl p-6 border-2 border-yellow-500 border-opacity-50 hover:border-opacity-100 transition-all hover:shadow-lg hover:shadow-yellow-500/30 transform hover:-translate-y-1'>
            <p className='flex items-start gap-4'>
              <span className='text-yellow-300 text-2xl font-black'>③</span>
              <span className='text-slate-100 font-semibold text-lg'>Connect 4 in a row</span>
            </p>
          </div>
          <div className='bg-gradient-to-br from-purple-900 to-purple-800 rounded-xl p-6 border-2 border-purple-500 border-opacity-50 hover:border-opacity-100 transition-all hover:shadow-lg hover:shadow-purple-500/30 transform hover:-translate-y-1'>
            <p className='flex items-start gap-4'>
              <span className='text-purple-300 text-2xl font-black'>④</span>
              <span className='text-slate-100 font-semibold text-lg'>Climb the leaderboard!</span>
            </p>
          </div>
        </div>
        
        <div className='mt-8 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 border-2 border-slate-600 border-opacity-50'>
          <p className='text-base text-slate-100 leading-relaxed'>
            <span className='font-black text-lg text-yellow-300'>💡 Pro Tips:</span> Match horizontally, vertically, or diagonally. 
            If you disconnect, you have <span className='text-orange-400 font-black'>30 seconds</span> to rejoin!
          </p>
        </div>
      </div>
    </div>
  );
}
