'use client';

import Link from 'next/link';

export default function ParentStoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/parent-store" className="text-xl font-bold text-blue-400">
            Player Store
          </Link>
          <div className="flex gap-4">
            <Link
              href="/parent-store/cart"
              className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
            >
              🛒 Cart
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-8">
        {children}
      </main>
    </div>
  );
}
