import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import bcrypt from 'bcrypt';

// POST: User Login
export async function POST(request) {
  try {
    // Log request headers
    console.log('Request headers:', Object.fromEntries(request.headers));

    // Check Content-Type header
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.log('Content-Type error:', contentType);
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 400 });
    }

    // Parse JSON body
    let data;
    try {
      const rawBody = await request.text();
      console.log('Raw request body:', rawBody);
      data = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { email, password } = data;
    console.log('Parsed request data:', { email, password });

    // Validate input
    if (!email || !password) {
      console.log('Missing fields:', { email, password });
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Invalid email:', email);
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true, // Needed for verification, not returned in response
        name: true,
        phone: true,
        city: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      console.log('User not found:', email);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Invalid password for email:', email);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Return user data (exclude password)
    const { password: _, ...userWithoutPassword } = user;
    console.log('User logged in:', userWithoutPassword);
    return NextResponse.json({ user: userWithoutPassword }, { status: 200 });
  } catch (error) {
    console.error('Error logging in user:', error);
    if (error.name === 'PrismaClientInitializationError') {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}