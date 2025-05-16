'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/authContext';
import {
  HomeIcon,
  TableCellsIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
  TruckIcon,
  CalendarIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/restuarent/dashboard', icon: HomeIcon },
    { name: 'Table Management', path: '/restuarent/table_management', icon: TableCellsIcon },
    { name: 'Category Management', path: '/restuarent/category_management', icon: TagIcon },
    { name: 'Menu Management', path: '/restuarent/menu_management', icon: ClipboardDocumentListIcon },
    { name: 'Order Management', path: '/restuarent/orders_management', icon: ShoppingCartIcon },
    { name: 'Parking Management', path: '/restuarent/parking_management', icon: TruckIcon },
    {
      name: 'Logout',
      path: '/restuarent_login',
      icon: ArrowLeftOnRectangleIcon,
      onClick: () => {
        logout();
        window.location.href = '/restuarent_login';
      },
    },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside
      className={`bg-gradient-to-b from-green-50 to-gray-50 text-gray-700 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } min-h-screen shadow-lg`}
      aria-label="Sidebar Navigation"
    >
      <div className="p-4 flex items-center justify-between border-b border-green-100">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <h1 className="text-xl font-bold text-gray-800">QuickBite Admin</h1>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-full hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-600 transition duration-200"
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <Bars3Icon className="h-6 w-6 text-gray-600" />
          ) : (
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name} className="relative group">
              {item.onClick ? (
                <button
                  onClick={item.onClick}
                  className={`flex items-center w-full p-3 rounded-lg hover:bg-green-100 transition-colors duration-200 ${
                    pathname === item.path ? 'bg-green-100 text-green-600' : ''
                  }`}
                >
                  <item.icon className="h-6 w-6 flex-shrink-0" />
                  {!isCollapsed && <span className="ml-3 font-medium">{item.name}</span>}
                  {isCollapsed && (
                    <span className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      {item.name}
                    </span>
                  )}
                </button>
              ) : (
                <Link
                  href={item.path}
                  className={`flex items-center p-3 rounded-lg hover:bg-green-100 transition-colors duration-200 ${
                    pathname === item.path ? 'bg-green-100 text-green-600' : ''
                  }`}
                >
                  <item.icon className="h-6 w-6 flex-shrink-0" />
                  {!isCollapsed && <span className="ml-3 font-medium">{item.name}</span>}
                  {isCollapsed && (
                    <span className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-sm rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                      {item.name}
                    </span>
                  )}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}