'use client';

import React, { useState, useEffect } from 'react';

interface LeaderboardEntry {
  rank: number;
  username: string;
  gamesWon: number;
  gamesPlayed: number;
  winRate: string;
}

interface LeaderboardProps {
  onBack: () => void;
}

export function Leaderboard({ onBack }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001'}/api/leaderboard`
        );
        const data = await response.json();

        if (data.success) {
          const withRanks = data.leaderboard.map((entry: any, index: number) => ({
            ...entry,
            rank: index + 1,
          }));
          setLeaderboard(withRanks);
        } else {
          setError('Failed to load leaderboard');
        }
      } catch (err) {
        setError('Error fetching leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className='max-w-6xl mx-auto flex flex-col items-center justify-center'>
      {/* Header */}
      <div className='w-full flex flex-col md:flex-row justify-between items-center mb-12 gap-6'>
        <div className='text-center md:text-left'>
          <h2 className='text-6xl md:text-7xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent drop-shadow-lg'>
            🏆 Leaderboard
          </h2>
          <p className='text-yellow-300 mt-4 text-lg font-semibold tracking-wide'>Top players competing for glory</p>
        </div>
        <button 
          onClick={onBack}
          className='bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-black py-3 px-8 rounded-xl transition-all transform hover:scale-110 active:scale-95 text-lg tracking-wide uppercase shadow-lg'
        >
          ← Back
        </button>
      </div>

      {loading && (
        <div className='text-center py-24 w-full'>
          <div className='inline-block animate-spin rounded-full h-16 w-16 border-4 border-slate-600 border-t-blue-500 mb-6'></div>
          <p className='text-slate-300 text-xl font-semibold tracking-wide'>Loading leaderboard...</p>
        </div>
      )}

      {error && (
        <div className='w-full bg-gradient-to-r from-red-900 to-red-800 bg-opacity-60 border-2 border-red-400 text-red-100 px-8 py-5 rounded-xl mb-6 text-center font-semibold text-lg shadow-lg'>
          ❌ {error}
        </div>
      )}

      {!loading && leaderboard.length > 0 && (
        <div className='w-full overflow-x-auto bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border-2 border-slate-600 shadow-2xl'>
          <table className='w-full'>
            <thead>
              <tr className='bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-b-3 border-slate-600'>
                <th className='px-8 py-5 text-left font-black text-yellow-300 text-lg'>🏅 Rank</th>
                <th className='px-8 py-5 text-left font-black text-slate-100 text-lg'>Player</th>
                <th className='px-8 py-5 text-center font-black text-green-300 text-lg'>✅ Wins</th>
                <th className='px-8 py-5 text-center font-black text-blue-300 text-lg'>🎮 Games</th>
                <th className='px-8 py-5 text-center font-black text-purple-300 text-lg'>📈 Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, idx) => {
                const medalEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '　';
                return (
                  <tr 
                    key={entry.username}
                    className='border-b border-slate-700 hover:bg-slate-700 hover:bg-opacity-70 transition-all transform hover:-translate-y-0.5'
                  >
                    <td className='px-8 py-5'>
                      <span className='font-black text-xl text-yellow-300'>
                        {medalEmoji} #{entry.rank}
                      </span>
                    </td>
                    <td className='px-8 py-5 font-black text-white text-lg'>{entry.username}</td>
                    <td className='px-8 py-5 text-center'>
                      <span className='bg-gradient-to-r from-green-900 to-green-800 text-green-200 px-4 py-2 rounded-full font-black text-base shadow-md'>
                        {entry.gamesWon}
                      </span>
                    </td>
                    <td className='px-8 py-5 text-center'>
                      <span className='bg-gradient-to-r from-blue-900 to-blue-800 text-blue-200 px-4 py-2 rounded-full font-black text-base shadow-md'>
                        {entry.gamesPlayed}
                      </span>
                    </td>
                    <td className='px-8 py-5 text-center'>
                      <div className='flex items-center justify-center gap-3'>
                        <div className='w-24 bg-slate-700 rounded-full h-3 shadow-inner'>
                          <div
                            className='bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all shadow-lg shadow-purple-500/50'
                            style={{ width: `${entry.winRate}%` }}
                          ></div>
                        </div>
                        <span className='font-black text-purple-300 min-w-[60px] text-right text-lg'>
                          {entry.winRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && leaderboard.length === 0 && !error && (
        <div className='w-full text-center py-24 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border-2 border-slate-600 shadow-lg'>
          <p className='text-6xl mb-6 animate-bounce'>🌟</p>
          <p className='text-slate-200 text-2xl font-bold'>No players on leaderboard yet.</p>
          <p className='text-slate-400 mt-4 text-lg font-semibold'>Be the first to play and claim the top spot!</p>
        </div>
      )}
    </div>
  );
}
