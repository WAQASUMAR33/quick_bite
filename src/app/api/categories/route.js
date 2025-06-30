import { NextResponse } from 'next/server';
import prisma from '../../../utils/prisma';

// POST /api/categories
export async function POST(request) {
  try {
    const body = await request.json();
    const { restaurantId, name, imgurl } = body;

    // Validate required fields
    if (!restaurantId || !name) {
      return NextResponse.json(
        { error: 'restaurantId and name are required' },
        { status: 400 }
      );
    }

    // Validate imgurl (optional, must be a valid URL if provided)
    if (imgurl && !/^https?:\/\/.+/.test(imgurl)) {
      return NextResponse.json(
        { error: 'imgurl must be a valid URL' },
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

    // Validate unique name within restaurant
    const existingCategory = await prisma.category.findFirst({
      where: { restaurantId: parseInt(restaurantId), name },
    });
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category name already exists for this restaurant' },
        { status: 400 }
      );
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        restaurantId: parseInt(restaurantId),
        name,
        imgurl: imgurl || '', // Use provided imgurl or default to empty string
      },
      select: {
        id: true,
        restaurantId: true,
        name: true,
        imgurl: true, // Include imgurl in response
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Category created successfully',
        status: true,
        data: category,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating category:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// GET /api/categories
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = parseInt(searchParams.get('restaurantId'));

    // Validate restaurantId
    if (!restaurantId || isNaN(restaurantId)) {
      console.error('GET /api/categories: Missing or invalid restaurantId');
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
      console.error('GET /api/categories: Restaurant not found', { restaurantId });
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Fetch categories
    const categories = await prisma.category.findMany({
      where: { restaurantId },
      select: {
        id: true,
        restaurantId: true,
        name: true,
        imgurl: true, // Include imgurl in response
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
    console.error('Error in GET /api/categories:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}