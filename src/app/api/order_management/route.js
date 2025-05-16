import { NextResponse } from 'next/server';
import prisma from '../../../utils/prisma';

// GET /api/bookings
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = parseInt(searchParams.get('restaurantId'));

    // Validate restaurantId
    if (!restaurantId || isNaN(restaurantId)) {
      console.error('GET /api/bookings: Missing or invalid restaurantId');
      return NextResponse.json(
        { error: 'restaurantId is required and must be a valid number' },
        { status: 400 }
      );
    }

    // Validate restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      console.error('GET /api/bookings: Restaurant not found', { restaurantId });
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Fetch bookings
    const bookings = await prisma.booking.findMany({
      where: { restaurantId },
      select: {
        id: true,
        userId: true,
        restaurantId: true,
        tableId: true,
        bookingTime: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { email: true } },
        table: { select: { tableNumber: true } },
      },
    });

    return NextResponse.json(
      {
        message: 'Bookings fetched successfully',
        status: true,
        data: bookings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/bookings:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}