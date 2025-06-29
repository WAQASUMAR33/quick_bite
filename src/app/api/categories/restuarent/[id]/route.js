import { NextResponse } from 'next/server';
import prisma from '../../../../../utils/prisma';

// GET /api/dishes/[id]
export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Restaurant ID must be a valid number' },
        { status: 400 }
      );
    }

    const restaurantId = parseInt(id);

    // Fetch categories with their dishes
    const categories = await prisma.category.findMany({
      where: { restaurantId },
      select: {
        id: true,
        restaurantId: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        dishes: {
          select: {
            id: true,
            name: true,
            imgurl: true,
            description: true,
            price: true,
            available: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/dishes/[id]:', {
      message: error.message,
    });
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}