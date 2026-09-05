import { db } from '@/lib/db';
import { getBusinessPlan, getUsage } from '@/lib/services/entitlements';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    if (!businessId) {
      return NextResponse.json({ success: false, error: 'Business ID missing.' }, { status: 400 });
    }

    const planInfo = await getBusinessPlan(businessId);
    
    // Get usage statistics
    const productUsage = await getUsage(businessId, 'products');
    const staffUsage = await getUsage(businessId, 'staff');
    const salesUsage = await getUsage(businessId, 'sales');

    const sub = await db.subscription.findUnique({
      where: { businessId }
    });

    const billingInfo = {
      plan: planInfo.planKey,
      status: planInfo.status,
      nextBillingDate: sub?.currentPeriodEnd || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      limits: planInfo.config.limits,
      usage: {
        products: productUsage,
        staff: staffUsage,
        sales: salesUsage,
        locations: 1 // mock
      }
    };

    return NextResponse.json({ success: true, data: billingInfo });
  } catch (error) {
    console.error('Billing GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const businessId = request.headers.get('x-business-id');
    const userId = request.headers.get('x-user-id');
    
    if (!businessId) {
      return NextResponse.json({ success: false, error: 'Business ID missing.' }, { status: 400 });
    }

    const { action, targetPlan } = await request.json(); // action: UPGRADE, DOWNGRADE, CANCEL, RESUME

    if (!action) {
      return NextResponse.json({ success: false, error: 'Action parameter is required.' }, { status: 400 });
    }

    const existingSub = await db.subscription.findUnique({
      where: { businessId }
    });

    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(now.getMonth() + 1);

    if (action === 'CANCEL') {
      if (!existingSub) {
        return NextResponse.json({ success: false, error: 'No active subscription found.' }, { status: 404 });
      }

      await db.subscription.update({
        where: { businessId },
        data: { status: 'CANCELLED' }
      });

      await db.auditLog.create({
        data: {
          businessId,
          userId,
          action: 'BILLING_CANCELLED',
          details: `Tenant cancelled subscription plan ${existingSub.plan}`
        }
      });

      return NextResponse.json({ success: true, message: 'Subscription cancelled successfully.' });
    }

    if (action === 'RESUME') {
      if (!existingSub) {
        return NextResponse.json({ success: false, error: 'No subscription found to resume.' }, { status: 404 });
      }

      await db.subscription.update({
        where: { businessId },
        data: { status: 'ACTIVE' }
      });

      await db.auditLog.create({
        data: {
          businessId,
          userId,
          action: 'BILLING_RESUMED',
          details: `Tenant resumed subscription plan ${existingSub.plan}`
        }
      });

      return NextResponse.json({ success: true, message: 'Subscription resumed successfully.' });
    }

    if (action === 'UPGRADE' || action === 'DOWNGRADE') {
      if (!targetPlan) {
        return NextResponse.json({ success: false, error: 'Target plan is required.' }, { status: 400 });
      }

      // Record subscription change
      await db.subscription.upsert({
        where: { businessId },
        update: {
          plan: targetPlan,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth
        },
        create: {
          businessId,
          plan: targetPlan,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth
        }
      });

      await db.auditLog.create({
        data: {
          businessId,
          userId,
          action: `BILLING_${action}`,
          details: `Changed plan to ${targetPlan}.`
        }
      });

      return NextResponse.json({ success: true, message: `Successfully changed plan to ${targetPlan}.` });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    console.error('Billing POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
