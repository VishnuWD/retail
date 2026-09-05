/**
 * Safe, deterministic rule engine evaluator.
 * Evaluates conditions on an object without invoking arbitrary code execution.
 */

/**
 * Checks if a payload object satisfies the specified conditions list.
 * @param {object} payload 
 * @param {object} conditions e.g. { field: "totalAmount", op: "gt", value: 10000 } or { OR: [...] }
 */
export function evaluateConditions(payload, conditions) {
  if (!conditions) return true;

  try {
    const { field, op, value } = conditions;

    if (field && op) {
      const payloadValue = payload[field];
      if (payloadValue === undefined) return false;

      switch (op) {
        case 'eq':
          return payloadValue === value;
        case 'neq':
          return payloadValue !== value;
        case 'gt':
          return payloadValue > value;
        case 'gte':
          return payloadValue >= value;
        case 'lt':
          return payloadValue < value;
        case 'lte':
          return payloadValue <= value;
        case 'contains':
          return typeof payloadValue === 'string' && payloadValue.toLowerCase().includes(String(value).toLowerCase());
        default:
          return false;
      }
    }

    // Support compound OR conditions
    if (Array.isArray(conditions.OR)) {
      return conditions.OR.some(c => evaluateConditions(payload, c));
    }

    // Support compound AND conditions
    if (Array.isArray(conditions.AND)) {
      return conditions.AND.every(c => evaluateConditions(payload, c));
    }

    return true;
  } catch (error) {
    console.error('[Rule Engine] Error evaluating conditions:', error);
    return false;
  }
}
