import { NextResponse } from 'next/server';
import prisma from '../../../../../utils/prisma';

// GET /api/restuarent/getall/[id]
export async function GET(request, { params }) {
  const { id } = params;

  try {
    // Validate ID
    const restaurantId = parseInt(id);
    if (isNaN(restaurantId)) {
      return NextResponse.json(
        { error: 'Invalid restaurant ID' },
        { status: 400 }
      );
    }

    // Fetch restaurant with tables, categories, and dishes
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        bgImage: true,
        logo: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        tables: {
          select: {
            id: true,
            restaurantId: true,
            tableNumber: true,
            capacity: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        categories: {
          select: {
            id: true,
            restaurantId: true,
            name: true,
            imgurl: true,
            createdAt: true,
            updatedAt: true,
            dishes: {
              select: {
                id: true,
                categoryId: true,
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
        },
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(restaurant, { status: 200 });
  } catch (error) {
    console.error(`Error in GET /api/restuarent/getall/${id}:`, {
      message: error.message,
    });
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}