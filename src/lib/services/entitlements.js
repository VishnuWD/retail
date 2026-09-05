import { db } from '@/lib/db';

export const PLANS = {
  FREE: {
    name: 'Free Plan',
    features: ['POS', 'INVENTORY'],
    limits: { products: 50, staff: 1, locations: 1, sales: 100 }
  },
  STARTER: {
    name: 'Starter Plan',
    features: ['POS', 'INVENTORY', 'ONLINE_STORE', 'GST_FEATURES'],
    limits: { products: 500, staff: 3, locations: 1, sales: 1000 }
  },
  GROWTH: {
    name: 'Growth Plan',
    features: ['POS', 'INVENTORY', 'ONLINE_STORE', 'MULTI_STORE', 'GST_FEATURES', 'LOYALTY'],
    limits: { products: 5000, staff: 10, locations: 3, sales: 5000 }
  },
  PRO: {
    name: 'Pro Plan',
    features: [
      'POS', 'INVENTORY', 'ONLINE_STORE', 'MULTI_STORE', 'GST_FEATURES', 
      'LOYALTY', 'MARKETING', 'API', 'ACCOUNTING_INTEGRATION'
    ],
    limits: { products: 50000, staff: 50, locations: 10, sales: 50000 }
  },
  ENTERPRISE: {
    name: 'Enterprise Plan',
    features: [
      'POS', 'INVENTORY', 'ONLINE_STORE', 'MULTI_STORE', 'GST_FEATURES', 
      'LOYALTY', 'MARKETING', 'API', 'ACCOUNTING_INTEGRATION', 'OFFLINE_POS', 'ADVANCED_ANALYTICS'
    ],
    limits: { products: 1000000, staff: 500, locations: 100, sales: 1000000 }
  }
};

/**
 * Gets the active plan for a business.
 * @param {string} businessId 
 */
export async function getBusinessPlan(businessId) {
  const sub = await db.subscription.findUnique({
    where: { businessId }
  });

  if (!sub) {
    // Default to FREE if no subscription is set
    return {
      planKey: 'FREE',
      status: 'ACTIVE',
      config: PLANS.FREE
    };
  }

  const planKey = sub.plan.toUpperCase();
  const config = PLANS[planKey] || PLANS.FREE;

  return {
    planKey,
    status: sub.status, // ACTIVE, trialing, expired, cancelled
    config
  };
}

/**
 * Checks if a business has access to a specific feature.
 * @param {string} businessId 
 * @param {string} feature 
 */
export async function hasFeature(businessId, feature) {
  const { planKey, status, config } = await getBusinessPlan(businessId);
  
  if (status === 'EXPIRED') {
    return false; // Subscriptions that are expired lose access
  }

  return config.features.includes(feature.toUpperCase());
}

/**
 * Gets the resource usage for a business.
 * @param {string} businessId 
 * @param {string} limitType 'products' | 'staff' | 'locations' | 'sales'
 */
export async function getUsage(businessId, limitType) {
  const type = limitType.toLowerCase();

  switch (type) {
    case 'products':
      return await db.product.count({ where: { businessId, isActive: true } });
    case 'staff':
      return await db.user.count({ where: { businessId } });
    case 'locations':
      // The current schema treats Business as tenant, and locations could be sub-entities.
      // If we don't have separate location tables yet, mock to 1 or count distinct categories/users
      return 1;
    case 'sales':
      // Count current month sales
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return await db.sale.count({
        where: {
          businessId,
          createdAt: { gte: startOfMonth }
        }
      });
    default:
      return 0;
  }
}

/**
 * Checks if a business can create another resource.
 * @param {string} businessId 
 * @param {string} limitType 'products' | 'staff' | 'locations' | 'sales'
 * @param {number} pendingAddition count to add
 */
export async function canCreate(businessId, limitType, pendingAddition = 1) {
  const { planKey, status, config } = await getBusinessPlan(businessId);
  
  if (status === 'EXPIRED') {
    return false;
  }

  const limit = config.limits[limitType.toLowerCase()];
  if (limit === undefined) return true;

  const currentUsage = await getUsage(businessId, limitType);
  return (currentUsage + pendingAddition) <= limit;
}
