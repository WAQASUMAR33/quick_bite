'use client';
import { useAuth } from '../../lib/authContext';

export default function Header() {
  const { admin } = useAuth();

  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <h2 className="text-xl font-semibold">Welcome, {admin?.name || 'Admin'}</h2>
      <div className="flex items-center space-x-4">
        <span className="text-gray-600">{admin?.email}</span>
        <span className="text-sm text-gray-500 capitalize">{admin?.role.toLowerCase()}</span>
      </div>
    </header>
  );
}