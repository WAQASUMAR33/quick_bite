'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/authContext';
import { PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function BookingManagementPage() {
  const { restaurant } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [formData, setFormData] = useState({
    status: 'PENDING',
  });
  const [error, setError] = useState('');

  // Fetch bookings on mount
  useEffect(() => {
    console.log('BookingManagementPage useEffect: restaurant=', restaurant);
    if (!restaurant || !restaurant.id) {
      console.log('BookingManagementPage: No restaurant or restaurant.id, setting loading=false');
      setError('Please log in as a restaurant to view bookings');
      setLoading(false);
      return;
    }
    fetchBookings();
  }, [restaurant]);

  const fetchBookings = async () => {
    console.log('fetchBookings: Starting fetch');
    try {
      const response = await fetch(`/api/order_management?restaurantId=${restaurant.id}`);
      console.log('fetchBookings: Response status=', response.status);
      const data = await response.json();
      console.log('fetchBookings: Response data=', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to fetch bookings`);
      }
      if (!Array.isArray(data.data)) {
        throw new Error('Expected bookings data to be an array');
      }

      setBookings(data.data);
      setLoading(false);
      console.log('fetchBookings: Success, bookings=', data.data);
    } catch (err) {
      console.error('fetchBookings: Error=', err.message, err.stack);
      setError(`Failed to load bookings: ${err.message}`);
      setLoading(false);
    }
  };

  const handleModalOpen = (booking) => {
    setSelectedBooking(booking);
    setFormData({
      status: booking.status,
    });
    setError('');
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedBooking(null);
    setError('');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { status } = formData;
    if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      setError('Invalid status');
      return;
    }

    try {
      const response = await fetch(`/api/order_management/${selectedBooking.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}: Operation failed`);

      console.log('handleSubmit: Response data=', data.data);

      await fetchBookings(); // Refresh booking list
      handleModalClose();
    } catch (err) {
      setError(`Operation failed: ${err.message}`);
    }
  };

  if (!restaurant || !restaurant.id) {
    return <div className="p-6 text-red-500">Please log in as a restaurant to view bookings.</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Booking Management</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex justify-between items-center">
          <p>{error}</p>
          <button
            onClick={fetchBookings}
            className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-lg transition duration-200"
          >
            Retry
          </button>
        </div>
      )}
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : bookings.length === 0 ? (
        <p className="text-gray-600">No bookings found.</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm">
                <th className="py-3 px-6 text-left">User</th>
                <th className="py-3 px-6 text-left">Table</th>
                <th className="py-3 px-6 text-left">Booking Time</th>
                <th className="py-3 px-6 text-left">Status</th>
                <th className="py-3 px-6 text-left">Created At</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-6">{booking.user?.email || 'N/A'}</td>
                  <td className="py-3 px-6">{booking.table?.tableNumber || 'N/A'}</td>
                  <td className="py-3 px-6">
                    {new Date(booking.bookingTime).toLocaleString()}
                  </td>
                  <td className="py-3 px-6">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        booking.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : booking.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="py-3 px-6">{new Date(booking.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-6 text-center">
                    <button
                      onClick={() => handleModalOpen(booking)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Update Booking Status</h2>
              <button onClick={handleModalClose} className="text-gray-600 hover:text-gray-800">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="status" className="block text-gray-700 font-medium mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  required
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              {error && <p className="text-red-500 mb-4">{error}</p>}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="mr-4 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition duration-200"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}