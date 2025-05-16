import { NextResponse } from 'next/server';
import prisma from '../../../utils/prisma';
import jwt from 'jsonwebtoken';
// POST /api/tables
export async function POST(request) {
  try {
    const body = await request.json();
    const { restaurantId, tableNumber, capacity, status } = body;

    // Validate required fields
    if (!restaurantId || !tableNumber || !capacity || !status) {
      return NextResponse.json(
        { error: 'restaurantId, tableNumber, capacity, and status are required' },
        { status: 400 }
      );
    }

    // Validate restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(restaurantId) },
    });
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Validate unique tableNumber within restaurant
    const existingTable = await prisma.table.findFirst({
      where: { restaurantId: parseInt(restaurantId), tableNumber },
    });
    if (existingTable) {
      return NextResponse.json(
        { error: 'Table number already exists for this restaurant' },
        { status: 400 }
      );
    }

    // Create table
    const table = await prisma.table.create({
      data: {
        restaurantId: parseInt(restaurantId),
        tableNumber,
        capacity: parseInt(capacity),
        status,
      },
      select: {
        id: true,
        restaurantId: true,
        tableNumber: true,
        capacity: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    console.error('Error creating table:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



// GET: Fetch all sea ports
export async function GET() {
  try {
    const tables = await prisma.table.findMany();

    return NextResponse.json(
      {
        message: 'Sea ports fetched successfully',
        status: true,
        data: tables,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching tables:', error.message);
    return NextResponse.json(
      {
        message: 'Failed to fetch tables',
        status: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}