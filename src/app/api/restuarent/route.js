import { NextResponse } from 'next/server';
import prisma from '../../../../src/utils/prisma';
import bcrypt from 'bcrypt';

export async function POST(request) {
  try {
    const data = await request.json();
    const { 
      name, 
      email, 
      password, 
      phone, 
      address, 
      city, 
      cousine, 
      description, 
      logo, 
      bgImage, 
      latitude, 
      longitude, 
      ranking 
    } = data;

    if (!name || !email || !password || !phone || !address || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Name, email, password, phone, address, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      typeof phone !== 'string' ||
      typeof address !== 'string' ||
      (city && typeof city !== 'string') ||
      (cousine && typeof cousine !== 'string') ||
      (description && typeof description !== 'string') ||
      (logo && typeof logo !== 'string') ||
      (bgImage && typeof logo !== 'string') ||
      (typeof latitude !== 'number' && !latitude) ||
      (typeof longitude !== 'number' && !longitude) ||
      (ranking && typeof ranking !== 'number')
    ) {
      return NextResponse.json({ error: 'Invalid data types' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const latitudeStr = latitude.toString();
    const longitudeStr = longitude.toString();

    const latNum = parseFloat(latitudeStr);
    const lonNum = parseFloat(longitudeStr);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      return NextResponse.json({ error: 'Invalid latitude value' }, { status: 400 });
    }
    if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
      return NextResponse.json({ error: 'Invalid longitude value' }, { status: 400 });
    }

    if (ranking && (ranking < 0 || ranking > 5)) {
      return NextResponse.json({ error: 'Ranking must be between 0.0 and 5.0' }, { status: 400 });
    }

    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { email },
    });

    if (existingRestaurant) {
      return NextResponse.json(
        { error: 'Restaurant with this email already exists' },
        { status: 409 }
      );
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        address,
        city: city || '',
        cousine: cousine || '',
        description: description || '',
        logo: logo || '',
        bgImage: bgImage || '',
        latitude: latitudeStr,
        longitude: longitudeStr,
        ranking: ranking || 0.0,
        status: 'DE_ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        cousine: true,
        description: true,
        logo: true,
        bgImage: true,
        latitude: true,
        longitude: true,
        ranking: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ restaurant }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/restaurant:', {
      message: error.message,
      stack: error.stack,
      data: await request.json().catch(() => 'Failed to parse request body'),
    });

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Restaurant with this email already exists' },
        { status: 409 }
      );
    }

    if (error.code === 'P2003' || error.code === 'P2005') {
      return NextResponse.json(
        { error: 'Invalid data provided for restaurant creation' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `Internal Server Error: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const restaurants = await prisma.restaurant.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        cousine: true,
        description: true,
        logo: true,
        bgImage: true,
        latitude: true,
        longitude: true,
        ranking: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(restaurants, { status: 200 });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}