import { NextResponse } from 'next/server';
import prisma from '../../../../utils/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    // Parse request body
    const data = await request.json();

    // Validate request body
    if (!data || typeof data !== 'object') {
      console.log('Validation failed: Invalid request body', { data });
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { email, password } = data;

    // Validate required fields
    if (!email || !password) {
      console.log('Validation failed: Missing required fields', { data });
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate data types
    if (typeof email !== 'string' || typeof password !== 'string') {
      console.log('Validation failed: Invalid data types', { data });
      return NextResponse.json({ error: 'Invalid data types' }, { status: 400 });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log('Validation failed: Invalid email format', { data });
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Find restaurant by email
    const restaurant = await prisma.restaurant.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
      },
    });

    if (!restaurant) {
      console.log('Authentication failed: Restaurant not found', { email });
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, restaurant.password);
    if (!isPasswordValid) {
      console.log('Authentication failed: Invalid password', { email });
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined');
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    const token = jwt.sign(
      {
        id: restaurant.id,
        email: restaurant.email,
        name: restaurant.name,
        role: 'restaurant',
      },
      jwtSecret,
      { expiresIn: '1h' }
    );

    // Return success response
    return NextResponse.json(
      {
        token,
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          email: restaurant.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/restaurant/login:', {
      message: error.message,
      stack: error.stack,
      data: await request.json().catch(() => 'Failed to parse request body'),
    });
    return NextResponse.json(
      { error: `Internal Server Error: ${error.message}` },
      { status: 500 }
    );
  }
}