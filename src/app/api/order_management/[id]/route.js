import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';



// GET /api/orders
export async function GET(request, { params }){
  try {
 

     const { id } = params;
    const restaurantId =   parseInt(id);

    // Validate restaurantId
    if (!restaurantId || isNaN(restaurantId)) {
      console.error('GET /api/orders: Missing or invalid restaurantId');
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
      console.error('GET /api/orders: Restaurant not found', { restaurantId });
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Fetch orders
    const orders = await prisma.order.findMany({
      where: { restaurantId },
      select: {
        id: true,
        userId: true,
        restaurantId: true,
        totalAmount: true,
        order_date: true,
        order_time: true,
        contact_info: true,
        order_type: true,
        table_no: true,
        trnx_id: true,
        trnx_receipt: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { email: true } },
        restaurant: { select: { name: true } },
        orderItems: {
          select: {
            id: true,
            dishId: true,
            unit_rate: true,
            quantity: true,
            price: true,
            dish: { select: { name: true, imgurl: true } },
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Orders fetched successfully',
        status: true,
        data: orders,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/orders:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}



// PUT /api/bookings/[id]
export async function PUT(request, { params }) {
  const { id } = params;

  try {
    const body = await request.json();
    const { status } = body;

    // Validate required fields
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }
    if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be PENDING, CONFIRMED, CANCELLED, or COMPLETED' },
        { status: 400 }
      );
    }

    // Check if booking exists
    const existingBooking = await prisma.order.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingBooking) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update booking
    const updatedBooking = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status },
      select: {
        id: true},
    });

    return NextResponse.json(
      {
        message: 'Order updated successfully',
        status: true,
        data: updatedBooking,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating Order:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}