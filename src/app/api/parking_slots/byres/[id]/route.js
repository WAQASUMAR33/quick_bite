import { NextResponse } from 'next/server';
import prisma from '../../../../../utils/prisma';

// GET /api/restaurants/[id]
export async function GET(request, { params }) {
  const { id } = params;

  try {
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      console.log('Invalid ID:', id);
      return NextResponse.json({ error: 'Invalid restaurant ID' }, { status: 400 });
    }

    // Fetch restaurant by ID
    const slots = await prisma.parkingSlot.findMany({
      where: { restaurantId: parseInt(id) },
    });

    if (!slots) {
      console.log('Restaurant not found for ID:', id);
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    console.log('slots fetched:', slots);
    return NextResponse.json(slots, { status: 200 });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    if (error.name === 'PrismaClientInitializationError') {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}