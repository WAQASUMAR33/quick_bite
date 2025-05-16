'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [adminToken, setAdminToken] = useState(null);
  const [restaurantToken, setRestaurantToken] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Load tokens from localStorage on mount
    const storedAdminToken = localStorage.getItem('adminToken');
    const storedAdmin = localStorage.getItem('admin');
    const storedRestaurantToken = localStorage.getItem('restaurantToken');
    const storedRestaurant = localStorage.getItem('restaurant');

    if (storedAdminToken && storedAdmin) {
      setAdminToken(storedAdminToken);
      setAdmin(JSON.parse(storedAdmin));
    }
    if (storedRestaurantToken && storedRestaurant) {
      setRestaurantToken(storedRestaurantToken);
      setRestaurant(JSON.parse(storedRestaurant));
    }

    // Skip redirect for auth-free routes
    const authFreeRoutes = ['/restuarent_login', '/restuarent_signup'];
    const currentPath = window.location.pathname;

    // Redirect to /login if no tokens and not on an auth-free route
    if (!storedAdminToken && !storedRestaurantToken && !authFreeRoutes.includes(currentPath)) {
      router.push('/login');
    }
  }, [router]);

  const login = async (email, password, type = 'admin') => {
    try {
      const endpoint = type === 'admin' ? '/api/admin/login' : '/api/restuarent/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        if (type === 'admin') {
          setAdmin(data.admin);
          setAdminToken(data.token);
          localStorage.setItem('adminToken', data.token);
          localStorage.setItem('admin', JSON.stringify(data.admin));
          router.push('/admin/dashboard');
        } else {
          setRestaurant(data.restaurant);
          setRestaurantToken(data.token);
          localStorage.setItem('restaurantToken', data.token);
          localStorage.setItem('restaurant', JSON.stringify(data.restaurant));
          router.push('/restuarent/dashboard');
        }
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = (type = 'admin') => {
    if (type === 'admin') {
      setAdmin(null);
      setAdminToken(null);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin');
      router.push('/login');
    } else {
      setRestaurant(null);
      setRestaurantToken(null);
      localStorage.removeItem('restaurantToken');
      localStorage.removeItem('restaurant');
      router.push('/restuarent_login');
    }
  };

  return (
    <AuthContext.Provider
      value={{ admin, restaurant, adminToken, restaurantToken, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}