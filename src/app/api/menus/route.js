import { NextResponse } from 'next/server';
import prisma from '../../../utils/prisma';

// POST /api/dishes
export async function POST(request) {
  try {
    const body = await request.json();
    const { categoryId, name, description, price, available, imgurl } = body;

    // Validate required fields
    if (!categoryId || !name || !price) {
      return NextResponse.json(
        { error: 'categoryId, name, and price are required' },
        { status: 400 }
      );
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
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

    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) },
      select: { id: true, restaurantId: true },
    });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Validate unique name within restaurant
    const existingDish = await prisma.dish.findFirst({
      where: { name, category: { restaurantId: category.restaurantId } },
    });
    if (existingDish) {
      return NextResponse.json(
        { error: 'Dish name already exists for this restaurant' },
        { status: 400 }
      );
    }

    // Create dish
    const dish = await prisma.dish.create({
      data: {
        categoryId: parseInt(categoryId),
        name,
        description: description || null,
        price: priceNum,
        available: available !== undefined ? available : true,
        imgurl: imgurl || '',
      },
      select: {
        id: true,
        categoryId: true,
        name: true,
        description: true,
        price: true,
        available: true,
        imgurl: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { name: true } },
      },
    });

    return NextResponse.json(
      {
        message: 'Dish created successfully',
        status: true,
        data: dish,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating dish:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// GET /api/dishes
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = parseInt(searchParams.get('restaurantId'));

    // Validate restaurantId
    if (!restaurantId || isNaN(restaurantId)) {
      console.error('GET /api/dishes: Missing or invalid restaurantId');
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
      console.error('GET /api/dishes: Restaurant not found', { restaurantId });
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Fetch dishes
    const dishes = await prisma.dish.findMany({
      where: { category: { restaurantId } },
      select: {
        id: true,
        categoryId: true,
        name: true,
        description: true,
        price: true,
        available: true,
        imgurl: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { name: true } },
      },
    });

    return NextResponse.json(
      {
        message: 'Dishes fetched successfully',
        status: true,
        data: dishes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/dishes:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}