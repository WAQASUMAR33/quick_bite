// app/api/users/[id]/route.js
import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

// GET: Retrieve single user by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const userId = parseInt(id);

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
  } catch (error) {
    console.error('Error retrieving user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update user by ID (from previous request)
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();
    const { name, phone, city, address } = data;

    // Validate input: at least one field must be provided
    if (!name && !phone && !city && !address) {
      return NextResponse.json({ error: 'At least one field (name, phone, city, address) must be provided' }, { status: 400 });
    }

    // Check if user exists
    const userId = parseInt(id);
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || existingUser.name,
        phone: phone !== undefined ? phone : existingUser.phone,
        city: city || existingUser.city,
        address: address || existingUser.address,
        updatedAt: new Date(),
      },
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

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'User update failed due to unique constraint' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete user by ID
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const userId = parseInt(id);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
