import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <div className="px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20 max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4">Welcome to BOANIPA</h1>
          <p className="text-base sm:text-lg text-gray-600 mb-8">Your one-stop online marketplace</p>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold transition">
            Start Shopping
          </button>
        </div>
      </div>

      {/* Featured Categories */}
      <div className="px-4 sm:px-6 md:px-8 py-8 sm:py-12 max-w-7xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Featured Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition">
              <div className="h-40 sm:h-48 bg-gray-200 rounded mb-4"></div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Category {i}</h3>
              <p className="text-sm sm:text-base text-gray-600">Browse our latest products</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
