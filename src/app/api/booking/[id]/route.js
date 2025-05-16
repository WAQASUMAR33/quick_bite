import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

// GET /api/bookings/[id]
export async function GET(request, { params }) {
  const { id } = params;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        restaurantId: true,
        tableId: true,
        userId: true,
        customerName: true,
        customerEmail: true,
        bookingDate: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        restaurant: {
          select: { name: true, city: true },
        },
        table: {
          select: { tableNumber: true, capacity: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json(booking, { status: 200 });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/bookings/[id]
export async function PUT(request, { params }) {
  const { id } = params;

  try {
    const body = await request.json();
    const { restaurantId, tableId, userId, customerName, customerEmail, bookingDate, status } = body;

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Validate at least one field is provided
    if (
      !restaurantId &&
      !tableId &&
      userId === undefined &&
      !customerName &&
      !customerEmail &&
      !bookingDate &&
      !status
    ) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {};

    if (restaurantId) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: parseInt(restaurantId) },
      });
      if (!restaurant) {
        return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
      }
      updateData.restaurantId = parseInt(restaurantId);
    }

    if (tableId || bookingDate) {
      const newTableId = tableId ? parseInt(tableId) : existingBooking.tableId;
      const newBookingDate = bookingDate ? new Date(bookingDate) : new Date(existingBooking.bookingDate);

      // Validate table exists and belongs to restaurant
      const table = await prisma.table.findUnique({
        where: { id: newTableId },
      });
      if (!table || table.restaurantId !== (restaurantId || existingBooking.restaurantId)) {
        return NextResponse.json(
          { error: 'Table not found or does not belong to restaurant' },
          { status: 404 }
        );
      }

      // Validate booking date is in the future
      if (bookingDate && (isNaN(newBookingDate.getTime()) || newBookingDate <= new Date())) {
        return NextResponse.json(
          { error: 'bookingDate must be a valid future date' },
          { status: 400 }
        );
      }

      // Check for conflicting bookings
      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          tableId: newTableId,
          bookingDate: {
            gte: new Date(newBookingDate.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
            lte: new Date(newBookingDate.getTime() + 2 * 60 * 60 * 1000), // 2 hours after
          },
          status: { notIn: ['CANCELLED', 'COMPLETED'] },
          id: { not: parseInt(id) },
        },
      });
      if (conflictingBooking) {
        return NextResponse.json(
          { error: 'Table is already booked for the requested time' },
          { status: 400 }
        );
      }

      if (tableId) updateData.tableId = newTableId;
      if (bookingDate) updateData.bookingDate = newBookingDate;
    }

    if (userId !== undefined) updateData.userId = userId ? parseInt(userId) : null;
    if (customerName) updateData.customerName = customerName;
    if (customerEmail) updateData.customerEmail = customerEmail;
    if (status) updateData.status = status;

    // Update booking
    const updatedBooking = await prisma.$transaction(async (prisma) => {
      const booking = await prisma.booking.update({
        where: { id: parseInt(id) },
        data: updateData,
        select: {
          id: true,
          restaurantId: true,
          tableId: true,
          userId: true,
          customerName: true,
          customerEmail: true,
          bookingDate: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          restaurant: {
            select: { name: true, city: true },
          },
          table: {
            select: { tableNumber: true, capacity: true },
          },
        },
      });

      // Update table status if necessary
      if (status === 'CANCELLED' || status === 'COMPLETED') {
        await prisma.table.update({
          where: { id: booking.tableId },
          data: { status: 'AVAILABLE' },
        });
      } else if (tableId && tableId !== existingBooking.tableId) {
        // Update new table to RESERVED and old table to AVAILABLE
        await prisma.table.update({
          where: { id: parseInt(tableId) },
          data: { status: 'RESERVED' },
        });
        await prisma.table.update({
          where: { id: existingBooking.tableId },
          data: { status: 'AVAILABLE' },
        });
      }

      return booking;
    });

    return NextResponse.json(updatedBooking, { status: 200 });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/bookings/[id]
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    const existingBooking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    await prisma.$transaction(async (prisma) => {
      await prisma.booking.delete({
        where: { id: parseInt(id) },
      });

      // Update table status to AVAILABLE
      await prisma.table.update({
        where: { id: existingBooking.tableId },
        data: { status: 'AVAILABLE' },
      });
    });

    return NextResponse.json({ message: 'Booking deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}