import { NextResponse } from 'next/server';
import prisma from '../../../../utils/prisma';

// PUT /api/categories/[id]
export async function PUT(request, { params }) {
  const { id } = params;

  try {
    const body = await request.json();
    const { restaurantId, name, imgurl } = body;

    // Validate required fields
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId is required' },
        { status: 400 }
      );
    }
    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
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

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Validate restaurant exists and category belongs to it
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(restaurantId) },
    });
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    if (existingCategory.restaurantId !== parseInt(restaurantId)) {
      return NextResponse.json(
        { error: 'Category does not belong to this restaurant' },
        { status: 403 }
      );
    }

    // Validate unique name within restaurant
    const categoryWithName = await prisma.category.findFirst({
      where: {
        restaurantId: parseInt(restaurantId),
        name,
        id: { not: parseInt(id) },
      },
    });
    if (categoryWithName) {
      return NextResponse.json(
        { error: 'Category name already exists for this restaurant' },
        { status: 400 }
      );
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        name,
        imgurl: imgurl !== undefined ? imgurl : existingCategory.imgurl, // Preserve existing imgurl if not provided
      },
      select: {
        id: true,
        restaurantId: true,
        name: true,
        imgurl: true, // Include imgurl in response
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Category updated successfully',
        status: true,
        data: updatedCategory,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating category:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id]
export async function DELETE(request, { params }) {
  const { id } = params;

  try {
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check for related dishes
    const dishes = await prisma.dish.findFirst({
      where: { categoryId: parseInt(id) },
    });
    if (dishes) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing dishes' },
        { status: 400 }
      );
    }

    // Delete category
    await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(
      {
        message: 'Category deleted successfully',
        status: true,
        data: {},
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting category:', {
      message: error.message,
      stack: error.stack,
    });
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete category due to existing dependencies (e.g., dishes)' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}