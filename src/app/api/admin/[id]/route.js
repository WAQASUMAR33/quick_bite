import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import bcrypt from 'bcrypt';
import { authMiddleware } from '@/app/lib/auth';

// PUT /api/admin/[id]
export const PUT = authMiddleware(async (request, { params }) => {
  const { id } = params;

  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    // Check if admin exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingAdmin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Validate at least one field is provided
    if (!name && !email && !password && !role) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      );
    }

    // Validate role if provided
    const validRoles = ['ADMIN', 'SUPER_ADMIN'];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json(
        { error: `role must be one of ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (email) {
      // Check if new email is already taken
      const emailTaken = await prisma.admin.findUnique({
        where: { email },
      });
      if (emailTaken && emailTaken.id !== parseInt(id)) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 400 }
        );
      }
      updateData.email = email;
    }
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (role) updateData.role = role;

    // Update admin
    const updatedAdmin = await prisma.admin.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedAdmin, { status: 200 });
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});