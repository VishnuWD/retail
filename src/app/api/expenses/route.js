import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/auth';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

    const session = await verifyJWT(token);
    if (!session) return NextResponse.json({ success: false, error: 'Session expired.' }, { status: 401 });

    const { businessId } = session;

    // Fetch expense logs from audit logs table
    const logs = await db.auditLog.findMany({
      where: {
        businessId,
        action: 'EXPENSE_LOGGED'
      },
      orderBy: { createdAt: 'desc' }
    });

    const expenses = logs.map(log => {
      try {
        const payload = JSON.parse(log.details);
        return {
          id: log.id,
          amount: parseFloat(payload.amount),
          category: payload.category || 'Miscellaneous',
          description: payload.description || '',
          date: payload.date || log.createdAt.toISOString().substring(0, 10),
          createdAt: log.createdAt
        };
      } catch (err) {
        return {
          id: log.id,
          amount: 0,
          category: 'Miscellaneous',
          description: log.details,
          date: log.createdAt.toISOString().substring(0, 10),
          createdAt: log.createdAt
        };
      }
    });

    return NextResponse.json({ success: true, data: expenses });
  } catch (error) {
    console.error('Fetch expenses error:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve expenses.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

    const session = await verifyJWT(token);
    if (!session) return NextResponse.json({ success: false, error: 'Session expired.' }, { status: 401 });

    const { businessId, userId } = session;

    const body = await request.json();
    const { amount, category, description, date } = body;
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid expense amount. Must be greater than 0.' }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ success: false, error: 'Expense category is required.' }, { status: 400 });
    }

    // Save serialized expense payload in audit log
    const expenseId = crypto.randomUUID();
    const audit = await db.auditLog.create({
      data: {
        businessId,
        userId,
        action: 'EXPENSE_LOGGED',
        details: JSON.stringify({
          id: expenseId,
          amount: parsedAmount,
          category,
          description: description || '',
          date: date || new Date().toISOString().substring(0, 10)
        })
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: audit.id,
        amount: parsedAmount,
        category,
        description,
        date
      }
    });
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json({ success: false, error: 'Failed to record expense.' }, { status: 500 });
  }
}
