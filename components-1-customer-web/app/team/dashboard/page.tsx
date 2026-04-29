export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="heading-2 text-white mb-8">Team Dashboard</h1>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="text-gray-400 text-sm mb-2">Total Orders</div>
          <div className="heading-3 text-white">0</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="text-gray-400 text-sm mb-2">Pending Review</div>
          <div className="heading-3 text-white">0</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="text-gray-400 text-sm mb-2">Revenue</div>
          <div className="heading-3 text-white">$0</div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="heading-3 text-white mb-4">Recent Orders</h2>
        <div className="text-gray-400 py-8 text-center">
          No orders yet. Create your first order to get started.
        </div>
      </div>
    </div>
  );
}
