export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="heading-2 text-white mb-8">Team Settings</h1>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Team Name
          </label>
          <input
            type="text"
            placeholder="Enter team name"
            className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Primary Color
          </label>
          <input
            type="color"
            className="w-12 h-10 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Secondary Color
          </label>
          <input
            type="color"
            className="w-12 h-10 rounded-lg cursor-pointer"
          />
        </div>

        <button className="btn-primary">Save Settings</button>
      </div>
    </div>
  );
}
