'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/authContext';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ParkingManagementPage() {
  const { restaurant } = useAuth();
  const [parkingSlots, setParkingSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'delete'
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formData, setFormData] = useState({
    slotNumber: '',
    status: 'AVAILABLE',
  });
  const [error, setError] = useState('');

  // Fetch parking slots on mount
  useEffect(() => {
    console.log('ParkingManagementPage useEffect: restaurant=', restaurant);
    if (!restaurant || !restaurant.id) {
      console.log('ParkingManagementPage: No restaurant or restaurant.id, setting loading=false');
      setError('Please log in as a restaurant to view parking slots');
      setLoading(false);
      return;
    }
    fetchParkingSlots();
  }, [restaurant]);

  const fetchParkingSlots = async () => {
    console.log('fetchParkingSlots: Starting fetch');
    try {
      const response = await fetch(`/api/parking_slots?restaurantId=${restaurant.id}`);
      console.log('fetchParkingSlots: Response status=', response.status);
      const data = await response.json();
      console.log('fetchParkingSlots: Response data=', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to fetch parking slots`);
      }
      if (!Array.isArray(data.data)) {
        throw new Error('Expected parking slots data to be an array');
      }

      setParkingSlots(data.data);
      setLoading(false);
      console.log('fetchParkingSlots: Success, parkingSlots=', data.data);
    } catch (err) {
      console.error('fetchParkingSlots: Error=', err.message, err.stack);
      setError(`Failed to load parking slots: ${err.message}`);
      setLoading(false);
    }
  };

  const handleModalOpen = (mode, slot = null) => {
    setModalMode(mode);
    setSelectedSlot(slot);
    if (mode === 'edit' && slot) {
      setFormData({
        slotNumber: slot.slotNumber,
        status: slot.status,
      });
    } else {
      setFormData({
        slotNumber: '',
        status: 'AVAILABLE',
      });
    }
    setError('');
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedSlot(null);
    setError('');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { slotNumber, status } = formData;
    if (modalMode !== 'delete') {
      if (!slotNumber) {
        setError('Slot number is required');
        return;
      }
      if (!['AVAILABLE', 'OCCUPIED', 'RESERVED'].includes(status)) {
        setError('Invalid status');
        return;
      }
    }

    try {
      let response;

      if (modalMode === 'add') {
        const payload = {
          restaurantId: restaurant.id,
          slotNumber,
          status,
        };
        response = await fetch('/api/parking_slots', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'edit' && selectedSlot) {
        const payload = {
          restaurantId: restaurant.id,
          slotNumber,
          status,
        };
        response = await fetch(`/api/parking_slots/${selectedSlot.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'delete' && selectedSlot) {
        response = await fetch(`/api/parking_slots/${selectedSlot.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}: Operation failed`);

      // Handle response (POST/PUT return data, DELETE returns {})
      const result = data.data || data;
      console.log('handleSubmit: Response data=', result);

      await fetchParkingSlots(); // Refresh parking slot list
      handleModalClose();
    } catch (err) {
      setError(`Operation failed: ${err.message}`);
    }
  };

  if (!restaurant || !restaurant.id) {
    return <div className="p-6 text-red-500">Please log in as a restaurant to view parking slots.</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Parking Management</h1>
        <button
          onClick={() => handleModalOpen('add')}
          className="flex items-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition duration-200"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Parking Slot
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex justify-between items-center">
          <p>{error}</p>
          <button
            onClick={fetchParkingSlots}
            className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-lg transition duration-200"
          >
            Retry
          </button>
        </div>
      )}
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : parkingSlots.length === 0 ? (
        <p className="text-gray-600">No parking slots found.</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm">
                <th className="py-3 px-6 text-left">Slot Number</th>
                <th className="py-3 px-6 text-left">Status</th>
                <th className="py-3 px-6 text-left">Created At</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {parkingSlots.map((slot) => (
                <tr key={slot.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-6">{slot.slotNumber}</td>
                  <td className="py-3 px-6">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        slot.status === 'AVAILABLE'
                          ? 'bg-green-100 text-green-800'
                          : slot.status === 'OCCUPIED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {slot.status}
                    </span>
                  </td>
                  <td className="py-3 px-6">{new Date(slot.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-6 text-center">
                    <button
                      onClick={() => handleModalOpen('edit', slot)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleModalOpen('delete', slot)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-5 w-5" />
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
              <h2 className="text-xl font-bold">
                {modalMode === 'add' ? 'Add Parking Slot' : modalMode === 'edit' ? 'Edit Parking Slot' : 'Delete Parking Slot'}
              </h2>
              <button onClick={handleModalClose} className="text-gray-600 hover:text-gray-800">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {modalMode !== 'delete' ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="slotNumber" className="block text-gray-700 font-medium mb-2">
                    Slot Number
                  </label>
                  <input
                    type="text"
                    id="slotNumber"
                    name="slotNumber"
                    value={formData.slotNumber}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
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
                    <option value="AVAILABLE">Available</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="RESERVED">Reserved</option>
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
                    {modalMode === 'add' ? 'Add' : 'Update'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p className="mb-4">
                  Are you sure you want to delete parking slot <strong>{selectedSlot?.slotNumber}</strong>?
                </p>
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
                    onClick={handleSubmit}
                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}