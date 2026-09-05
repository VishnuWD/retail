import { db } from '@/lib/db';
import { hashPassword, signJWT } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid registration details.', details: result.error.flatten() } },
        { status: 400 }
      );
    }
    
    const { businessName, ownerName, email, password } = result.data;
    
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_EXISTS', message: 'A user with this email address already exists.' } },
        { status: 409 }
      );
    }
    
    const hashedPassword = await hashPassword(password);
    
    const { user, business } = await db.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: businessName,
          legalName: businessName,
          country: 'India',
          currency: 'INR'
        }
      });
      
      const user = await tx.user.create({
        data: {
          name: ownerName,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: 'OWNER',
          businessId: business.id
        }
      });
      
      const initialCategories = ['Dairy', 'Beverages', 'Snacks', 'Staples', 'Household', 'Personal Care', 'Stationery', 'Toys'];
      for (const cat of initialCategories) {
        await tx.category.create({
          data: {
            name: cat,
            businessId: business.id,
            description: `Default ${cat} category`
          }
        });
      }
      
      return { user, business };
    });
    
    const token = await signJWT({
      userId: user.id,
      businessId: business.id,
      role: user.role,
      name: user.name
    });
    
    const response = NextResponse.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        business: { id: business.id, name: business.name }
      }
    });
    
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 Hours
    });
    
    return response;
  } catch (error) {
    console.error('Registration failed:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Registration failed due to an internal system error.' } },
      { status: 500 }
    );
  }
}
