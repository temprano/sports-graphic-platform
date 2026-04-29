'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Player {
  id: string;
  name: string;
  number: number;
}

export default function ParentEntryPage() {
  const [teamCode, setTeamCode] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'code' | 'player'>('code');

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // TODO: Fetch players for team code
      console.log('Fetching players for team code:', teamCode);
      
      // Mock data for demo
      setPlayers([
        { id: 'player-1', name: 'Jordan Smith', number: 42 },
        { id: 'player-2', name: 'Marcus Johnson', number: 23 },
        { id: 'player-3', name: 'Alex Rodriguez', number: 7 },
      ]);
      setStep('player');
    } catch (err) {
      setError('Team code not found. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayerSelect = async (playerId: string) => {
    setSelectedPlayer(playerId);
    setIsLoading(true);

    try {
      // TODO: Set parent session and redirect to store
      console.log('Parent selected player:', playerId);
      // window.location.href = '/parent-store';
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 shadow-xl">
      {step === 'code' ? (
        <>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Order Player Posters
            </h1>
            <p className="text-gray-400">Enter your team code to get started</p>
          </div>

          <form onSubmit={handleCodeSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Team Code
              </label>
              <input
                type="text"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                placeholder="e.g., ABC123"
                maxLength={8}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 uppercase"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-400 mt-2">
                Ask your team coach or a team parent for the team code
              </p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !teamCode}
              className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Checking...' : 'Next'}
            </button>
          </form>
        </>
      ) : (
        <>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Select Your Player
            </h1>
            <p className="text-gray-400">Choose which player's posters you want</p>
          </div>

          <div className="space-y-3 mb-6">
            {players.map((player) => (
              <button
                key={player.id}
                onClick={() => handlePlayerSelect(player.id)}
                disabled={isLoading}
                className="w-full p-4 rounded-lg border border-gray-600 hover:border-blue-500 hover:bg-gray-700/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{player.name}</p>
                    <p className="text-sm text-gray-400">#{player.number}</p>
                  </div>
                  <div className="text-blue-400">
                    {selectedPlayer === player.id ? '✓' : '→'}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setStep('code');
              setTeamCode('');
              setPlayers([]);
              setSelectedPlayer(null);
            }}
            className="w-full text-gray-400 hover:text-gray-300 py-2"
          >
            Change Team Code
          </button>
        </>
      )}

      <div className="mt-8 pt-8 border-t border-gray-700 text-center">
        <Link href="/" className="text-gray-400 hover:text-gray-300 text-sm">
          Back to home
        </Link>
      </div>
    </div>
  );
}
