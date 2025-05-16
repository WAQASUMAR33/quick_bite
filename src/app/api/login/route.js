// app/api/users/signin/route.js
import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import bcrypt from 'bcrypt';

// POST: User Signin
export async function POST(request) {
  try {
    const data = await request.json();
    const { email, password } = data;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        city: true,
        address: true,
        password: true, // Needed for verification, excluded from response
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Exclude password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error signing in user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
