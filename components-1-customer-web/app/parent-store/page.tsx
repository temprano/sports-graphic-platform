'use client';

export default function ParentStorePage() {
  const products = [
    {
      id: 'poster-16x20',
      name: 'Poster 16x20"',
      description: 'Professional quality poster',
      price: 24.99,
      image: '🖼️',
    },
    {
      id: 'banner-2x6',
      name: 'Banner 2x6"',
      description: 'Perfect for bedrooms',
      price: 14.99,
      image: '🎌',
    },
    {
      id: 'card-4x6',
      name: 'Card 4x6"',
      description: 'Trading card style',
      price: 4.99,
      image: '🃏',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="heading-2 text-white mb-2">Player Store</h1>
      <p className="text-gray-400 mb-12">
        Order professional quality posters and cards featuring your player
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500 transition-colors"
          >
            <div className="h-48 bg-gray-700 flex items-center justify-center text-6xl">
              {product.image}
            </div>
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-2">{product.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{product.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-blue-400">
                  ${product.price.toFixed(2)}
                </span>
                <button className="btn-primary px-4 py-2">Add to Cart</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
