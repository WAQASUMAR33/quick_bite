import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

// POST /api/bookings
export async function POST(request) {
  try {
    const body = await request.json();
    const { restaurantId, tableId, userId, customerName, customerEmail, bookingDate, status } = body;

    // Validate required fields
    if (!restaurantId || !tableId || !customerName || !customerEmail || !bookingDate || !status) {
      return NextResponse.json(
        { error: 'restaurantId, tableId, customerName, customerEmail, bookingDate, and status are required' },
        { status: 400 }
      );
    }

    // Validate restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(restaurantId) },
    });
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Validate table exists and belongs to restaurant
    const table = await prisma.table.findUnique({
      where: { id: parseInt(tableId) },
    });
    if (!table || table.restaurantId !== parseInt(restaurantId)) {
      return NextResponse.json(
        { error: 'Table not found or does not belong to restaurant' },
        { status: 404 }
      );
    }

    // Validate booking date is in the future
    const bookingDateObj = new Date(bookingDate);
    if (isNaN(bookingDateObj.getTime()) || bookingDateObj <= new Date()) {
      return NextResponse.json(
        { error: 'bookingDate must be a valid future date' },
        { status: 400 }
      );
    }

    // Check for conflicting bookings (same table, overlapping time)
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        tableId: parseInt(tableId),
        bookingDate: {
          gte: new Date(bookingDateObj.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
          lte: new Date(bookingDateObj.getTime() + 2 * 60 * 60 * 1000), // 2 hours after
        },
        status: { notIn: ['CANCELLED', 'COMPLETED'] },
      },
    });
    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'Table is already booked for the requested time' },
        { status: 400 }
      );
    }

    // Create booking
    const booking = await prisma.$transaction(async (prisma) => {
      const newBooking = await prisma.booking.create({
        data: {
          restaurantId: parseInt(restaurantId),
          tableId: parseInt(tableId),
          userId: userId ? parseInt(userId) : null,
          customerName,
          customerEmail,
          bookingDate: bookingDateObj,
          status,
        },
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

      // Update table status to RESERVED
      await prisma.table.update({
        where: { id: parseInt(tableId) },
        data: { status: 'RESERVED' },
      });

      return newBooking;
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/bookings
export async function GET(request) {
  try {
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const tableId = searchParams.get('tableId');
    const status = searchParams.get('status');
    const bookingDate = searchParams.get('bookingDate');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const sortBy = searchParams.get('sortBy') || 'bookingDate';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Build where clause
    const where = {};
    if (restaurantId) where.restaurantId = parseInt(restaurantId);
    if (tableId) where.tableId = parseInt(tableId);
    if (status) where.status = status;
    if (bookingDate) {
      const date = new Date(bookingDate);
      if (!isNaN(date.getTime())) {
        where.bookingDate = {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lte: new Date(date.setHours(23, 59, 59, 999)),
        };
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch bookings
    const bookings = await prisma.booking.findMany({
      where,
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
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Get total count
    const total = await prisma.booking.count({ where });

    // Prepare response
    const response = {
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}