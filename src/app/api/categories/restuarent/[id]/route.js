import { NextResponse } from 'next/server';
import prisma from '../../../../../utils/prisma';

// GET /api/categories/[id]
export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          message: 'Invalid restaurant ID',
          status: false,
          error: 'Restaurant ID must be a valid number',
        },
        { status: 400 }
      );
    }

    const restaurantId = parseInt(id);

    // Optionally validate restaurant existence (uncomment if needed)
    /*
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      return NextResponse.json(
        {
          message: 'Restaurant not found',
          status: false,
          error: 'Restaurant not found for the provided ID',
        },
        { status: 404 }
      );
    }
    */

    // Fetch categories
    const categories = await prisma.category.findMany({
      where: { restaurantId },
      select: {
        id: true,
        restaurantId: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Categories fetched successfully',
        status: true,
        data: categories,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/categories/[id]:', {
      message: error.message,
    });
    return NextResponse.json(
      {
        message: 'Internal server error',
        status: false,
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}