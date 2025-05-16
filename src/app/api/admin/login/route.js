import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// POST /api/admin/login
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'email and password are required' },
        { status: 400 }
      );
    }

    // Find admin by email
    const admin = await prisma.admin.findUnique({
      where: { email },
    });
    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Return admin data (excluding password) and token
    const { password: _, ...adminData } = admin;
    return NextResponse.json(
      { admin: adminData, token },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error during admin login:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}