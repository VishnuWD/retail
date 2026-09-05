import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });

    const session = await verifyJWT(token);
    if (!session) return NextResponse.json({ success: false, error: 'Session expired.' }, { status: 401 });

    const { businessId, userId } = session;
    const { id: customerId } = await params;

    const body = await request.json();
    const { amount, note } = body;
    const collectAmount = parseFloat(amount);

    if (isNaN(collectAmount) || collectAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid collection amount.' }, { status: 400 });
    }

    const updatedCustomer = await db.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId }
      });

      if (!customer || customer.businessId !== businessId) {
        throw new Error('Customer not found.');
      }

      const currentCredit = parseFloat(customer.outstandingCredit || 0);
      const newCredit = Math.max(0, currentCredit - collectAmount);

      const updated = await tx.customer.update({
        where: { id: customerId },
        data: { outstandingCredit: newCredit }
      });

      // Log Audit Log
      await tx.auditLog.create({
        data: {
          businessId,
          userId,
          action: 'CREDIT_COLLECTION',
          details: `Collected ₹${collectAmount.toFixed(2)} from customer "${customer.name}". Outstanding credit reduced from ₹${currentCredit.toFixed(2)} to ₹${newCredit.toFixed(2)}. Note: ${note || 'None'}`
        }
      });

      return updated;
    });

    return NextResponse.json({ success: true, data: updatedCustomer });
  } catch (error) {
    console.error('Credit Collection Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error.' }, { status: 500 });
  }
}
