'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/authContext';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const uploadImageToServer = async (base64Image) => {
  try {
    const uploadApiUrl = process.env.NEXT_PUBLIC_IMAGE_UPLOAD_API;
    if (!uploadApiUrl) {
      throw new Error('Image upload API URL is not defined');
    }
    console.log('Uploading image to:', uploadApiUrl);
    const response = await fetch(uploadApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image }),
    });
    const text = await response.text();
    if (!response.ok) {
      console.error('Image upload raw response:', text);
      throw new Error(`Image upload failed: HTTP ${response.status}`);
    }
    const data = JSON.parse(text);
    if (!data.image_url) {
      throw new Error('No image URL returned from server');
    }
    const fullPath = `${process.env.NEXT_PUBLIC_IMAGE_UPLOAD_PATH}/${data.image_url}`;
    if (!/^https?:\/\/.+/.test(fullPath)) {
      throw new Error('Invalid image URL returned from server');
    }
    return fullPath;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};

export default function MenuManagementPage() {
  const { restaurant } = useAuth();
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'delete'
  const [selectedDish, setSelectedDish] = useState(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    name: '',
    description: '',
    price: '',
    available: true,
    imgurl: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError] = useState('');

  // Fetch dishes and categories on mount
  useEffect(() => {
    console.log('MenuManagementPage useEffect: restaurant=', restaurant);
    if (!restaurant || !restaurant.id) {
      console.log('MenuManagementPage: No restaurant or restaurant.id, setting loading=false');
      setError('Please log in as a restaurant to view dishes');
      setLoading(false);
      return;
    }
    fetchCategories();
    fetchDishes();
  }, [restaurant]);

  const fetchCategories = async () => {
    console.log('fetchCategories: Starting fetch');
    try {
      const response = await fetch(`/api/categories?restaurantId=${restaurant.id}`);
      console.log('fetchCategories: Response status=', response.status);
      const data = await response.json();
      console.log('fetchCategories: Response data=', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to fetch categories`);
      }
      if (!Array.isArray(data.data)) {
        throw new Error('Expected categories data to be an array');
      }

      setCategories(data.data);
      console.log('fetchCategories: Success, categories=', data.data);
    } catch (err) {
      console.error('fetchCategories: Error=', err.message, err.stack);
      setError(`Failed to load categories: ${err.message}`);
    }
  };

  const fetchDishes = async () => {
    console.log('fetchDishes: Starting fetch');
    try {
      const response = await fetch(`/api/menus?restaurantId=${restaurant.id}`);
      console.log('fetchDishes: Response status=', response.status);
      const data = await response.json();
      console.log('fetchDishes: Response data=', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Failed to fetch dishes`);
      }
      if (!Array.isArray(data.data)) {
        throw new Error('Expected dishes data to be an array');
      }

      setDishes(data.data);
      setLoading(false);
      console.log('fetchDishes: Success, dishes=', data.data);
    } catch (err) {
      console.error('fetchDishes: Error=', err.message, err.stack);
      setError(`Failed to load dishes: ${err.message}`);
      setLoading(false);
    }
  };

  const handleModalOpen = (mode, dish = null) => {
    setModalMode(mode);
    setSelectedDish(dish);
    if (mode === 'edit' && dish) {
      setFormData({
        categoryId: dish.categoryId.toString(),
        name: dish.name,
        description: dish.description || '',
        price: dish.price.toString(),
        available: dish.available,
        imgurl: dish.imgurl || '',
      });
      setImagePreview(dish.imgurl || '');
    } else {
      setFormData({
        categoryId: categories.length > 0 ? categories[0].id.toString() : '',
        name: '',
        description: '',
        price: '',
        available: true,
        imgurl: '',
      });
      setImagePreview('');
    }
    setImageFile(null);
    setError('');
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedDish(null);
    setImageFile(null);
    setImagePreview('');
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setImageFile(file);
        const base64 = await convertToBase64(file);
        setImagePreview(base64);
        setFormData({ ...formData, imgurl: '' }); // Reset imgurl until upload
      } catch (error) {
        setError('Failed to process image');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { categoryId, name, price, description, available } = formData;
    if (modalMode !== 'delete') {
      if (!categoryId || !name || !price) {
        setError('Category, name, and price are required');
        return;
      }
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        setError('Price must be a positive number');
        return;
      }
    }

    try {
      let imgurl = formData.imgurl;

      // Upload image if a file is selected
      if (imageFile) {
        const base64Image = await convertToBase64(imageFile);
        imgurl = await uploadImageToServer(base64Image);
      }

      let response;

      if (modalMode === 'add') {
        const payload = {
          categoryId: parseInt(categoryId),
          name,
          description: description || null,
          price: parseFloat(price),
          available,
          imgurl: imgurl || '',
        };
        response = await fetch('/api/menus', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'edit' && selectedDish) {
        const payload = {
          categoryId: parseInt(categoryId),
          name,
          description: description || null,
          price: parseFloat(price),
          available,
          imgurl: imgurl || selectedDish.imgurl || '',
        };
        response = await fetch(`/api/menus/${selectedDish.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'delete' && selectedDish) {
        response = await fetch(`/api/menus/${selectedDish.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}: Operation failed`);

      await fetchDishes();
      handleModalClose();
    } catch (err) {
      setError(`Operation failed: ${err.message}`);
    }
  };

  if (!restaurant || !restaurant.id) {
    return <div className="p-6 text-red-500">Please log in as a restaurant to view dishes.</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Menu Management</h1>
        <button
          onClick={() => handleModalOpen('add')}
          className="flex items-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition duration-200"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Dish
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex justify-between items-center">
          <p>{error}</p>
          <button
            onClick={fetchDishes}
            className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-lg transition duration-200"
          >
            Retry
          </button>
        </div>
      )}
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : dishes.length === 0 ? (
        <p className="text-gray-600">No dishes found.</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm">
                <th className="py-3 px-6 text-left">Name</th>
                <th className="py-3 px-6 text-left">Image</th>
                <th className="py-3 px-6 text-left">Category</th>
                <th className="py-3 px-6 text-left">Price</th>
                <th className="py-3 px-6 text-left">Available</th>
                <th className="py-3 px-6 text-left">Created At</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dishes.map((dish) => (
                <tr key={dish.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-6">{dish.name}</td>
                  <td className="py-3 px-6">
                    {dish.imgurl ? (
                      <img src={dish.imgurl} alt={dish.name} className="h-10 w-10 object-cover rounded" />
                    ) : (
                      'No image'
                    )}
                  </td>
                  <td className="py-3 px-6">{dish.category?.name || 'N/A'}</td>
                  <td className="py-3 px-6">{dish.price.toFixed(2)}</td>
                  <td className="py-3 px-6">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        dish.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {dish.available ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-3 px-6">{new Date(dish.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-6 text-center">
                    <button
                      onClick={() => handleModalOpen('edit', dish)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleModalOpen('delete', dish)}
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
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {modalMode === 'add' ? 'Add Dish' : modalMode === 'edit' ? 'Edit Dish' : 'Delete Dish'}
              </h2>
              <button onClick={handleModalClose} className="text-gray-600 hover:text-gray-800">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {modalMode !== 'delete' ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="categoryId" className="block text-gray-700 font-medium mb-2">
                    Category
                  </label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    required
                  >
                    {categories.length === 0 ? (
                      <option value="">No categories available</option>
                    ) : (
                      categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className="mb-4">
                  <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                    Dish Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="description" className=" seeker-gray-700 font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    rows="4"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="price" className="block text-gray-700 font-medium mb-2">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    required
                    min="0.01"
                    step="0.01"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="image" className="block text-gray-700 font-medium mb-2">
                    Dish Image
                  </label>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                  {(imagePreview || formData.imgurl) && (
                    <div className="mt-2">
                      <p className="text-gray-600">Image Preview:</p>
                      <img
                        src={imagePreview || formData.imgurl}
                        alt="Dish preview"
                        className="h-20 w-20 object-cover rounded"
                      />
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <label htmlFor="available" className="flex items-center">
                    <input
                      type="checkbox"
                      id="available"
                      name="available"
                      checked={formData.available}
                      onChange={handleInputChange}
                      className="h-5 w-5 text-green-600 focus:ring-green-600"
                    />
                    <span className="ml-2 text-gray-700 font-medium">Available</span>
                  </label>
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
                  Are you sure you want to delete dish <strong>{selectedDish?.name}</strong>?
                </p>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="mr-4 text-gray-600 hover:text-gray-800 font-medium">
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