import { db } from '@/lib/db';
import { verifyJWT, hashPassword } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: { message: 'Not authenticated.' } }, { status: 401 });
    }

    const session = await verifyJWT(token);
    if (!session) {
      return NextResponse.json({ success: false, error: { message: 'Invalid or expired session.' } }, { status: 401 });
    }

    const { businessId, userId } = session;
    const body = await request.json();
    const { step, data } = body;

    if (!step || !data) {
      return NextResponse.json({ success: false, error: { message: 'Missing step or data payload.' } }, { status: 400 });
    }

    let result = null;

    switch (step) {
      case 'capabilities': {
        const { profile, activeCapabilities = [] } = data; // profile: KIRANA, CLOTHING, etc.
        result = await db.business.update({
          where: { id: businessId },
          data: {
            capabilities: {
              profile,
              activeCapabilities
            }
          }
        });
        break;
      }
      case 'location': {
        const { address, city, state, country = 'India', phone } = data;
        result = await db.business.update({
          where: { id: businessId },
          data: { address, city, state, country, phone }
        });
        break;
      }
      case 'product': {
        const { name, brand, purchasePrice, sellingPrice, taxRate, unit = 'piece', sku, barcode } = data;
        
        // Find default category for this business
        let category = await db.category.findFirst({
          where: { businessId }
        });

        if (!category) {
          category = await db.category.create({
            data: {
              businessId,
              name: 'General',
              description: 'General category'
            }
          });
        }

        result = await db.product.create({
          data: {
            businessId,
            categoryId: category.id,
            name,
            brand,
            sku,
            barcode,
            purchasePrice: parseFloat(purchasePrice || '0'),
            sellingPrice: parseFloat(sellingPrice || '0'),
            taxRate: parseFloat(taxRate || '0'),
            unit,
            inventory: {
              create: {
                businessId,
                quantity: 0
              }
            }
          }
        });
        break;
      }
      case 'tax': {
        const { taxNumber } = data;
        result = await db.business.update({
          where: { id: businessId },
          data: { taxNumber }
        });
        break;
      }
      case 'staff': {
        const { name, email, password, role = 'CASHIER' } = data;
        
        const existing = await db.user.findUnique({
          where: { email: email.toLowerCase() }
        });

        if (existing) {
          return NextResponse.json({ success: false, error: { message: 'A staff member with this email already exists.' } }, { status: 409 });
        }

        const hashedPassword = await hashPassword(password);
        result = await db.user.create({
          data: {
            businessId,
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role
          }
        });
        break;
      }
      default:
        return NextResponse.json({ success: false, error: { message: `Unknown onboarding step: ${step}` } }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Onboard POST error:', error);
    return NextResponse.json({ success: false, error: { message: 'Internal Server Error' } }, { status: 500 });
  }
}
