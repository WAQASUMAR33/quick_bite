import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import bcrypt from 'bcrypt';


// GET /api/restaurants/[id]
export async function GET(request, { params }) {
  const { id } = params;

  try {
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      console.log('Invalid ID:', id);
      return NextResponse.json({ error: 'Invalid restaurant ID' }, { status: 400 });
    }

    // Fetch restaurant by ID
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(id) },
    });

    if (!restaurant) {
      console.log('Restaurant not found for ID:', id);
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    console.log('Restaurant fetched:', restaurant);
    return NextResponse.json(restaurant, { status: 200 });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    if (error.name === 'PrismaClientInitializationError') {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/restaurants/[id]
export async function PUT(request, { params }) {
  const { id } = params;

  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      phone,
      city,
      address,
      cuisine,
      capacity,
      logo,
      bgImage,
      status,
    } = body;

    // Validate required fields for update (at least one field must be provided)
    if (
      !name &&
      !email &&
      !password &&
      !phone &&
      !city &&
      !address &&
      !cuisine &&
      !capacity &&
      !logo &&
      !bgImage &&
      !status
    ) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update' },
        { status: 400 }
      );
    }

    // Check if restaurant exists
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingRestaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData = {};

    if (name) updateData.name = name;
    if (email) {
      // Check if email is unique (excluding current restaurant)
      const emailExists = await prisma.restaurant.findFirst({
        where: { email, id: { not: parseInt(id) } },
      });
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
      updateData.email = email;
    }
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (phone) updateData.phone = phone;
    if (city) updateData.city = city;
    if (address) updateData.address = address;
    if (cuisine) updateData.cuisine = cuisine;
    if (capacity) updateData.capacity = parseInt(capacity);
    if (logo) updateData.logo = await saveImage(logo, '/logos');
    if (bgImage) updateData.bgImage = await saveImage(bgImage, '/backgrounds');
    if (status) updateData.status = status;

    // Update restaurant
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        address: true,
        cuisine: true,
        capacity: true,
        logo: true,
        bgImage: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedRestaurant, { status: 200 });
  } catch (error) {
    console.error('Error updating restaurant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/restaurants/[id]
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    // Check if restaurant exists
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingRestaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Delete restaurant
    await prisma.restaurant.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Restaurant deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}