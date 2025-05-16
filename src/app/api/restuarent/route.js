import { NextResponse } from 'next/server';
import prisma from '../../../../src/utils/prisma';
import bcrypt from 'bcrypt';

export async function POST(request) {
  try {
    // Parse request body
    const data = await request.json();

    // Validate request body
    // if (!data || typeof data !== 'object') {
    //   return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    // }

    // Extract fields
    const { name, email, password, phone, address, description, logo, bgImage } = data;

    // Validate required fields
    if (!name || !email || !password || !phone || !address) {
      return NextResponse.json(
        { error: 'Name, email, password, phone, and address are required' },
        { status: 400 }
      );
    }

    // Validate data types
    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof phone !== 'string' ||
      typeof address !== 'string' ||
      (description && typeof description !== 'string') ||
      (logo && typeof logo !== 'string') ||
      (bgImage && typeof bgImage !== 'string')
    ) {
      return NextResponse.json({ error: 'Invalid data types' }, { status: 400 });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check for existing restaurant
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { email },
    });

    if (existingRestaurant) {
      return NextResponse.json(
        { error: 'Restaurant with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create restaurant
    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        address,
        description: description || null,
        logo: logo || null,
        bgImage: bgImage || null,
        status: 'DE_ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        description: true,
        logo: true,
        bgImage: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ restaurant }, { status: 201 });
  } catch (error) {
    // Detailed error logging
    console.error('Error in POST /api/restuarent:', {
      message: error.message,
      stack: error.stack,
      data: await request.json().catch(() => 'Failed to parse request body'),
    });

    // Handle Prisma unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Restaurant with this email already exists' },
        { status: 409 }
      );
    }

    // Handle other Prisma errors (e.g., invalid enum value)
    if (error.code === 'P2003' || error.code === 'P2005') {
      return NextResponse.json(
        { error: 'Invalid data provided for restaurant creation' },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      { error: `Internal Server Error: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const restaurants = await prisma.restaurant.findMany();
    return NextResponse.json(restaurants, { status: 200 });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}