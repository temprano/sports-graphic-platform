'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // GSAP animations will be implemented here
    // For now, just basic fade-in
    if (heroRef.current) {
      heroRef.current.style.animation = 'fadeIn 1s ease-out';
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold text-blue-400">
              Sports Graphics
            </div>
            <div className="flex gap-4">
              <Link
                href="/auth/team-login"
                className="px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Team Login
              </Link>
              <Link
                href="/parent-entry"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Order Posters
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-[80vh] flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent"></div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="heading-1 mb-6">
            Professional Sports Graphics
            <span className="block text-blue-400 mt-2">for Your Team</span>
          </h1>

          <p className="subheading mb-8 max-w-3xl mx-auto">
            Beautiful motion graphics, custom posters, and team banners. All
            designed with your brand colors and delivered in days.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/team-login"
              className="btn-primary inline-flex justify-center"
            >
              Get Started for Your Team
            </Link>
            <Link
              href="/parent-entry"
              className="btn-secondary inline-flex justify-center"
            >
              Order Posters for Your Player
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="heading-2 text-center mb-16">What We Offer</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-700/30 rounded-lg p-8 border border-gray-600 hover:border-blue-500 transition-colors">
              <div className="text-4xl mb-4">🎬</div>
              <h3 className="text-xl font-bold mb-3">Motion Graphics</h3>
              <p className="text-gray-300">
                Professional player intros and team banners with custom
                animations and your team branding.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-700/30 rounded-lg p-8 border border-gray-600 hover:border-blue-500 transition-colors">
              <div className="text-4xl mb-4">🖼️</div>
              <h3 className="text-xl font-bold mb-3">Print Products</h3>
              <p className="text-gray-300">
                Posters, banners, and cards printed in full color. Perfect for
                parents, fans, and team collections.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-700/30 rounded-lg p-8 border border-gray-600 hover:border-blue-500 transition-colors">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-3">Quick Turnaround</h3>
              <p className="text-gray-300">
                From upload to delivery in days. We handle all the design and
                production work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="heading-2 text-center mb-16">How It Works</h2>

          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Team Registration</h3>
                <p className="text-gray-300">
                  Set up your team, add players, and customize your branding.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Upload Photos</h3>
                <p className="text-gray-300">
                  Upload team and player photos. We handle enhancement and
                  formatting.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Review & Approve</h3>
                <p className="text-gray-300">
                  Check out your proofs and make adjustments if needed.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
                4
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Delivery</h3>
                <p className="text-gray-300">
                  Download videos and arrange print fulfillment. Parents can
                  order posters anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600/10 border-t border-gray-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="heading-2 mb-6">Ready to Get Started?</h2>
          <p className="subheading mb-8">
            Join teams across the country creating professional sports graphics.
          </p>
          <Link href="/auth/team-login" className="btn-primary inline-flex">
            Create Your Team Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-700 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2026 Sports Graphics Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
