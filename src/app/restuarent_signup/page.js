'use client';
import { useState, useEffect, useRef } from 'react';
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
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { Loader } from '@googlemaps/js-api-loader';

export default function CreateRestaurantPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    phone: '',
    description: '',
    city: '',
    cousine: '',
    logo: null,
    bgImage: null,
    latitude: '',
    longitude: '',
    ranking: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Initialize Google Maps
  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
      libraries: ['places'],
    });

    loader.load().then(() => {
      if (mapRef.current && !mapInstanceRef.current) {
        const defaultLocation = { lat: 32.5798, lng: 73.4813 };
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: defaultLocation,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
        });

        markerRef.current = new google.maps.Marker({
          position: defaultLocation,
          map: mapInstanceRef.current,
          draggable: true,
        });

        markerRef.current.addListener('dragend', () => {
          const position = markerRef.current.getPosition();
          setFormData((prev) => ({
            ...prev,
            latitude: position.lat().toFixed(8),
            longitude: position.lng().toFixed(8),
          }));
        });

        mapInstanceRef.current.addListener('click', (e) => {
          const position = e.latLng;
          markerRef.current.setPosition(position);
          setFormData((prev) => ({
            ...prev,
            latitude: position.lat().toFixed(8),
            longitude: position.lng().toFixed(8),
          }));
        });

        setFormData((prev) => ({
          ...prev,
          latitude: defaultLocation.lat.toFixed(8),
          longitude: defaultLocation.lng.toFixed(8),
        }));
      }
    }).catch((err) => {
      console.error('Failed to load Google Maps:', err);
      setError('Failed to load map. Please try again.');
    });
  }, []);

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
      const { name, email, password, city, address, latitude, longitude } = formData;
      if (!name || !email || !password || !city || !address || !latitude || !longitude) {
        throw new Error('Please fill in all required fields: name, email, password, city, address, latitude, and longitude');
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (formData.ranking && (isNaN(formData.ranking) || parseFloat(formData.ranking) < 0 || parseFloat(formData.ranking) > 5)) {
        throw new Error('Ranking must be a number between 0.0 and 5.0');
      }

      if (isNaN(parseFloat(latitude)) || parseFloat(latitude) < -90 || parseFloat(latitude) > 90) {
        throw new Error('Latitude must be a number between -90 and 90');
      }

      if (isNaN(parseFloat(longitude)) || parseFloat(longitude) < -180 || parseFloat(longitude) > 180) {
        throw new Error('Longitude must be a number between -180 and 180');
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
        cousine: formData.cousine || '',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        ranking: formData.ranking ? parseFloat(formData.ranking) : undefined,
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

      // Log the payload and request details for debugging
      console.log('Submitting payload to /api/restaurant:', {
        url: '/api/restaurant',
        payload: dataToSend,
      });

      const response = await fetch('/api/restuarent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      const text = await response.text();
      console.log('API response:', {
        status: response.status,
        statusText: response.statusText,
        body: text,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = JSON.parse(text);
      setSuccess('Restaurant created successfully!');
      setFormData({
        name: '',
        email: '',
        password: '',
        address: '',
        phone: '',
        description: '',
        city: '',
        cousine: '',
        logo: null,
        bgImage: null,
        latitude: '',
        longitude: '',
        ranking: '',
      });
      setTimeout(() => router.push('/restuarent_login'), 2000);
    } catch (err) {
      setError(err.message);
      console.error('Submission error:', err);
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
              <label htmlFor="cousine" className="block text-gray-700 mb-2">
                Cousine
              </label>
              <div className="relative">
                <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="cousine"
                  name="cousine"
                  value={formData.cousine}
                  onChange={handleChange}
                  placeholder="Enter cousine type"
                  className="w-full p-3 pl-10 border rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </div>
            </div>
            <div className="mb-2 relative">
              <label htmlFor="ranking" className="block text-gray-700 mb-2">
                Ranking
              </label>
              <div className="relative">
                <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  id="ranking"
                  name="ranking"
                  value={formData.ranking}
                  onChange={handleChange}
                  placeholder="Enter ranking (0.0 to 5.0)"
                  className="w-full p-3 pl-10 border rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                  step="0.1"
                  min="0"
                  max="5"
                />
              </div>
            </div>
            <div className="mb-2 relative">
              <label htmlFor="latitude" className="block text-gray-700 mb-2">
                Latitude
              </label>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="latitude"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="Select location on map"
                  className="w-full p-3 pl-10 border rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                  required
                  readOnly
                />
              </div>
            </div>
            <div className="mb-2 relative">
              <label htmlFor="longitude" className="block text-gray-700 mb-2">
                Longitude
              </label>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="longitude"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="Select location on map"
                  className="w-full p-3 pl-10 border rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                  required
                  readOnly
                />
              </div>
            </div>
            <div className="mb-2 md:col-span-2">
              <label className="block text-gray-700 mb-2">Select Location</label>
              <div
                ref={mapRef}
                className="w-full h-64 border rounded"
              ></div>
              <p className="text-sm text-gray-500 mt-2">Click on the map or drag the marker to select the restaurant location.</p>
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
            <Link href="/restuarent_login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}