import { db } from '@/lib/db';
import { categorySchema } from '@/lib/validations';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  try {
    const businessId = request.headers.get('x-business-id');
    const { id } = await params;
    const body = await request.json();
    
    // Validate inputs
    const name = body.name?.trim();
    const description = body.description?.trim();
    const isActive = body.isActive !== undefined ? body.isActive === true : undefined;
    
    if (name === '') {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Category name cannot be empty.' } },
        { status: 400 }
      );
    }
    
    const category = await db.category.findFirst({
      where: { id, businessId }
    });
    
    if (!category) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Category not found.' } },
        { status: 404 }
      );
    }
    
    // Check duplicate name exclusions
    if (name && name.toLowerCase() !== category.name.toLowerCase()) {
      const existing = await db.category.findFirst({
        where: {
          businessId,
          name: { equals: name, mode: 'insensitive' }
        }
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: { code: 'DUPLICATE_CATEGORY', message: 'Another category with this name already exists.' } },
          { status: 409 }
        );
      }
    }
    
    // Update category
    const updated = await db.category.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });
    
    return NextResponse.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to update category.' } },
      { status: 500 }
    );
  }
}
