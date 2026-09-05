import { db } from '@/lib/db';
import { dispatchWebhook } from '../webhooks-dispatcher';
import { evaluateConditions } from '../rules/rules';
import { WhatsAppProvider, EmailProvider, PushProvider } from '../../integrations/messaging/messaging';

const whatsapp = new WhatsAppProvider();
const email = new EmailProvider();
const push = new PushProvider();

/**
 * Emits a domain event in the platform.
 * Triggers outgoing webhooks and runs local business automation rules.
 * @param {string} businessId 
 * @param {string} eventType e.g. "SALE_COMPLETED", "LOW_STOCK", "CUSTOMER_OVERDUE"
 * @param {object} payload 
 */
export async function emitEvent(businessId, eventType, payload) {
  console.log(`[Event Bus] Emitting event ${eventType} for business ${businessId}`);
  
  // 1. Dispatch outgoing webhook in background
  // Map event types to webhook keys
  const webhookKeyMap = {
    SALE_COMPLETED: 'sale.completed',
    LOW_STOCK: 'inventory.changed',
    CUSTOMER_CREATED: 'customer.created',
    PAYMENT_RECEIVED: 'payment.received'
  };

  const webhookEventName = webhookKeyMap[eventType];
  if (webhookEventName) {
    dispatchWebhook(businessId, webhookEventName, payload).catch(err => 
      console.error('[Event Bus] Webhook dispatch error:', err)
    );
  }

  // 2. Fetch and evaluate local automation rules
  try {
    const rules = await db.automationRule.findMany({
      where: {
        businessId,
        trigger: eventType,
        isActive: true
      }
    });

    for (const rule of rules) {
      const match = evaluateConditions(payload, rule.conditions);
      if (match) {
        console.log(`[Event Bus] Automation rule "${rule.name}" matches! Executing actions.`);
        await executeActions(businessId, rule.actions, payload);
      }
    }
  } catch (error) {
    console.error(`[Event Bus] Failed to evaluate automation rules for ${eventType}:`, error);
  }
}

async function executeActions(businessId, actions, payload) {
  if (!actions || !Array.isArray(actions)) return;

  for (const action of actions) {
    try {
      const { type, config = {} } = action;
      
      switch (type) {
        case 'whatsapp': {
          const { to, templateName } = config;
          if (to) {
            await whatsapp.sendText({
              to,
              text: `[Automation Alert] Rule triggered: ${templateName || 'Stock/Sale status change'}. Reference details: ${JSON.stringify(payload)}`
            });
          }
          break;
        }
        case 'email': {
          const { to, subject } = config;
          if (to) {
            await email.sendEmail({
              to,
              subject: subject || 'KiranaOS Automation Notification',
              text: `Your custom business automation rule has triggered.\n\nPayload: ${JSON.stringify(payload, null, 2)}`
            });
          }
          break;
        }
        case 'task': {
          const { title, description } = config;
          console.log(`[Automation Action - Task] Creating task: "${title} - ${description}"`);
          // We can record this in Audit Logs or a mock notifications list
          await db.auditLog.create({
            data: {
              businessId,
              userId: payload.userId || payload.createdBy || 'SYSTEM',
              action: 'AUTOMATION_TASK_CREATED',
              details: `Task: ${title}. Details: ${description}`
            }
          });
          break;
        }
        case 'reorder_recommendation': {
          console.log(`[Automation Action - Reorder] Logging low-stock reorder recommendation for product: ${payload.name}`);
          break;
        }
        default:
          console.warn(`[Event Bus] Unknown action type: ${type}`);
      }
    } catch (actionError) {
      console.error(`[Event Bus] Failed to execute action ${action.type}:`, actionError);
    }
  }
}
