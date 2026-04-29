'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function TeamLoginPage() {
  const [teamCode, setTeamCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // TODO: Implement team login
      console.log('Team login:', { teamCode, password });
      setError('Team login not yet implemented');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 shadow-xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Team Login</h1>
        <p className="text-gray-400">Access your team dashboard</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Team Code
          </label>
          <input
            type="text"
            value={teamCode}
            onChange={(e) => setTeamCode(e.target.value)}
            placeholder="e.g., ABC123"
            className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Team password"
            className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !teamCode || !password}
          className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="mt-8 pt-8 border-t border-gray-700 text-center">
        <p className="text-gray-400 text-sm mb-4">Don't have a team account?</p>
        <Link
          href="/"
          className="text-blue-400 hover:text-blue-300 text-sm font-medium"
        >
          Contact us to set up your team
        </Link>
      </div>

      <div className="mt-4 text-center">
        <Link href="/" className="text-gray-400 hover:text-gray-300 text-sm">
          Back to home
        </Link>
      </div>
    </div>
  );
}
