import { db } from '@/lib/db';
import crypto from 'crypto';

/**
 * Dispatches an outgoing webhook event to registered external subscribers.
 * @param {string} businessId 
 * @param {string} event e.g. "product.created", "sale.completed"
 * @param {object} payload data payload
 */
export async function dispatchWebhook(businessId, event, payload) {
  try {
    // 1. Fetch active subscriptions for this business & event
    const subscriptions = await db.webhookSubscription.findMany({
      where: {
        businessId,
        isActive: true,
        events: { has: event }
      }
    });

    if (subscriptions.length === 0) {
      return;
    }

    const payloadString = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload
    });

    for (const sub of subscriptions) {
      // 2. Generate HMAC SHA-256 Signature
      const signature = crypto
        .createHmac('sha256', sub.secret)
        .update(payloadString)
        .digest('hex');

      // 3. Dispatch HTTP Post request in the background
      dispatchWithRetry(sub.url, payloadString, signature, 3);
    }
  } catch (error) {
    console.error('[Webhook Dispatcher] Error during dispatch selection:', error);
  }
}

async function dispatchWithRetry(url, body, signature, retriesRemaining) {
  try {
    console.log(`[Webhook Dispatcher] Sending payload to: ${url}. Retries left: ${retriesRemaining}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': 'true'
      },
      body,
      signal: AbortSignal.timeout(5000) // 5s timeout
    });

    if (!response.ok) {
      throw new Error(`Endpoint returned status: ${response.status}`);
    }

    console.log(`[Webhook Dispatcher] Successfully delivered to ${url}`);
  } catch (error) {
    console.error(`[Webhook Dispatcher] Delivery failed to ${url}. Error: ${error.message}`);
    
    if (retriesRemaining > 0) {
      // Exponential backoff retry
      const delay = Math.pow(2, 3 - retriesRemaining) * 1000;
      setTimeout(() => {
        dispatchWithRetry(url, body, signature, retriesRemaining - 1);
      }, delay);
    } else {
      console.error(`[Webhook Dispatcher] Max retries reached for ${url}. Giving up.`);
    }
  }
}
