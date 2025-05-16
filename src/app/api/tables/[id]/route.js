import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

// GET /api/tables/[id]
export async function GET(request, { params }) {
  const { id } = params;

  try {
    const table = await prisma.table.findUnique({
      where: { id: parseInt(id) },
     
    });

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    return NextResponse.json(table, { status: 200 });
  } catch (error) {
    console.error('Error fetching table:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/tables/[id]
export async function PUT(request, { params }) {
  const { id } = params;

  try {
    const body = await request.json();
    const { restaurantId, tableNumber, capacity, status } = body;

    // Validate required fields
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      );
    }

    // Check if table exists
    const existingTable = await prisma.table.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingTable) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    // Validate restaurant exists and table belongs to it
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(restaurantId) },
    });
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    if (existingTable.restaurantId !== parseInt(restaurantId)) {
      return NextResponse.json(
        { error: 'Table does not belong to this restaurant' },
        { status: 403 }
      );
    }

    // Validate at least one field is provided for update
    if (!tableNumber && !capacity && !status) {
      return NextResponse.json(
        { error: 'At least one of tableNumber, capacity, or status must be provided' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {};
    if (tableNumber) {
      // Validate unique tableNumber within restaurant
      const tableWithNumber = await prisma.table.findFirst({
        where: {
          restaurantId: parseInt(restaurantId),
          tableNumber,
          id: { not: parseInt(id) },
        },
      });
      if (tableWithNumber) {
        return NextResponse.json(
          { error: 'Table number already exists for this restaurant' },
          { status: 400 }
        );
      }
      updateData.tableNumber = tableNumber;
    }
    if (capacity) {
      const capacityNum = parseInt(capacity);
      if (isNaN(capacityNum) || capacityNum <= 0) {
        return NextResponse.json(
          { error: 'Capacity must be a positive number' },
          { status: 400 }
        );
      }
      updateData.capacity = capacityNum;
    }
    if (status) {
      const validStatuses = ['AVAILABLE', 'OCCUPIED', 'RESERVED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Status must be AVAILABLE, OCCUPIED, or RESERVED' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    // Update table
    const updatedTable = await prisma.table.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        restaurantId: true,
        tableNumber: true,
        capacity: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Table updated successfully',
        status: true,
        data: updatedTable,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating table:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// DELETE /api/tables/[id]
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    // Check if table exists
    const existingTable = await prisma.table.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingTable) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }

    // Check for related bookings
    const bookings = await prisma.booking.findFirst({
      where: { tableId: parseInt(id) },
    });
    if (bookings) {
      return NextResponse.json(
        { error: 'Cannot delete table with existing bookings' },
        { status: 400 }
      );
    }

    // Delete table
    await prisma.table.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(
      {
        message: 'Table deleted successfully',
        status: true,
        data: {},
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting table:', {
      message: error.message,
      stack: error.stack,
    });
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete table due to existing dependencies (e.g., bookings)' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}