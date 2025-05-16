import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function GET(request, { params }) {
  const { id } = params;

  try {
    // Validate restaurantId
    if (!id || isNaN(parseInt(id))) {
      console.log('Invalid restaurant ID:', id);
      return NextResponse.json({ error: 'Invalid restaurant ID' }, { status: 400 });
    }

    const restaurantIdInt = parseInt(id);

    // Verify restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantIdInt },
    });

    if (!restaurant) {
      console.log('Restaurant not found for ID:', restaurantIdInt);
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Fetch categories for the restaurant
    const categories = await prisma.category.findMany({
      where: { restaurantId: restaurantIdInt },
    });

    console.log('Categories fetched for restaurant ID:', restaurantIdInt, categories);
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error('Error fetching categories:', error);
    if (error.name === 'PrismaClientInitializationError') {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}