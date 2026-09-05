export class PaymentProvider {
  constructor(config = {}) {
    this.config = config;
  }

  async createPayment({ amount, currency = 'INR', referenceId, description, customer }) {
    throw new Error('createPayment() not implemented');
  }

  async verifyPayment(params, signature) {
    throw new Error('verifyPayment() not implemented');
  }

  async refundPayment(transactionId, amount) {
    throw new Error('refundPayment() not implemented');
  }

  async getStatus(transactionId) {
    throw new Error('getStatus() not implemented');
  }
}

class RazorpayPaymentProvider extends PaymentProvider {
  async createPayment({ amount, currency = 'INR', referenceId, description, customer }) {
    console.log(`[Razorpay] Creating payment link for ${amount} ${currency}`);
    // Simulate real Razorpay Link creation
    const paymentId = 'pay_rzp_' + Math.random().toString(36).substring(2, 15);
    return {
      success: true,
      provider: 'RAZORPAY',
      paymentId,
      paymentUrl: `https://api.razorpay.com/pay/mock_${paymentId}?amount=${amount}&ref=${referenceId}`,
      amount,
      status: 'CREATED'
    };
  }

  async verifyPayment(params, signature) {
    // In real app, verify hmac_sha256(params, secret) === signature
    return true;
  }

  async refundPayment(transactionId, amount) {
    return { success: true, refundId: 'rfnd_rzp_' + Math.random().toString(36).substring(2, 10), status: 'PROCESSED' };
  }

  async getStatus(transactionId) {
    return { success: true, status: 'PAID', transactionId };
  }
}

class StripePaymentProvider extends PaymentProvider {
  async createPayment({ amount, currency = 'INR', referenceId, description, customer }) {
    console.log(`[Stripe] Creating Checkout Session for ${amount} ${currency}`);
    const paymentId = 'cs_stripe_' + Math.random().toString(36).substring(2, 15);
    return {
      success: true,
      provider: 'STRIPE',
      paymentId,
      paymentUrl: `https://checkout.stripe.com/pay/mock_${paymentId}?amount=${amount}&ref=${referenceId}`,
      amount,
      status: 'CREATED'
    };
  }

  async verifyPayment(params, signature) {
    return true;
  }

  async refundPayment(transactionId, amount) {
    return { success: true, refundId: 're_' + Math.random().toString(36).substring(2, 10), status: 'succeeded' };
  }

  async getStatus(transactionId) {
    return { success: true, status: 'paid', transactionId };
  }
}

class CashfreePaymentProvider extends PaymentProvider {
  async createPayment({ amount, currency = 'INR', referenceId, description, customer }) {
    console.log(`[Cashfree] Creating order for ${amount} ${currency}`);
    const paymentId = 'cf_order_' + Math.random().toString(36).substring(2, 15);
    return {
      success: true,
      provider: 'CASHFREE',
      paymentId,
      paymentUrl: `https://payments.cashfree.com/order/mock_${paymentId}?amount=${amount}&ref=${referenceId}`,
      amount,
      status: 'ACTIVE'
    };
  }

  async verifyPayment(params, signature) {
    return true;
  }

  async refundPayment(transactionId, amount) {
    return { success: true, refundId: 'cf_ref_' + Math.random().toString(36).substring(2, 10), status: 'SUCCESS' };
  }

  async getStatus(transactionId) {
    return { success: true, status: 'SUCCESS', transactionId };
  }
}

export function getPaymentProvider(providerName = 'RAZORPAY', config = {}) {
  const normalized = providerName.toUpperCase();
  switch (normalized) {
    case 'STRIPE':
      return new StripePaymentProvider(config);
    case 'CASHFREE':
      return new CashfreePaymentProvider(config);
    case 'RAZORPAY':
    default:
      return new RazorpayPaymentProvider(config);
  }
}
