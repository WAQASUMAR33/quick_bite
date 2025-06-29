import { NextResponse } from 'next/server';
import prisma from '../../../utils/prisma';

// GET /api/bookings
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = parseInt(searchParams.get('restaurantId'));

    // Validate restaurantId
    if (!restaurantId || isNaN(restaurantId)) {
      console.error('GET /api/bookings: Missing or invalid restaurantId');
      return NextResponse.json(
        { error: 'restaurantId is required and must be a valid number' },
        { status: 400 }
      );
    }

    // Validate restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      console.error('GET /api/bookings: Restaurant not found', { restaurantId });
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Fetch bookings
    const bookings = await prisma.booking.findMany({
      where: { restaurantId },
      select: {
        id: true,
        userId: true,
        restaurantId: true,
        tableId: true,
        bookingTime: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { email: true } },
        table: { select: { tableNumber: true } },
      },
    });

    return NextResponse.json(
      {
        message: 'Bookings fetched successfully',
        status: true,
        data: bookings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/bookings:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}



export async function POST(request) {
  const body = await request.json();

  const {
    userId,
    restaurantId,
    orderItems,
    totalAmount,
    order_date,
    order_time,
    contact_info,
    order_type,
    table_no,
    trnx_id,
    trnx_receipt,
  } = body;

  // Validate required fields
  const requiredFields = [userId, restaurantId, orderItems, totalAmount, order_type];
  if (requiredFields.some(field => !field)) {
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Missing required fields: userId, restaurantId, orderItems, totalAmount, or order_type',
    }), { status: 400 });
  }

  try {
    // Create the order
    const newOrder = await prisma.order.create({
      data: {
        userId: parseInt(userId),
        restaurantId: parseInt(restaurantId),
        totalAmount: parseFloat(totalAmount),
        order_date,
        order_time,
        contact_info,
        order_type,
        table_no,
        trnx_id,
        trnx_receipt,
        status: 'PENDING',
      },
    });

    // Prepare and create order items
    const orderItemData = orderItems.map(item => ({
      orderId: newOrder.id,
      dishId: parseInt(item.dishId),
      unit_rate: parseFloat(item.unit_rate),
      quantity: parseInt(item.quantity),
      price: parseFloat(item.price),
    }));

    await prisma.orderItem.createMany({
      data: orderItemData,
    });

    // Success response
    return new Response(JSON.stringify({
      status: 'success',
      message: 'Order created successfully',
      data: { orderId: newOrder.id },
    }), { status: 201 });
  } catch (error) {
    console.error('Order creation failed:', error.message);
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Failed to create order',
      error: error.message,
    }), { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}