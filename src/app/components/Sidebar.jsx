'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/authContext';
import {
  HomeIcon,
  BuildingStorefrontIcon,
  ShoppingCartIcon,
  CalendarIcon,
  CreditCardIcon,
  TruckIcon,
  UserGroupIcon,
  Bars3Icon,
  XMarkIcon,
  PowerIcon,
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const { admin, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: HomeIcon },
    { name: 'Restaurants', path: '/admin/restaurants', icon: BuildingStorefrontIcon },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCartIcon },
    { name: 'Bookings', path: '/admin/bookings', icon: CalendarIcon },
    { name: 'Payments', path: '/admin/payments', icon: CreditCardIcon },
    { name: 'Parking', path: '/admin/parking', icon: TruckIcon },
    { name: 'Admins', path: '/admin/admins', icon: UserGroupIcon },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = () => {
    localStorage.removeItem('restaurantToken');
    router.push('/restaurant_login');
  };

  return (
    <aside
      className={`bg-primary text-gray-800 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-4 flex items-center justify-between">
        {!isCollapsed && (
          <h1 className="text-2xl font-bold">QuickBite Admin</h1>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded hover:bg-secondary focus:outline-none"
        >
          {isCollapsed ? (
            <Bars3Icon className="h-6 w-6" />
          ) : (
            <XMarkIcon className="h-6 w-6" />
          )}
        </button>
      </div>
      <nav className="flex-1">
        <ul>
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.path}
                className={`flex items-center p-4 hover:bg-secondary ${
                  pathname === item.path ? 'bg-secondary' : ''
                }`}
              >
                <item.icon className="h-6 w-6 mr-3" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4">
        <button
          onClick={logout}
          className="flex items-center w-full p-4 bg-red-600 hover:bg-red-700 text-white rounded"
        >
          <PowerIcon className="h-6 w-6 mr-3" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}