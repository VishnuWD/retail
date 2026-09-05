import { db } from '@/lib/db';
import { categorySchema } from '@/lib/validations';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    
    const categories = await db.category.findMany({
      where: { businessId },
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Fetch categories error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to fetch categories.' } },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    const body = await request.json();
    
    const result = categorySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid category fields.', details: result.error.flatten() } },
        { status: 400 }
      );
    }
    
    const { name, description } = result.data;
    
    const existing = await db.category.findFirst({
      where: {
        businessId,
        name: { equals: name.trim(), mode: 'insensitive' }
      }
    });
    
    if (existing) {
      if (!existing.isActive) {
        const reactivated = await db.category.update({
          where: { id: existing.id },
          data: { isActive: true, description: description || existing.description }
        });
        return NextResponse.json({ success: true, data: reactivated });
      }
      
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_CATEGORY', message: `A category named "${name}" already exists.` } },
        { status: 409 }
      );
    }
    
    const category = await db.category.create({
      data: {
        businessId,
        name: name.trim(),
        description: description ? description.trim() : null,
        isActive: true
      }
    });
    
    return NextResponse.json({
      success: true,
      data: category
    }, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to create category.' } },
      { status: 500 }
    );
  }
}
