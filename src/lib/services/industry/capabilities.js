/**
 * Pre-defined capability configurations for different retail business types.
 */
export const INDUSTRY_PROFILES = {
  GROCERY: {
    capabilities: ['expiryTracking', 'batchTracking', 'weightedProducts'],
    customFields: [
      { name: 'rack_location', label: 'Rack Location', type: 'TEXT' },
      { name: 'organic', label: 'Organic Certified', type: 'BOOLEAN' }
    ]
  },
  KIRANA: {
    capabilities: ['expiryTracking', 'batchTracking', 'weightedProducts'],
    customFields: [
      { name: 'rack_number', label: 'Rack Number', type: 'TEXT' }
    ]
  },
  CLOTHING: {
    capabilities: ['variants'],
    customFields: [
      { name: 'season', label: 'Season', type: 'SELECT', options: ['Summer', 'Winter', 'Monsoon', 'All-Year'] },
      { name: 'material', label: 'Material Fabric', type: 'TEXT' }
    ]
  },
  ELECTRONICS: {
    capabilities: ['serialTracking', 'warranty'],
    customFields: [
      { name: 'warranty_months', label: 'Warranty Duration (Months)', type: 'NUMBER' },
      { name: 'model_number', label: 'Model Number', type: 'TEXT' }
    ]
  },
  STATIONERY: {
    capabilities: ['weightedProducts'], // pack conversions handled in logic
    customFields: [
      { name: 'manufacturer', label: 'Manufacturer', type: 'TEXT' }
    ]
  },
  HARDWARE: {
    capabilities: ['weightedProducts'],
    customFields: [
      { name: 'grade', label: 'Material Grade', type: 'TEXT' },
      { name: 'measured_unit', label: 'Measured Dimension Unit', type: 'SELECT', options: ['kg', 'meter', 'liter', 'piece', 'roll', 'bundle'] }
    ]
  },
  WHOLESALE: {
    capabilities: ['bulkPricing', 'creditLimits'],
    customFields: [
      { name: 'credit_limit', label: 'Max Outstanding Credit Amount', type: 'NUMBER' },
      { name: 'price_list_name', label: 'Active Price List Label', type: 'TEXT' }
    ]
  },
  GENERAL_RETAIL: {
    capabilities: [],
    customFields: []
  }
};

/**
 * Checks if a capability is enabled for a business.
 * @param {object} business 
 * @param {string} capability 
 */
export function isCapabilityEnabled(business, capability) {
  if (!business || !business.capabilities) return false;
  
  const { profile, activeCapabilities = [] } = business.capabilities;
  
  // Direct check in customized capabilities
  if (activeCapabilities.includes(capability)) return true;
  
  // Fallback to industry profile defaults
  const profileConfig = INDUSTRY_PROFILES[profile];
  return profileConfig?.capabilities.includes(capability) || false;
}

/**
 * Gets custom fields definitions for a business based on its profile.
 * @param {object} business 
 */
export function getCustomFieldDefinitions(business) {
  if (!business) return [];
  
  // Custom fields defined at business level override profile defaults
  if (business.customFields && Array.isArray(business.customFields)) {
    return business.customFields;
  }
  
  const profile = business.capabilities?.profile || 'GENERAL_RETAIL';
  return INDUSTRY_PROFILES[profile]?.customFields || [];
}

/**
 * Parses and validates custom fields key-values on a product/customer.
 * @param {object} payload input data
 * @param {array} definitions custom field definitions
 * @returns {object} cleaned key-value object to store in customData Json
 */
export function parseCustomFields(payload, definitions) {
  const result = {};
  for (const def of definitions) {
    const value = payload[def.name];
    if (value === undefined || value === null) continue;

    switch (def.type) {
      case 'NUMBER':
        result[def.name] = parseFloat(value);
        break;
      case 'BOOLEAN':
        result[def.name] = Boolean(value);
        break;
      case 'SELECT':
        if (def.options && def.options.includes(value)) {
          result[def.name] = value;
        }
        break;
      case 'MULTI_SELECT':
        if (Array.isArray(value)) {
          result[def.name] = value.filter(val => def.options?.includes(val));
        }
        break;
      case 'DATE':
        result[def.name] = new Date(value).toISOString().substring(0, 10);
        break;
      case 'TEXT':
      default:
        result[def.name] = String(value);
    }
  }
  return result;
}
