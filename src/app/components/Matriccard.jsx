export default function MetricCard({ title, value, icon }) {
    return (
      <div className="bg-white p-6 rounded-lg shadow flex items-center space-x-4">
        <div className="text-3xl">{icon}</div>
        <div>
          <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    );
  }