import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

// PUT /api/bookings/[id]
export async function PUT(request, { params }) {
  const { id } = params;

  try {
    const body = await request.json();
    const { status } = body;

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }
    if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be PENDING, CONFIRMED, CANCELLED, or COMPLETED' },
        { status: 400 }
      );
    }

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(id) },
      data: { status },
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
        message: 'Booking updated successfully',
        status: true,
        data: updatedBooking,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}