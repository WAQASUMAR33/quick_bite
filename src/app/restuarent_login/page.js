'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/authContext';
import Link from 'next/link';
import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';

export default function RestaurantLoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await login(formData.email, formData.password, 'restaurant');
      setSuccess('Login successful!');
      setFormData({ email: '', password: '' });
      setTimeout(() => router.push('/restuarent/dashboard'), 500); // Redirect after 2s
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left Side: Image */}
      <div className="w-full md:w-1/2">
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4"
          alt="Restaurant"
          className="object-cover h-full w-full"
        />
      </div>
      {/* Right Side: Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-100 px-8 py-2">
        <div className="max-w-md w-full bg-white px-8 py-4 rounded-lg shadow-lg">
          <img
            src="/quickbite.png"
            alt="QuickBite Logo"
            className="w-38 h-38 mx-auto mb-6"
             
          />
          <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">Restaurant Login</h1>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {success && <p className="text-green-500 mb-4">{success}</p>}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder='Enter Email'
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder='Enter Password'
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded flex items-center justify-center"
            >
              <ArrowRightCircleIcon className="h-6 w-6 mr-2" />
              Log In
            </button>
          </form>
          <p className="mt-4 text-center">
            If you dont have an account,{' '}
            <Link href="/restuarent_signup" className="text-blue-600 hover:underline">
              signup
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}