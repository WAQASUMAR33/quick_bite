import { NextResponse } from 'next/server';
import prisma from '../../../utils/prisma';

// POST /api/parking-slots
export async function POST(request) {
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

    // Validate restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(restaurantId) },
    });
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Validate unique slotNumber within restaurant
    const existingSlot = await prisma.parkingSlot.findFirst({
      where: { restaurantId: parseInt(restaurantId), slotNumber },
    });
    if (existingSlot) {
      return NextResponse.json(
        { error: 'Slot number already exists for this restaurant' },
        { status: 400 }
      );
    }

    // Create parking slot
    const parkingSlot = await prisma.parkingSlot.create({
      data: {
        restaurantId: parseInt(restaurantId),
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
        message: 'Parking slot created successfully',
        status: true,
        data: parkingSlot,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating parking slot:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// GET /api/parking-slots
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = parseInt(searchParams.get('restaurantId'));

    // Validate restaurantId
    if (!restaurantId || isNaN(restaurantId)) {
      console.error('GET /api/parking-slots: Missing or invalid restaurantId');
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
      console.error('GET /api/parking-slots: Restaurant not found', { restaurantId });
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Fetch parking slots
    const parkingSlots = await prisma.parkingSlot.findMany({
      where: { restaurantId },
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
        message: 'Parking slots fetched successfully',
        status: true,
        data: parkingSlots,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/parking-slots:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}