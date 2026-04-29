'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { href: '/team/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/team/orders', label: 'Orders', icon: '📋' },
    { href: '/team/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-gray-800 border-b border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white"
            >
              ☰
            </button>
            <Link href="/team/dashboard" className="text-xl font-bold text-blue-400">
              Team Dashboard
            </Link>
          </div>
          <button
            onClick={() => {
              // TODO: Logout
              console.log('Logout');
            }}
            className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="fixed left-0 top-16 bottom-0 w-64 bg-gray-800 border-r border-gray-700 overflow-y-auto">
            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main
          className={`flex-1 transition-all ${
            sidebarOpen ? 'ml-64' : ''
          } px-4 sm:px-6 lg:px-8 py-8`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
