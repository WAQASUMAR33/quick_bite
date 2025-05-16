export default function RecentActivity({ activities }) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-600">
              <th className="pb-2">Type</th>
              <th className="pb-2">Details</th>
              <th className="pb-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
              <tr key={activity.id} className="border-t">
                <td className="py-2">{activity.type}</td>
                <td className="py-2">{activity.details}</td>
                <td className="py-2">{new Date(activity.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }