import { db } from '@/lib/db';
import { verifyJWT, hashPassword } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

    const session = await verifyJWT(token);
    if (!session) return NextResponse.json({ success: false, error: 'Session expired.' }, { status: 401 });

    const { businessId } = session;

    const staff = await db.user.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ success: true, data: staff });
  } catch (error) {
    console.error('Fetch staff error:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve staff list.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

    const session = await verifyJWT(token);
    if (!session) return NextResponse.json({ success: false, error: 'Session expired.' }, { status: 401 });

    const { businessId, role: actorRole, userId: actorId } = session;

    // Only OWNER can add staff accounts
    if (actorRole !== 'OWNER') {
      return NextResponse.json({ success: false, error: 'Only owners are authorized to create staff accounts.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ success: false, error: 'Name, email, password, and role are required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'User account with this email already exists.' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await db.user.create({
      data: {
        businessId,
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role // OWNER, MANAGER, INVENTORY, CASHIER
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    // Log Audit Log
    await db.auditLog.create({
      data: {
        businessId,
        userId: actorId,
        action: 'STAFF_REGISTERED',
        details: `Registered staff account "${name}" with role "${role}"`
      }
    });

    return NextResponse.json({ success: true, data: newUser });
  } catch (error) {
    console.error('Register staff error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create staff account.' }, { status: 500 });
  }
}
