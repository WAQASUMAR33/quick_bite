import { NextResponse } from 'next/server';
import prisma from '../../../../utils/prisma';

// PUT /api/dishes/[id]
export async function PUT(request, { params }) {
  const { id } = params;

  try {
    const body = await request.json();
    const { categoryId, name, description, price, available, imgurl } = body;

    // Validate required fields
    if (!categoryId || !name || !price) {
      return NextResponse.json(
        { error: 'categoryId, name, and price are required' },
        { status: 400 }
      );
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      );
    }

    // Validate imgurl (optional, must be a valid URL if provided)
    if (imgurl && !/^https?:\/\/.+/.test(imgurl)) {
      return NextResponse.json(
        { error: 'imgurl must be a valid URL' },
        { status: 400 }
      );
    }

    // Check if dish exists
    const existingDish = await prisma.dish.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, category: { select: { restaurantId: true } }, imgurl: true },
    });
    if (!existingDish) {
      return NextResponse.json({ error: 'Dish not found' }, { status: 404 });
    }

    // Validate category exists and belongs to same restaurant
    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) },
      select: { id: true, restaurantId: true },
    });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    if (category.restaurantId !== existingDish.category.restaurantId) {
      return NextResponse.json(
        { error: 'Category does not belong to the same restaurant as the dish' },
        { status: 403 }
      );
    }

    // Validate unique name within restaurant
    const dishWithName = await prisma.dish.findFirst({
      where: {
        name,
        category: { restaurantId: category.restaurantId },
        id: { not: parseInt(id) },
      },
    });
    if (dishWithName) {
      return NextResponse.json(
        { error: 'Dish name already exists for this restaurant' },
        { status: 400 }
      );
    }

    // Update dish
    const updatedDish = await prisma.dish.update({
      where: { id: parseInt(id) },
      data: {
        categoryId: parseInt(categoryId),
        name,
        description: description || null,
        price: priceNum,
        available: available !== undefined ? available : true,
        imgurl: imgurl !== undefined ? imgurl : existingDish.imgurl,
      },
      select: {
        id: true,
        categoryId: true,
        name: true,
        description: true,
        price: true,
        available: true,
        imgurl: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { name: true } },
      },
    });

    return NextResponse.json(
      {
        message: 'Dish updated successfully',
        status: true,
        data: updatedDish,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating dish:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// DELETE /api/dishes/[id]
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    // Check if dish exists
    const existingDish = await prisma.dish.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingDish) {
      return NextResponse.json({ error: 'Dish not found' }, { status: 404 });
    }

    // Check for related order items
    const orderItems = await prisma.orderItem.findFirst({
      where: { dishId: parseInt(id) },
    });
    if (orderItems) {
      return NextResponse.json(
        { error: 'Cannot delete dish with existing order items' },
        { status: 400 }
      );
    }

    // Delete dish
    await prisma.dish.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(
      {
        message: 'Dish deleted successfully',
        status: true,
        data: {},
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting dish:', {
      message: error.message,
      stack: error.stack,
    });
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete dish due to existing dependencies (e.g., order items)' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}