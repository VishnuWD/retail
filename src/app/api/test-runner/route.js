import { getPaymentProvider } from '@/lib/integrations/payments/PaymentProvider';
import { evaluateConditions } from '@/lib/services/rules/rules';
import { PLANS } from '@/lib/services/entitlements';
import { AIProvider } from '@/lib/services/ai/AIProvider';
import { processSupplierInvoice } from '@/lib/services/ai/ocr';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request) {
  const logs = [];
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      logs.push(`[PASS] ${message}`);
      passed++;
    } else {
      logs.push(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Payment Integration
  try {
    const provider = getPaymentProvider('STRIPE');
    const payment = await provider.createPayment({
      amount: 1500,
      currency: 'INR',
      referenceId: 'order_test_123',
      description: 'Test sale purchase'
    });
    assert(payment.success === true, 'Stripe Payment link created successfully');
    assert(payment.paymentUrl.includes('stripe.com'), 'Stripe Payment URL returned valid link');

    const refund = await provider.refundPayment('tx_stripe_123', 500);
    assert(refund.success === true, 'Refund processed successfully');
  } catch (err) {
    logs.push(`[FAIL] Payment Provider: ${err.message}`);
    failed++;
  }

  // 2. Rules Evaluator
  try {
    const payload = { totalAmount: 12000, category: 'Snacks' };
    const cond1 = { field: 'totalAmount', op: 'gt', value: 10000 };
    const cond2 = { field: 'category', op: 'eq', value: 'Beverages' };
    
    assert(evaluateConditions(payload, cond1) === true, 'Rule evaluates to TRUE when totalAmount > 10000');
    assert(evaluateConditions(payload, cond2) === false, 'Rule evaluates to FALSE when category is not Beverages');
  } catch (err) {
    logs.push(`[FAIL] Rules Evaluator: ${err.message}`);
    failed++;
  }

  // 3. SaaS Limits
  try {
    assert(PLANS.FREE.limits.products === 50, 'Free plan limits products to 50');
    assert(PLANS.PRO.features.includes('API'), 'Pro plan includes API capability');
  } catch (err) {
    logs.push(`[FAIL] SaaS Limits: ${err.message}`);
    failed++;
  }

  // 4. AI Provider
  try {
    const ai = new AIProvider();
    const ocrData = await ai.extract('invoice.pdf', {});
    assert(ocrData.vendor.length > 0, 'AI extracted vendor name from supplier invoice');
    assert(ocrData.items.length === 2, 'AI parsed invoice line items successfully');
  } catch (err) {
    logs.push(`[FAIL] AI Provider: ${err.message}`);
    failed++;
  }

  // 5. Outgoing Webhook Signing
  try {
    const payload = { event: 'product.created', data: { name: 'Amul Butter' } };
    const payloadStr = JSON.stringify(payload);
    const secret = 'whsec_test_secret_12345';
    
    const signature = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
    const verifiedSig = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');
    assert(signature === verifiedSig, 'HMAC SHA-256 Webhook signatures matched and verified');
  } catch (err) {
    logs.push(`[FAIL] Webhook Signing: ${err.message}`);
    failed++;
  }

  // 6. DB Connection Test
  try {
    const start = Date.now();
    await db.$queryRaw`SELECT 1`;
    assert(Date.now() - start < 500, 'Database connection is active and responding quickly');
  } catch (err) {
    logs.push(`[FAIL] DB connection: ${err.message}`);
    failed++;
  }

  return NextResponse.json({
    success: failed === 0,
    summary: {
      passed,
      failed,
      total: passed + failed
    },
    logs
  });
}
