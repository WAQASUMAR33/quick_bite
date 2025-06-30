import { NextResponse } from 'next/server';
import prisma from '../../../utils/prisma';

// GET /api/orders
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = parseInt(searchParams.get('restaurantId'));

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

// POST /api/orders
export async function POST(request) {
  try {
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
    const requiredFields = { userId, restaurantId, orderItems, totalAmount, order_type };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value || (key === 'orderItems' && (!Array.isArray(value) || value.length === 0))) {
        return NextResponse.json(
          { error: `${key} is required${key === 'orderItems' ? ' and must be a non-empty array' : ''}` },
          { status: 400 }
        );
      }
    }

    const totalAmountNum = parseFloat(totalAmount);
    if (isNaN(totalAmountNum) || totalAmountNum <= 0) {
      return NextResponse.json(
        { error: 'totalAmount must be a positive number' },
        { status: 400 }
      );
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(restaurantId) },
    });
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Validate orderItems
    for (const item of orderItems) {
      if (!item.dishId || !item.unit_rate || !item.quantity || !item.price) {
        return NextResponse.json(
          { error: 'Each order item must include dishId, unit_rate, quantity, and price' },
          { status: 400 }
        );
      }
      const dishId = parseInt(item.dishId);
      const unitRate = parseFloat(item.unit_rate);
      const quantity = parseInt(item.quantity);
      const price = parseFloat(item.price);

      if (isNaN(dishId) || isNaN(unitRate) || isNaN(quantity) || isNaN(price)) {
        return NextResponse.json(
          { error: 'orderItems must have valid numeric values for dishId, unit_rate, quantity, and price' },
          { status: 400 }
        );
      }
      if (unitRate <= 0 || quantity <= 0 || price <= 0) {
        return NextResponse.json(
          { error: 'unit_rate, quantity, and price must be positive' },
          { status: 400 }
        );
      }

      // Validate dish exists and belongs to the restaurant
      const dish = await prisma.dish.findUnique({
        where: { id: dishId },
        select: { id: true, restaurantId: true },
      });
      if (!dish) {
        return NextResponse.json({ error: `Dish not found: ${item.dishId}` }, { status: 404 });
      }
      if (dish.restaurantId !== parseInt(restaurantId)) {
        return NextResponse.json(
          { error: `Dish ${item.dishId} does not belong to the specified restaurant` },
          { status: 403 }
        );
      }
    }

    // Create the order
    const newOrder = await prisma.order.create({
      data: {
        userId: parseInt(userId),
        restaurantId: parseInt(restaurantId),
        totalAmount: totalAmountNum,
        order_date: order_date || '',
        order_time: order_time || '',
        contact_info: contact_info || '',
        order_type,
        table_no: table_no || '',
        trnx_id: trnx_id || '',
        trnx_receipt: trnx_receipt || '',
        status: 'PENDING',
      },
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

    // Fetch the created order with orderItems for the response
    const orderWithItems = await prisma.order.findUnique({
      where: { id: newOrder.id },
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
        message: 'Order created successfully',
        status: true,
        data: orderWithItems,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/orders:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}