'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/authContext';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function TablesPage() {
  const { restaurant } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'delete'
  const [selectedTable, setSelectedTable] = useState(null);
  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: '',
    status: 'AVAILABLE',
  });
  const [error, setError] = useState('');

  // Fetch tables on mount
  useEffect(() => {
    console.log('TablesPage useEffect: restaurant=', restaurant);
    if (!restaurant || !restaurant.id) {
      console.log('TablesPage: No restaurant or restaurant.id, setting loading=false');
      setError('Please log in as a restaurant to view tables');
      setLoading(false);
      return;
    }
    fetchTables();
  }, [restaurant]);

  const fetchTables = async () => {
    console.log('fetchTables: Starting fetch');
    try {
      const response = await fetch(`/api/tables?restaurantId=${restaurant.id}`);
      console.log('fetchTables: Response status=', response.status);

      const data = await response.json();
      console.log('fetchTables: Response data=', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to fetch tables`);
      }

      // Extract the data array from the response
      if (!Array.isArray(data.data)) {
        throw new Error('Expected data to be an array');
      }

      setTables(data.data);
      setLoading(false);
      console.log('fetchTables: Success, tables=', data.data);
    } catch (err) {
      console.error('fetchTables: Error=', err.message, err.stack);
      setError(`Failed to load tables: ${err.message}`);
      setLoading(false);
    }
  };

  const handleModalOpen = (mode, table = null) => {
    setModalMode(mode);
    setSelectedTable(table);
    if (mode === 'edit' && table) {
      setFormData({
        tableNumber: table.tableNumber,
        capacity: table.capacity.toString(),
        status: table.status,
      });
    } else {
      setFormData({ tableNumber: '', capacity: '', status: 'AVAILABLE' });
    }
    setError('');
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedTable(null);
    setError('');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { tableNumber, capacity, status } = formData;
    if (!tableNumber || !capacity) {
      setError('Table number and capacity are required');
      return;
    }
    const capacityNum = parseInt(capacity);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      setError('Capacity must be a positive number');
      return;
    }

    try {
      const payload = {
        restaurantId: restaurant.id,
        tableNumber,
        capacity: capacityNum,
        status,
      };
      let response;

      if (modalMode === 'add') {
        response = await fetch('/api/tables', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'edit' && selectedTable) {
        response = await fetch(`/api/tables/${selectedTable.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'delete' && selectedTable) {
        response = await fetch(`/api/tables/${selectedTable.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ restaurantId: restaurant.id }),
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}: Operation failed`);

      // Handle POST/PUT response if it includes { data }
      const result = data.data || data;
      console.log('handleSubmit: Response data=', result);

      await fetchTables(); // Refresh table list
      handleModalClose();
    } catch (err) {
      setError(`Operation failed: ${err.message}`);
    }
  };

  if (!restaurant || !restaurant.id) {
    return <div className="p-6 text-red-500">Please log in as a restaurant to view tables.</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Table Management</h1>
        <button
          onClick={() => handleModalOpen('add')}
          className="flex items-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Table
        </button>
      </div>

      {error && (
        <div className="mb-4">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchTables}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded"
          >
            Retry
          </button>
        </div>
      )}
      {loading ? (
        <p>Loading...</p>
      ) : tables.length === 0 ? (
        <p>No tables found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm">
                <th className="py-3 px-6 text-left">Table Number</th>
                <th className="py-3 px-6 text-left">Capacity</th>
                <th className="py-3 px-6 text-left">Status</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((table) => (
                <tr key={table.id} className="border-b">
                  <td className="py-3 px-6">{table.tableNumber}</td>
                  <td className="py-3 px-6">{table.capacity}</td>
                  <td className="py-3 px-6">{table.status}</td>
                  <td className="py-3 px-6 text-center">
                    <button
                      onClick={() => handleModalOpen('edit', table)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleModalOpen('delete', table)}
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
                {modalMode === 'add' ? 'Add Table' : modalMode === 'edit' ? 'Edit Table' : 'Delete Table'}
              </h2>
              <button onClick={handleModalClose} className="text-gray-600 hover:text-gray-800">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {modalMode !== 'delete' ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="tableNumber" className="block text-gray-700 mb-2">
                    Table Number
                  </label>
                  <input
                    type="text"
                    id="tableNumber"
                    name="tableNumber"
                    value={formData.tableNumber}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="capacity" className="block text-gray-700 mb-2">
                    Capacity
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                    required
                    min="1"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="status" className="block text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-600"
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
                    className="mr-4 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
                  >
                    {modalMode === 'add' ? 'Add' : 'Update'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p className="mb-4">
                  Are you sure you want to delete table <strong>{selectedTable?.tableNumber}</strong>?
                </p>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="mr-4 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
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