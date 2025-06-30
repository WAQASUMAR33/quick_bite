'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/authContext';
import { EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function OrderManagementPage() {
  const { restaurant } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    status: 'PENDING',
  });
  const [error, setError] = useState('');

  // Fetch orders on mount
  useEffect(() => {
    console.log('OrderManagementPage useEffect: restaurant=', restaurant);
    if (!restaurant || !restaurant.id) {
      console.log('OrderManagementPage: No restaurant or restaurant.id, setting loading=false');
      setError('Please log in as a restaurant to view orders');
      setLoading(false);
      return;
    }
    fetchOrders();
  }, [restaurant]);

  const fetchOrders = async () => {
    console.log('fetchOrders: Starting fetch');
    try {
      console.log('Fetching orders for restaurant ID:', restaurant.id);
      const response = await fetch(`/api/order_management/${restaurant.id}`);
      console.log('fetchOrders: Response status=', response.status);
      const data = await response.json();
      console.log('fetchOrders: Response data=', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to fetch orders`);
      }
      if (!Array.isArray(data.data)) {
        throw new Error('Expected orders data to be an array');
      }

      setOrders(data.data);
      setLoading(false);
      console.log('fetchOrders: Success, orders=', data.data);
    } catch (err) {
      console.error('fetchOrders: Error=', err.message, err.stack);
      setError(`Failed to load orders: ${err.message}`);
      setLoading(false);
    }
  };

  const handleModalOpen = (order) => {
    setSelectedOrder(order);
    setFormData({
      status: order.status,
    });
    setError('');
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedOrder(null);
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
      const response = await fetch(`/api/order_management/${selectedOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}: Operation failed`);

      console.log('handleSubmit: Response data=', data.data);

      await fetchOrders();
      handleModalClose();
    } catch (err) {
      setError(`Operation failed: ${err.message}`);
    }
  };

  if (!restaurant || !restaurant.id) {
    return <div className="p-6 text-red-500">Please log in as a restaurant to view orders.</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex justify-between items-center">
          <p>{error}</p>
          <button
            onClick={fetchOrders}
            className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-lg transition duration-200"
          >
            Retry
          </button>
        </div>
      )}
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-600">No orders found.</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm">
                <th className="py-3 px-6 text-left">Order ID</th>
                <th className="py-3 px-6 text-left">User</th>
                <th className="py-3 px-6 text-left">Order Type</th>
                <th className="py-3 px-6 text-left">Total </th>
                <th className="py-3 px-6 text-left">Status</th>
                <th className="py-3 px-6 text-left">Created At</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-6">{order.id}</td>
                  <td className="py-3 px-6">{order.user?.email || 'N/A'}</td>
                  <td className="py-3 px-6">{order.order_type}</td>
                  <td className="py-3 px-6">{order.totalAmount.toFixed(2)}</td>
                  <td className="py-3 px-6">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-6">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-6 text-center">
                    <button
                      onClick={() => handleModalOpen(order)}
                      className="text-blue-600 hover:text-blue-800"
                      title="View Details"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-3xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Order #{selectedOrder.id} Details</h2>
              <button onClick={handleModalClose} className="text-gray-600 hover:text-gray-800">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-1 gap-6 max-h-[80vh] overflow-y-auto">
              <div className="col-span-1">
                <label className="block text-gray-700 font-semibold mb-2">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700 font-semibold mb-2">Total Amount</label>
                <p className="p-3 bg-gray-100 rounded-lg text-gray-800">{selectedOrder.totalAmount.toFixed(2)}</p>
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700 font-semibold mb-2">Order Type</label>
                <p className="p-3 bg-gray-100 rounded-lg text-gray-800">{selectedOrder.order_type || 'N/A'}</p>
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700 font-semibold mb-2">Table No</label>
                <p className="p-3 bg-gray-100 rounded-lg text-gray-800">{selectedOrder.table_no || 'N/A'}</p>
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700 font-semibold mb-2">User Email</label>
                <p className="p-3 bg-gray-100 rounded-lg text-gray-800">{selectedOrder.user?.email || 'N/A'}</p>
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700 font-semibold mb-2">Restaurant</label>
                <p className="p-3 bg-gray-100 rounded-lg text-gray-800">{selectedOrder.restaurant?.name || 'N/A'}</p>
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700 font-semibold mb-2">Date</label>
                <p className="p-3 bg-gray-100 rounded-lg text-gray-800">{selectedOrder.order_date || 'N/A'}</p>
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700 font-semibold mb-2">Time</label>
                <p className="p-3 bg-gray-100 rounded-lg text-gray-800">{selectedOrder.order_time || 'N/A'}</p>
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700 font-semibold mb-2">Contact Info</label>
                <p className="p-3 bg-gray-100 rounded-lg text-gray-800">{selectedOrder.contact_info || 'N/A'}</p>
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700 font-semibold mb-2">Transaction ID</label>
                <p className="p-3 bg-gray-100 rounded-lg text-gray-800">{selectedOrder.trnx_id || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-gray-700 font-semibold mb-2">Transaction Receipt</label>
                <p className="p-3 bg-gray-100 rounded-lg text-gray-800">
                  {selectedOrder.trnx_receipt ? (
                    <a
                      href={selectedOrder.trnx_receipt}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Receipt
                    </a>
                  ) : (
                    'N/A'
                  )}
                </p>
              </div>
              <div className="col-span-2">
                <label className="block text-gray-700 font-semibold mb-2">Order Items</label>
                {selectedOrder.orderItems.length > 0 ? (
                  <div className="space-y-3">
                    {selectedOrder.orderItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-4 p-3 bg-gray-50 border border-gray-200 rounded-md"
                      >
                        {item.dish.imgurl && (
                          <img
                            src={item.dish.imgurl}
                            alt={item.dish.name}
                            className="h-12 w-12 object-cover rounded-md"
                          />
                        )}
                        <div>
                          <p className="text-gray-800 font-medium">{item.dish.name}</p>
                          <p className="text-gray-600 text-sm">
                            Quantity: {item.quantity} | Unit Price: {item.unit_rate.toFixed(2)} | Total: {item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="p-3 bg-gray-100 rounded-lg text-gray-800">No items</p>
                )}
              </div>
              {error && (
                <div className="col-span-2">
                  <p className="text-red-500 mb-4">{error}</p>
                </div>
              )}
              <div className="col-span-2 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition duration-200"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-800 text-white rounded-lg font-medium transition duration-200"
                >
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}