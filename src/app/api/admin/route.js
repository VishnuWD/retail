import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/auth';
import { NextResponse } from 'next/server';

const PLATFORM_ROLES = ['PLATFORM_OWNER', 'ADMIN', 'SUPPORT', 'FINANCE', 'ENGINEERING', 'READ_ONLY'];

async function authorizeAdmin(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  const session = await verifyJWT(token);
  if (!session) return null;
  if (!PLATFORM_ROLES.includes(session.role)) return null;
  return session;
}

export async function GET(request) {
  const session = await authorizeAdmin(request);
  if (!session) {
    return NextResponse.json({ success: false, error: { message: 'Unauthorized. Platform Admin role required.' } }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'businesses';

    if (tab === 'businesses') {
      const businesses = await db.business.findMany({
        include: {
          subscription: true,
          users: { select: { id: true, name: true, email: true, role: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json({ success: true, data: { businesses } });
    }

    if (tab === 'audit') {
      const auditLogs = await db.auditLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          business: { select: { name: true } },
          user: { select: { name: true, email: true } }
        }
      });
      return NextResponse.json({ success: true, data: { auditLogs } });
    }

    if (tab === 'system') {
      // Mock background cron jobs list and feature flags
      const jobs = [
        { name: 'daily_db_backup', schedule: '0 2 * * *', lastRun: new Date().toISOString(), status: 'SUCCESS' },
        { name: 'billing_retry_engine', schedule: '*/10 * * * *', lastRun: new Date().toISOString(), status: 'SUCCESS' },
        { name: 'webhook_retry_worker', schedule: '*/5 * * * *', lastRun: new Date().toISOString(), status: 'SUCCESS' }
      ];
      
      const featureFlags = [
        { key: 'ai_billing_predictions', name: 'AI Billing Predictive Reminders', active: true },
        { key: 'offline_pos_v2', name: 'Offline Service Worker v2', active: false },
        { key: 'cashfree_checkout_link', name: 'Cashfree Payment Gateway Integration', active: true }
      ];

      return NextResponse.json({ success: true, data: { jobs, featureFlags } });
    }

    return NextResponse.json({ success: false, error: 'Invalid tab configuration.' }, { status: 400 });
  } catch (error) {
    console.error('Admin API GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await authorizeAdmin(request);
  if (!session) {
    return NextResponse.json({ success: false, error: { message: 'Unauthorized. Platform Admin role required.' } }, { status: 403 });
  }

  try {
    const payload = await request.json();
    const { action, details } = payload;

    if (action === 'SUPPORT_MODE') {
      const { targetBusinessId, durationMinutes = 30 } = details;
      
      if (session.role === 'READ_ONLY') {
        return NextResponse.json({ success: false, error: 'Read-only admins are forbidden from activating support access modes.' }, { status: 403 });
      }

      const targetBusiness = await db.business.findUnique({ where: { id: targetBusinessId } });
      if (!targetBusiness) {
        return NextResponse.json({ success: false, error: 'Target business not found.' }, { status: 404 });
      }

      // Log Support Mode Activation audit log
      await db.auditLog.create({
        data: {
          businessId: targetBusinessId,
          userId: session.userId,
          action: 'SUPPORT_MODE_ACTIVATED',
          details: `Platform Support mode entered by ${session.name} (Role: ${session.role}) for ${durationMinutes} minutes. Authorization reference logged.`
        }
      });

      console.log(`[Support Mode] Activated by Admin ${session.userId} for business ${targetBusinessId}`);

      return NextResponse.json({
        success: true,
        message: `Support Mode authorized for "${targetBusiness.name}". Active for ${durationMinutes} minutes.`,
        token: 'support_session_' + Math.random().toString(36).substring(2, 12)
      });
    }

    if (action === 'TOGGLE_FEATURE_FLAG') {
      const { flagKey, active } = details;
      console.log(`[Admin] Feature flag ${flagKey} set to ${active}`);
      return NextResponse.json({ success: true, message: `Feature flag ${flagKey} updated.` });
    }

    return NextResponse.json({ success: false, error: 'Invalid action.' }, { status: 400 });
  } catch (error) {
    console.error('Admin API POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
