import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/auth';
import { AIProvider } from '@/lib/services/ai/AIProvider';
import { NextResponse } from 'next/server';

const ai = new AIProvider();

// Approved safe business tools to query state
async function getSalesSummary(businessId) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const sales = await db.sale.findMany({
    where: { businessId, createdAt: { gte: startOfDay }, status: 'COMPLETED' },
    select: { totalAmount: true }
  });
  
  const total = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  return `Today's Sales Summary: Total Revenue: ₹${total.toFixed(2)} across ${sales.length} invoices.`;
}

async function getInventoryAlerts(businessId) {
  const items = await db.inventory.findMany({
    where: { businessId },
    include: { product: { select: { name: true } } }
  });

  const lowStock = items.filter(i => i.quantity <= i.lowStockThreshold);
  if (lowStock.length === 0) {
    return 'Inventory Status: All products are well stocked. No low stock alerts.';
  }

  return `Inventory Alerts: There are ${lowStock.length} items low on stock:\n` + 
    lowStock.map(i => `- ${i.product.name}: Current stock is ${i.quantity} (Reorder point: ${i.lowStockThreshold})`).join('\n');
}

async function getCustomerBalances(businessId) {
  const customers = await db.customer.findMany({
    where: { businessId, outstandingCredit: { gt: 0 } },
    select: { name: true, outstandingCredit: true }
  });

  if (customers.length === 0) {
    return 'Customer Balances: No outstanding receivables/udhaar credits.';
  }

  const total = customers.reduce((sum, c) => sum + c.outstandingCredit, 0);
  return `Receivables Outstanding: Total ₹${total.toFixed(2)} owed by ${customers.length} customers:\n` + 
    customers.map(c => `- ${c.name}: ₹${c.outstandingCredit.toFixed(2)}`).join('\n');
}

async function getSupplierBalances(businessId) {
  const suppliers = await db.supplier.findMany({
    where: { businessId },
    include: { ledgers: { take: 1, orderBy: { createdAt: 'desc' } } }
  });

  const activeDues = suppliers.filter(s => s.ledgers[0]?.balanceAfter > 0);
  if (activeDues.length === 0) {
    return 'Supplier Balances: No outstanding payables due to suppliers.';
  }

  return `Supplier Dues: Outstanding balances:\n` +
    activeDues.map(s => `- ${s.name}: ₹${s.ledgers[0].balanceAfter.toFixed(2)}`).join('\n');
}

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized session.' }, { status: 401 });
    }

    const session = await verifyJWT(token);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session expired.' }, { status: 401 });
    }

    const { businessId, name: userName } = session;
    const { message } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Message is required.' }, { status: 400 });
    }

    // Protection: Prompt injection cleanup (sanitize text input)
    const sanitizedQuery = message.replace(/[\r\n\t]/g, ' ').trim().substring(0, 500);

    // Predefined routing/intent classification to invoke approved database tools
    let context = `Active Operator: ${userName}. Shop ID: ${businessId}.\n`;
    const normalized = sanitizedQuery.toLowerCase();

    if (normalized.includes('sale') || normalized.includes('revenue') || normalized.includes('today')) {
      context += await getSalesSummary(businessId);
    } else if (normalized.includes('inventory') || normalized.includes('stock') || normalized.includes('alert')) {
      context += await getInventoryAlerts(businessId);
    } else if (normalized.includes('customer') || normalized.includes('receivable') || normalized.includes('udhaar')) {
      context += await getCustomerBalances(businessId);
    } else if (normalized.includes('supplier') || normalized.includes('due') || normalized.includes('payable')) {
      context += await getSupplierBalances(businessId);
    } else {
      context += 'No specific tool context queried.';
    }

    const systemInstruction = `You are a helpful, secure retail AI assistant.
You do NOT execute arbitrary writes or updates.
You can ONLY query and report on the verified context variables provided below.
If a user requests changes (like editing prices or inventory counts), politely decline and state that actions require manual confirmation.
Context from Database:\n${context}`;

    const responseText = await ai.generate(sanitizedQuery, systemInstruction);

    return NextResponse.json({
      success: true,
      data: {
        response: responseText,
        contextUsed: context
      }
    });
  } catch (error) {
    console.error('Assistant API POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to complete assistant request.' }, { status: 500 });
  }
}
