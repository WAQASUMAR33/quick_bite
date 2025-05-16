'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/authContext';
import MetricCard from '../../components/Matriccard';
import RecentActivity from '../../components/RecentActivity';

export default function DashboardPage() {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState({
    restaurants: 0,
    orders: 0,
    bookings: 0,
    payments: 0,
    parking: 0,
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch metrics
        const [restaurantsRes, ordersRes, bookingsRes, paymentsRes, parkingRes] = await Promise.all([
          fetch('/api/restaurants', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/payments', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/parking', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const [restaurants, orders, bookings, payments, parking] = await Promise.all([
          restaurantsRes.json(),
          ordersRes.json(),
          bookingsRes.json(),
          paymentsRes.json(),
          parkingRes.json(),
        ]);

        setMetrics({
          restaurants: restaurants.pagination?.total || 0,
          orders: orders.pagination?.total || 0,
          bookings: bookings.pagination?.total || 0,
          payments: payments.pagination?.total || 0,
          parking: parking.pagination?.total || 0,
        });

        // Fetch recent activities (combine recent orders, bookings, payments)
        const recentActivities = [
          ...orders.data.map((order) => ({
            id: `order-${order.id}`,
            type: 'Order',
            details: `Order #${order.id} for $${order.totalPrice}`,
            createdAt: order.createdAt,
          })),
          ...bookings.data.map((booking) => ({
            id: `booking-${booking.id}`,
            type: 'Booking',
            details: `Booking by ${booking.customerName}`,
            createdAt: booking.createdAt,
          })),
          ...payments.data.map((payment) => ({
            id: `payment-${payment.id}`,
            type: 'Payment',
            details: `Payment of $${payment.amount} via ${payment.paymentMethod}`,
            createdAt: payment.createdAt,
          })),
        ]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);

        setActivities(recentActivities);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <MetricCard
          title="Restaurants"
          value={metrics.restaurants}
          icon="🏬"
        />
        <MetricCard
          title="Orders"
          value={metrics.orders}
          icon="🍽️"
        />
        <MetricCard
          title="Bookings"
          value={metrics.bookings}
          icon="📅"
        />
        <MetricCard
          title="Payments"
          value={metrics.payments}
          icon="💸"
        />
        <MetricCard
          title="Parking Reservations"
          value={metrics.parking}
          icon="🚗"
        />
      </div>
      <RecentActivity activities={activities} />
    </div>
  );
}