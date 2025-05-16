import { NextResponse } from 'next/server';
import prisma from '../../../../utils/prisma';

// PUT /api/parking-slots/[id]
export async function PUT(request, { params }) {
  const { id } = params;

  try {
    const body = await request.json();
    const { restaurantId, slotNumber, status } = body;

    // Validate required fields
    if (!restaurantId || !slotNumber) {
      return NextResponse.json(
        { error: 'restaurantId and slotNumber are required' },
        { status: 400 }
      );
    }
    if (!['AVAILABLE', 'OCCUPIED', 'RESERVED'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be AVAILABLE, OCCUPIED, or RESERVED' },
        { status: 400 }
      );
    }

    // Check if parking slot exists
    const existingSlot = await prisma.parkingSlot.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingSlot) {
      return NextResponse.json({ error: 'Parking slot not found' }, { status: 404 });
    }

    // Validate restaurant exists and slot belongs to it
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(restaurantId) },
    });
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    if (existingSlot.restaurantId !== parseInt(restaurantId)) {
      return NextResponse.json(
        { error: 'Parking slot does not belong to this restaurant' },
        { status: 403 }
      );
    }

    // Validate unique slotNumber within restaurant
    const slotWithNumber = await prisma.parkingSlot.findFirst({
      where: {
        restaurantId: parseInt(restaurantId),
        slotNumber,
        id: { not: parseInt(id) },
      },
    });
    if (slotWithNumber) {
      return NextResponse.json(
        { error: 'Slot number already exists for this restaurant' },
        { status: 400 }
      );
    }

    // Update parking slot
    const updatedSlot = await prisma.parkingSlot.update({
      where: { id: parseInt(id) },
      data: {
        slotNumber,
        status,
      },
      select: {
        id: true,
        restaurantId: true,
        slotNumber: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Parking slot updated successfully',
        status: true,
        data: updatedSlot,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating parking slot:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// DELETE /api/parking-slots/[id]
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    // Check if parking slot exists
    const existingSlot = await prisma.parkingSlot.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingSlot) {
      return NextResponse.json({ error: 'Parking slot not found' }, { status: 404 });
    }

    // Delete parking slot
    await prisma.parkingSlot.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(
      {
        message: 'Parking slot deleted successfully',
        status: true,
        data: {},
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting parking slot:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}