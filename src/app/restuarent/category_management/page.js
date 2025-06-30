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

export default function CategoryManagementPage() {
  const { restaurant } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'delete'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    imgurl: '',
  });
  const [imageFile, setImageFile] = useState(null); // Store selected image file
  const [imagePreview, setImagePreview] = useState(''); // Store Base64 for preview
  const [error, setError] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    console.log('CategoryManagementPage useEffect: restaurant=', restaurant);
    if (!restaurant || !restaurant.id) {
      console.log('CategoryManagementPage: No restaurant or restaurant.id, setting loading=false');
      setError('Please log in as a restaurant to view categories');
      setLoading(false);
      return;
    }
    fetchCategories();
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
        throw new Error('Expected data to be an array');
      }

      setCategories(data.data);
      setLoading(false);
      console.log('fetchCategories: Success, categories=', data.data);
    } catch (err) {
      console.error('fetchCategories: Error=', err.message, err.stack);
      setError(`Failed to load categories: ${err.message}`);
      setLoading(false);
    }
  };

  const handleModalOpen = (mode, category = null) => {
    setModalMode(mode);
    setSelectedCategory(category);
    if (mode === 'edit' && category) {
      setFormData({
        name: category.name,
        imgurl: category.imgurl || '',
      });
      setImagePreview(category.imgurl || ''); // Set preview to existing imgurl
    } else {
      setFormData({ name: '', imgurl: '' });
      setImagePreview('');
    }
    setImageFile(null);
    setError('');
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedCategory(null);
    setImageFile(null);
    setImagePreview('');
    setError('');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setImageFile(file);
        const base64 = await convertToBase64(file);
        setImagePreview(base64); // Set Base64 for preview
        setFormData({ ...formData, imgurl: '' }); // Reset imgurl until upload
      } catch (error) {
        setError('Failed to process image');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { name } = formData;
    if (modalMode !== 'delete') {
      if (!name) {
        setError('Category name is required');
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
          restaurantId: restaurant.id,
          name,
          imgurl: imgurl || '',
        };
        response = await fetch('/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'edit' && selectedCategory) {
        const payload = {
          restaurantId: restaurant.id,
          name,
          imgurl: imgurl || selectedCategory.imgurl || '',
        };
        response = await fetch(`/api/categories/${selectedCategory.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === 'delete' && selectedCategory) {
        response = await fetch(`/api/categories/${selectedCategory.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}: Operation failed`);

      await fetchCategories();
      handleModalClose();
    } catch (err) {
      setError(`Operation failed: ${err.message}`);
    }
  };

  if (!restaurant || !restaurant.id) {
    return <div className="p-6 text-red-500">Please log in as a restaurant to view categories.</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Category Management</h1>
        <button
          onClick={() => handleModalOpen('add')}
          className="flex items-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Category
        </button>
      </div>

      {error && (
        <div className="mb-4">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchCategories}
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded"
          >
            Retry
          </button>
        </div>
      )}
      {loading ? (
        <p>Loading...</p>
      ) : categories.length === 0 ? (
        <p>No categories found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow-md rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm">
                <th className="py-3 px-6 text-left">Name</th>
                <th className="py-3 px-6 text-left">Image</th>
                <th className="py-3 px-6 text-left">Created At</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b">
                  <td className="py-3 px-6">{category.name}</td>
                  <td className="py-3 px-6">
                    {category.imgurl ? (
                      <img src={category.imgurl} alt={category.name} className="h-10 w-10 object-cover rounded" />
                    ) : (
                      'No image'
                    )}
                  </td>
                  <td className="py-3 px-6">{new Date(category.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-6 text-center">
                    <button
                      onClick={() => handleModalOpen('edit', category)}
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleModalOpen('delete', category)}
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
          <div className="bg-white rounded-lg p-10 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {modalMode === 'add' ? 'Add Category' : modalMode === 'edit' ? 'Edit Category' : 'Delete Category'}
              </h2>
              <button onClick={handleModalClose} className="text-gray-600 hover:text-gray-800">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {modalMode !== 'delete' ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="name" className="block text-gray-700 mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="image" className="block text-gray-700 mb-2">
                    Category Image
                  </label>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                  {(imagePreview || formData.imgurl) && (
                    <div className="mt-2">
                      <p className="text-gray-600">Image Preview:</p>
                      <img
                        src={imagePreview || formData.imgurl}
                        alt="Category preview"
                        className="h-20 w-20 object-cover rounded"
                      />
                    </div>
                  )}
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
                  Are you sure you want to delete category <strong>{selectedCategory?.name}</strong>?
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