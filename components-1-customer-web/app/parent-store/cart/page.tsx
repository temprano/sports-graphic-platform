import Link from 'next/link';

export default function CartPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="heading-2 text-white mb-8">Shopping Cart</h1>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
        <p className="text-gray-400 mb-6">Your cart is empty</p>
        <Link href="/parent-store" className="btn-primary inline-flex">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
