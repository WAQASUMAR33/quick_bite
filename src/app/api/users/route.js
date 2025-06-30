import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import bcrypt from 'bcrypt';



// POST: User Signup
export async function POST(request) {
  try {
    // Check Content-Type header
    // const contentType = request.headers.get('content-type');
    // if (!contentType || !contentType.includes('application/json')) {
    //   return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 });
    // }

    // Parse JSON body
    let data;
    try {
      data = await request.json();
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { email, password, name, phone, city, address } = data;

    // Enhanced input validation
    if (!email || !password || !name || !city || !address) {
      return NextResponse.json({ error: 'Email, password, name, city, and address are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }

    // Validate string lengths for MySQL VARCHAR limits
    if (name.length > 255 || city.length > 255 || address.length > 255 || (phone && phone.length > 50)) {
      return NextResponse.json({ error: 'Input fields exceed maximum length' }, { status: 400 });
    }

    // Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        city,
        address,
      },
      select: {
        id: true,
        email: true,
        name: true,
        city: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user ,status:"success"}, { status: 201 });
  } catch (error) {
    console.error('Error signing up user:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }
    if (error.name === 'PrismaClientInitializationError') {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET: Retrieve user records
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');

    // Fetch a single user by id or email
    if (id || email) {
      if (id && email) {
        return NextResponse.json({ error: 'Provide either id or email, not both' }, { status: 400 });
      }

      if (id && isNaN(parseInt(id))) {
        return NextResponse.json({ error: 'Invalid id format' }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: id ? { id: parseInt(id) } : { email },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          city: true,
          address: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json({ user });
    }

    // Fetch all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        city: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error retrieving users:', error);
    if (error.name === 'PrismaClientInitializationError') {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}