'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PlusCircleIcon,
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  MapPinIcon,
  PhoneIcon,
  MapIcon,
  TagIcon,
  UsersIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';

export default function CreateRestaurantPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    phone: '',
    description: '',
    city: '',
    cuisine: '',
    capacity: '',
    logo: null,
    bgImage: null,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

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
      const response = await fetch(uploadApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });
      const data = await response.json();
      if (!response.ok || !data.image_url) {
        throw new Error(data.error || 'Failed to upload image');
      }
      const fullPath = `${process.env.NEXT_PUBLIC_IMAGE_UPLOAD_PATH}/${data.image_url}`;
      if (!/^https?:\/\/.+/.test(fullPath)) {
        throw new Error('Invalid image URL returned from server');
      }
      return fullPath;
    } catch (error) {
      throw error;
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      const { name, email, password, city, address } = formData;
      if (!name || !email || !password || !city || !address) {
        throw new Error('Please fill in all required fields: name, email, password, city, and address');
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (formData.capacity && (isNaN(formData.capacity) || parseInt(formData.capacity) <= 0)) {
        throw new Error('Capacity must be a positive number');
      }

      if (formData.logo && formData.logo instanceof File) {
        if (!['image/png', 'image/jpeg'].includes(formData.logo.type)) {
          throw new Error('Logo must be a PNG or JPEG image');
        }
      }

      if (formData.bgImage && formData.bgImage instanceof File) {
        if (!['image/png', 'image/jpeg'].includes(formData.bgImage.type)) {
          throw new Error('Background image must be a PNG or JPEG image');
        }
      }

      const dataToSend = {
        name,
        email,
        password,
        address,
        phone: formData.phone || '',
        description: formData.description || '',
        city,
        cuisine: formData.cuisine || '',
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        logo: '',
        bgImage: '',
      };

      if (formData.logo && formData.logo instanceof File) {
        const base64Logo = await convertToBase64(formData.logo);
        const logoUrl = await uploadImageToServer(base64Logo);
        dataToSend.logo = logoUrl;
      }

      if (formData.bgImage && formData.bgImage instanceof File) {
        const base64BgImage = await convertToBase64(formData.bgImage);
        const bgImageUrl = await uploadImageToServer(base64BgImage);
        dataToSend.bgImage = bgImageUrl;
      }

      console.log('Payload:', dataToSend);

      const response = await fetch('/api/restuarent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Restaurant created successfully!');
        setFormData({
          name: '',
          email: '',
          password: '',
          address: '',
          phone: '',
          description: '',
          city: '',
          cuisine: '',
          capacity: '',
          logo: null,
          bgImage: null,
        });
        setTimeout(() => router.push('/restaurant-login'), 2000);
      } else {
        throw new Error(data.error || 'Failed to create restaurant');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <div className="w-full md:w-1/2">
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"
          alt="Restaurant"
          className="object-cover h-full w-full"
        />
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-100 p-8">
        <div className="max-w-4xl w-full bg-white p-8 rounded-lg shadow-lg">
          <img
            src="/quickbite.png"
            alt="QuickBite Logo"
            className="w-48 h-48 mx-auto mb-0"
          />
          <h1 className="text-2xl font-bold mb-2 text-gray-800 text-center">Create Restaurant Profile</h1>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {success && <p className="text-green-500 mb-4">{success}</p>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-2 relative">
              <label htmlFor="name" className="block text-gray-700 mb-2">
                Restaurant Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter restaurant name"
                  className="w-full p-3 pl-10 border rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                  required
                />
              </div>
            </div>
            <div className="mb-2 relative">
              <label htmlFor="email" className="block text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className="w-full p-3 pl-10 border rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                  required
                />
              </div>
            </div>
            <div className="mb-2 relative">
              <label htmlFor="password" className="block text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="w-full p-3 pl-10 border rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                  required
                />
              </div>
            </div>
            <div className="mb-2 relative">
              <label htmlFor="address" className="block text-gray-700 mb-2">
                Address
              </label>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter address"
                  className="w-full p-3 pl-10 border rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                  required
                />
              </div>
            </div>
            <div className="mb-2 relative">
              <label htmlFor="phone" className="block text-gray-700 mb-2">
                Phone
              </label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="w-full p-3 pl-10 border rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                  required
                />
              </div>
            </div>
            <div className="mb-2 relative">
              <label htmlFor="city" className="block text-gray-700 mb-2">
                City
              </label>
              <div className="relative">
                <MapIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Enter city"
                  className="w-full p-3 pl-10 border rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                  required
                />
              </div>
            </div>
            <div className="mb-2 relative">
              <label htmlFor="cuisine" className="block text-gray-700 mb-2">
                Cuisine
              </label>
              <div className="relative">
                <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="cuisine"
                  name="cuisine"
                  value={formData.cuisine}
                  onChange={handleChange}
                  placeholder="Enter cuisine type"
                  className="w-full p-3 pl-10 border rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
            </div>
            <div className="mb-2 relative">
              <label htmlFor="capacity" className="block text-gray-700 mb-2">
                Capacity
              </label>
              <div className="relative">
                <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="Enter capacity"
                  className="w-full p-3 pl-10 border rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                  min="1"
                />
              </div>
            </div>
            <div className="mb-2">
              <label htmlFor="logo" className="block text-gray-700 mb-2">
                Logo (PNG/JPEG)
              </label>
              <input
                type="file"
                id="logo"
                name="logo"
                accept="image/png,image/jpeg"
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="bgImage" className="block text-gray-700 mb-2">
                Background Image (PNG/JPEG)
              </label>
              <input
                type="file"
                id="bgImage"
                name="bgImage"
                accept="image/png,image/jpeg"
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div className="mb-4 md:col-span-2 relative">
              <label htmlFor="description" className="block text-gray-700 mb-2">
                Description
              </label>
              <div className="relative">
                <ChatBubbleLeftIcon className="absolute left-3 top-5 h-5 w-5 text-gray-400" />
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter restaurant description"
                  className="w-full p-3 pl-10 pt-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                  rows="4"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded flex items-center justify-center"
              >
                <PlusCircleIcon className="h-6 w-6 mr-2" />
                Create Restaurant
              </button>
            </div>
          </form>
          <p className="mt-4 text-center">
            If you have already account!{' '}
            <Link href="/restaurant-login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}