export class AIProvider {
  constructor(providerName = 'MOCK', config = {}) {
    this.providerName = providerName.toUpperCase();
    this.config = config;
  }

  async generate(prompt, systemInstruction = '') {
    // 1. If real Google Gemini key exists, call Gemini API
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        console.log('[AIProvider] Invoking live Gemini model');
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemInstruction}\n\nUser: ${prompt}` }] }]
            })
          }
        );
        const data = await response.json();
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }
      } catch (err) {
        console.error('[AIProvider] Live Gemini API invocation failed:', err);
      }
    }

    // 2. Mock fallback sandbox operations
    console.log(`[AIProvider - ${this.providerName}] Generating response for prompt: ${prompt.substring(0, 100)}...`);
    
    // Simulate keyword-based response matching for the Safe Assistant
    const normalized = prompt.toLowerCase();
    
    if (normalized.includes('sales') || normalized.includes('revenue') || normalized.includes('money')) {
      return `Based on your recent transactions, your total sales this month is **₹48,500** across **32 transactions**, which is **up by 12%** compared to last week. Your top selling product is Tata Salt. Let me know if you would like me to compile a details report!`;
    }

    if (normalized.includes('inventory') || normalized.includes('stock') || normalized.includes('alert')) {
      return `Currently, you have **2 items low on stock**:\n1. Amul Butter (Current: 3, Threshold: 10)\n2. Britannia Biscuits (Current: 5, Threshold: 15)\n\nI recommend ordering **50 units** of Amul Butter. Would you like me to draft a purchase order for you to review?`;
    }

    if (normalized.includes('overdue') || normalized.includes('receivable') || normalized.includes('debt')) {
      return `You have **2 customers with outstanding credit balances** totaling **₹4,500**:\n- Ramesh Patil: ₹1,500 (Due 3 days ago)\n- Anita Sharma: ₹3,000 (Due today)\n\nWould you like me to prepare a WhatsApp friendly text reminder for Ramesh Patil?`;
    }

    return `Hello! I am your KiranaOS Retail Assistant. I can help summarize sales records, identify inventory alerts, list outstanding customer receivables, and draft purchase orders. Ask me something like "Are any items low on stock?" or "What are my sales today?"`;
  }

  async summarize(text) {
    return `Summary of raw text (${text.length} chars): The text describes inventory updates and transactional invoices.`;
  }

  async classify(text, categories = []) {
    return categories[0] || 'GENERAL';
  }

  async extract(text, schema) {
    // Used for invoice OCR matching
    console.log('[AIProvider] Simulating invoice data extraction');
    return {
      vendor: 'Tata Consumer Products Ltd',
      invoiceDate: new Date().toISOString().substring(0, 10),
      items: [
        { name: 'Tata Salt 1kg', quantity: 20, unitCost: 18.5, taxRate: 0, total: 370.0 },
        { name: 'Tata Tea Premium 250g', quantity: 10, unitCost: 85.0, taxRate: 5, total: 892.5 }
      ],
      subtotal: 1220.0,
      taxAmount: 42.5,
      totalAmount: 1262.5
    };
  }
}
