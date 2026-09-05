import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const registerSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  brand: z.string().optional().nullable(),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  unit: z.string().default('piece'),
  imageUrl: z.string().optional().nullable().or(z.literal('')),
  
  // Decimals parsed as numbers for validation
  purchasePrice: z.coerce.number().nonnegative('Purchase price cannot be negative'),
  sellingPrice: z.coerce.number().nonnegative('Selling price cannot be negative'),
  taxRate: z.coerce.number().nonnegative('Tax rate cannot be negative').default(0),
  
  // Stock setups
  openingStock: z.coerce.number().int().nonnegative('Opening stock cannot be negative').default(0),
  lowStockThreshold: z.coerce.number().int().nonnegative('Threshold cannot be negative').default(10),
  reorderQuantity: z.coerce.number().int().nonnegative('Reorder quantity cannot be negative').default(20),
});

export const productEditSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  brand: z.string().optional().nullable(),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  unit: z.string().default('piece'),
  imageUrl: z.string().optional().nullable().or(z.literal('')),
  isActive: z.boolean().default(true),
  
  purchasePrice: z.coerce.number().nonnegative('Purchase price cannot be negative'),
  sellingPrice: z.coerce.number().nonnegative('Selling price cannot be negative'),
  taxRate: z.coerce.number().nonnegative('Tax rate cannot be negative').default(0),
  
  lowStockThreshold: z.coerce.number().int().nonnegative('Threshold cannot be negative').default(10),
  reorderQuantity: z.coerce.number().int().nonnegative('Reorder quantity cannot be negative').default(20),
});

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  action: z.enum(['INCREASE', 'DECREASE', 'SET']),
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
  reason: z.enum(['PURCHASE', 'DAMAGE', 'LOSS', 'ADJUSTMENT', 'OPENING_STOCK', 'SALE_RETURN', 'OTHER']),
  note: z.string().min(1, 'Note or explanation is required'),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional().nullable(),
});

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().optional().nullable().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable().or(z.literal('')),
});

export const saleItemInputSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.coerce.number().int().positive('Quantity must be at least 1'),
  discountAmount: z.coerce.number().nonnegative('Discount cannot be negative').default(0),
});

export const salePaymentInputSchema = z.object({
  method: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CREDIT', 'OTHER']),
  amount: z.coerce.number().positive('Payment amount must be greater than 0'),
  reference: z.string().optional().nullable(),
});

export const checkoutSchema = z.object({
  customerId: z.string().optional().nullable(),
  discountAmount: z.coerce.number().nonnegative('Discount cannot be negative').default(0),
  items: z.array(saleItemInputSchema).min(1, 'At least one item is required in the cart'),
  payments: z.array(salePaymentInputSchema).min(1, 'At least one payment method is required'),
});

export const saleReturnItemInputSchema = z.object({
  saleItemId: z.string().min(1, 'Sale item ID is required'),
  quantity: z.coerce.number().int().positive('Return quantity must be at least 1'),
});

export const saleReturnSchema = z.object({
  refundMethod: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CREDIT', 'OTHER']),
  note: z.string().optional().nullable(),
  items: z.array(saleReturnItemInputSchema).min(1, 'At least one item must be returned'),
});

export const businessSettingsSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  legalName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
});

export const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  companyName: z.string().optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable().or(z.literal('')),
  email: z.string().optional().nullable().or(z.literal('')),
  taxNumber: z.string().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable().or(z.literal('')),
});

export const purchaseOrderItemInputSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  orderedQuantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
  unitCost: z.coerce.number().positive('Unit cost must be greater than 0'),
  discountAmount: z.coerce.number().nonnegative('Discount cannot be negative').default(0),
  taxRate: z.coerce.number().nonnegative('Tax rate cannot be negative').default(0),
});

export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  supplierInvoiceNumber: z.string().optional().nullable().or(z.literal('')),
  expectedDate: z.string().optional().nullable().or(z.literal('')),
  purchaseDate: z.string().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable().or(z.literal('')),
  discountAmount: z.coerce.number().nonnegative('Discount cannot be negative').default(0),
  items: z.array(purchaseOrderItemInputSchema).min(1, 'At least one item is required'),
});

export const supplierPaymentInputSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  purchaseOrderId: z.string().optional().nullable().or(z.literal('')),
  amount: z.coerce.number().positive('Payment amount must be greater than 0'),
  method: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER']),
  reference: z.string().optional().nullable().or(z.literal('')),
  note: z.string().optional().nullable().or(z.literal('')),
});

export const purchaseReceiveItemInputSchema = z.object({
  purchaseOrderItemId: z.string().min(1, 'Item ID is required'),
  receiveNow: z.coerce.number().int().nonnegative('Received quantity cannot be negative'),
});

export const purchaseReceiveSchema = z.object({
  items: z.array(purchaseReceiveItemInputSchema).min(1, 'At least one item is required'),
});


