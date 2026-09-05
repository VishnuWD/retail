// Kirana Local Storage Engine & Seed Database
// Full client-side persistence for Kirana Retail Store with dual-mode support

const STORAGE_KEYS = {
  MODE: 'kirana_storage_mode', // 'local' | 'cloud'
  SESSION: 'kirana_active_session',
  BUSINESS: 'kirana_business_data',
  CATEGORIES: 'kirana_categories',
  PRODUCTS: 'kirana_products',
  INVENTORY: 'kirana_inventory',
  INVENTORY_TRANSACTIONS: 'kirana_inventory_transactions',
  CUSTOMERS: 'kirana_customers',
  CUSTOMER_LEDGERS: 'kirana_customer_ledgers',
  SALES: 'kirana_sales',
  SUPPLIERS: 'kirana_suppliers',
  PURCHASE_ORDERS: 'kirana_purchases',
  EXPENSES: 'kirana_expenses',
  AUDIT_LOGS: 'kirana_audit_logs',
  STAFF: 'kirana_staff_members',
  SETTINGS: 'kirana_store_settings',
  INITIALIZED: 'kirana_initialized_v2'
};

// Initial Seed Dataset for Kirana Retail Store
export const INITIAL_SEED_DATA = {
  business: {
    id: 'biz_greenmart_001',
    name: 'Green Mart Kirana & Superstore',
    legalName: 'Green Mart Retail LLP',
    phone: '+91 98765 43210',
    email: 'contact@greenmart.in',
    address: 'Shop 12-14, Ground Floor, Central Market, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    currency: 'INR',
    taxNumber: '29ABCDE1234F1Z5',
    upiId: 'greenmart@upi',
    receiptFooter: 'Thank you for shopping with Green Mart! Visit again. Call +91 98765 43210 for free home delivery.',
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date().toISOString()
  },
  session: {
    userId: 'usr_owner_001',
    name: 'Ramesh Sharma',
    email: 'ramesh@greenmart.in',
    role: 'OWNER',
    businessId: 'biz_greenmart_001',
    token: 'local_token_owner_ramesh'
  },
  categories: [
    { id: 'cat_staples', name: 'Staples & Atta', description: 'Grains, flours, pulses, rice and cooking essentials', isActive: true },
    { id: 'cat_dairy', name: 'Dairy, Bread & Eggs', description: 'Fresh milk, curd, paneer, butter and bakery goods', isActive: true },
    { id: 'cat_snacks', name: 'Snacks & Munchies', description: 'Biscuits, chips, namkeen and sweet confectionaries', isActive: true },
    { id: 'cat_beverages', name: 'Beverages & Tea', description: 'Tea, coffee, health drinks, syrups and soft drinks', isActive: true },
    { id: 'cat_spices', name: 'Spices & Masalas', description: 'Whole spices, powdered masalas, salt and seasonings', isActive: true },
    { id: 'cat_cleaning', name: 'Household & Cleaning', description: 'Detergents, soaps, surface cleaners and dishwashers', isActive: true },
    { id: 'cat_personal', name: 'Personal Care', description: 'Soaps, shampoos, oral care and skin care products', isActive: true },
    { id: 'cat_instant', name: 'Instant Foods & Noodles', description: 'Maggi, pastas, ready mixes and soups', isActive: true }
  ],
  products: [
    {
      id: 'prod_001',
      name: 'Aashirvaad Superior MP Shudh Chakki Atta 5kg',
      brand: 'Aashirvaad',
      categoryId: 'cat_staples',
      sku: 'AASH-ATTA-5KG',
      barcode: '8901030382901',
      unit: 'kg',
      purchasePrice: 220,
      sellingPrice: 265,
      taxRate: 0,
      imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&auto=format&fit=crop&q=60',
      isActive: true,
      description: '100% pure whole wheat flour processed with traditional chakki process',
      inventory: { quantity: 45, lowStockThreshold: 10, reorderQuantity: 30 }
    },
    {
      id: 'prod_002',
      name: 'Tata Salt Vaccum Evaporated Iodised 1kg',
      brand: 'Tata Salt',
      categoryId: 'cat_spices',
      sku: 'TATA-SALT-1KG',
      barcode: '8904043901005',
      unit: 'packet',
      purchasePrice: 22,
      sellingPrice: 28,
      taxRate: 0,
      imageUrl: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=300&auto=format&fit=crop&q=60',
      isActive: true,
      description: 'Desh Ka Namak - vacuum evaporated iodized salt',
      inventory: { quantity: 120, lowStockThreshold: 25, reorderQuantity: 60 }
    },
    {
      id: 'prod_003',
      name: 'Fortune Sunlite Refined Sunflower Oil 1L Pouch',
      brand: 'Fortune',
      categoryId: 'cat_staples',
      sku: 'FORT-OIL-1L',
      barcode: '8906007281023',
      unit: 'litre',
      purchasePrice: 118,
      sellingPrice: 142,
      taxRate: 5,
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&auto=format&fit=crop&q=60',
      isActive: true,
      description: 'Light and healthy refined sunflower oil enriched with vitamins',
      inventory: { quantity: 38, lowStockThreshold: 12, reorderQuantity: 24 }
    },
    {
      id: 'prod_004',
      name: 'Amul Butter Pasteurised 500g',
      brand: 'Amul',
      categoryId: 'cat_dairy',
      sku: 'AMUL-BTR-500G',
      barcode: '8901262010057',
      unit: 'piece',
      purchasePrice: 235,
      sellingPrice: 275,
      taxRate: 12,
      imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&auto=format&fit=crop&q=60',
      isActive: true,
      description: 'Utterly Butterly Delicious pasteurised salted butter',
      inventory: { quantity: 24, lowStockThreshold: 8, reorderQuantity: 20 }
    },
    {
      id: 'prod_005',
      name: 'Amul Taaza Homogenised Toned Milk 1L Tetra',
      brand: 'Amul',
      categoryId: 'cat_dairy',
      sku: 'AMUL-TAAZA-1L',
      barcode: '8901262010187',
      unit: 'pack',
      purchasePrice: 62,
      sellingPrice: 72,
      taxRate: 0,
      imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&auto=format&fit=crop&q=60',
      isActive: true,
      description: 'Long life fresh toned milk in aseptic packaging',
      inventory: { quantity: 50, lowStockThreshold: 15, reorderQuantity: 30 }
    },
    {
      id: 'prod_006',
      name: 'Maggi 2-Minute Masala Instant Noodles 4-Pack 280g',
      brand: 'Nestle Maggi',
      categoryId: 'cat_instant',
      sku: 'MAGG-4PK-280G',
      barcode: '8901058852302',
      unit: 'pack',
      purchasePrice: 48,
      sellingPrice: 58,
      taxRate: 12,
      imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300&auto=format&fit=crop&q=60',
      isActive: true,
      description: 'India’s favorite instant noodle with authentic taste maker',
      inventory: { quantity: 64, lowStockThreshold: 15, reorderQuantity: 40 }
    },
    {
      id: 'prod_007',
      name: 'Tata Tea Gold Rich & Aromatic 500g',
      brand: 'Tata Tea',
      categoryId: 'cat_beverages',
      sku: 'TATA-GOLD-500G',
      barcode: '8901052003885',
      unit: 'pack',
      purchasePrice: 280,
      sellingPrice: 330,
      taxRate: 5,
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=300&auto=format&fit=crop&q=60',
      isActive: true,
      description: 'Exquisite blend of Assam CTC teas and 15% gently rolled long leaves',
      inventory: { quantity: 28, lowStockThreshold: 8, reorderQuantity: 20 }
    },
    {
      id: 'prod_008',
      name: 'Parle-G Original Glucose Biscuits 800g Family Pack',
      brand: 'Parle',
      categoryId: 'cat_snacks',
      sku: 'PARL-G-800G',
      barcode: '8901719101037',
      unit: 'pack',
      purchasePrice: 70,
      sellingPrice: 85,
      taxRate: 18,
      imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&auto=format&fit=crop&q=60',
      isActive: true,
      description: 'World’s largest selling glucose biscuit packed with energy',
      inventory: { quantity: 80, lowStockThreshold: 20, reorderQuantity: 50 }
    },
    {
      id: 'prod_009',
      name: 'Surf Excel Quick Wash Detergent Powder 1kg',
      brand: 'Surf Excel',
      categoryId: 'cat_cleaning',
      sku: 'SURF-QW-1KG',
      barcode: '8901030704413',
      unit: 'packet',
      purchasePrice: 185,
      sellingPrice: 220,
      taxRate: 18,
      imageUrl: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=300&auto=format&fit=crop&q=60',
      isActive: true,
      description: 'Tough stain removal in just one wash with X-tra clean particles',
      inventory: { quantity: 18, lowStockThreshold: 10, reorderQuantity: 20 }
    },
    {
      id: 'prod_010',
      name: 'Dettol Original Germ Protection Bathing Soap 125g (Buy 4 Get 1)',
      brand: 'Dettol',
      categoryId: 'cat_personal',
      sku: 'DETT-SOAP-5PK',
      barcode: '8901396112009',
      unit: 'pack',
      purchasePrice: 195,
      sellingPrice: 240,
      taxRate: 18,
      imageUrl: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=300&auto=format&fit=crop&q=60',
      isActive: true,
      description: 'Trusted 99.9% germ protection soap with soothing pine fragrance',
      inventory: { quantity: 32, lowStockThreshold: 10, reorderQuantity: 25 }
    },
    {
      id: 'prod_011',
      name: 'Daawat Rozana Gold Basmati Rice 5kg',
      brand: 'Daawat',
      categoryId: 'cat_staples',
      sku: 'DAAW-BAS-5KG',
      barcode: '8901537002015',
      unit: 'kg',
      purchasePrice: 380,
      sellingPrice: 460,
      taxRate: 0,
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=60',
      isActive: true,
      description: 'Fluffy long grain basmati rice perfect for daily pulao and biryani',
      inventory: { quantity: 6, lowStockThreshold: 10, reorderQuantity: 20 }
    },
    {
      id: 'prod_012',
      name: 'Haldirams Nagpur Aloo Bhujia 400g',
      brand: 'Haldirams',
      categoryId: 'cat_snacks',
      sku: 'HALD-BHUJ-400G',
      barcode: '8904063200157',
      unit: 'pack',
      purchasePrice: 95,
      sellingPrice: 115,
      taxRate: 12,
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&auto=format&fit=crop&q=60',
      isActive: true,
      description: 'Crispy crunchy spicy potato noodles snack',
      inventory: { quantity: 5, lowStockThreshold: 10, reorderQuantity: 30 }
    },
    {
      id: 'prod_013',
      name: 'Cadbury Dairy Milk Silk Chocolate 150g',
      brand: 'Cadbury',
      categoryId: 'cat_snacks',
      sku: 'CADB-SILK-150G',
      barcode: '8901233020087',
      unit: 'piece',
      purchasePrice: 140,
      sellingPrice: 175,
      taxRate: 18,
      imageUrl: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=300&auto=format&fit=crop&q=60',
      isActive: true,
      description: 'Smooth, creamy, and velvety melt-in-mouth milk chocolate',
      inventory: { quantity: 42, lowStockThreshold: 12, reorderQuantity: 30 }
    },
    {
      id: 'prod_014',
      name: 'Colgate Strong Teeth Toothpaste 300g (Saver Pack)',
      brand: 'Colgate',
      categoryId: 'cat_personal',
      sku: 'COLG-ST-300G',
      barcode: '8901314010196',
      unit: 'piece',
      purchasePrice: 155,
      sellingPrice: 190,
      taxRate: 18,
      imageUrl: 'https://images.unsplash.com/photo-1559591937-e1032338d386?w=300&auto=format&fit=crop&q=60',
      isActive: true,
      description: 'Amino Shakti formula adds natural calcium for 2x stronger teeth',
      inventory: { quantity: 3, lowStockThreshold: 8, reorderQuantity: 20 }
    },
    {
      id: 'prod_015',
      name: 'Catch Super Garam Masala 100g Box',
      brand: 'Catch',
      categoryId: 'cat_spices',
      sku: 'CATC-GM-100G',
      barcode: '8901192102034',
      unit: 'box',
      purchasePrice: 65,
      sellingPrice: 82,
      taxRate: 5,
      imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&auto=format&fit=crop&q=60',
      isActive: true,
      description: 'Low temperature grinding technology preserves natural spice aroma',
      inventory: { quantity: 22, lowStockThreshold: 10, reorderQuantity: 25 }
    },
    {
      id: 'prod_016',
      name: 'Vim Dishwash Gel Lemon 750ml Bottle',
      brand: 'Vim',
      categoryId: 'cat_cleaning',
      sku: 'VIM-GEL-750ML',
      barcode: '8901030805127',
      unit: 'bottle',
      purchasePrice: 165,
      sellingPrice: 205,
      taxRate: 18,
      imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=300&auto=format&fit=crop&q=60',
      isActive: true,
      description: '1 spoon of Vim gel cleans a sink-full of utensils with real lemon power',
      inventory: { quantity: 26, lowStockThreshold: 8, reorderQuantity: 20 }
    }
  ],
  customers: [
    {
      id: 'cust_001',
      name: 'Suresh Kumar',
      phone: '9845012345',
      email: 'suresh.k@gmail.com',
      address: 'Flat 302, Green Orchid Apts, 2nd Cross, Indiranagar',
      outstandingCredit: 1450.00,
      createdAt: new Date('2026-01-10').toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cust_002',
      name: 'Priya Verma',
      phone: '9876541230',
      email: 'priya.v@yahoo.com',
      address: '#45, 7th Main Road, Near BDA Complex',
      outstandingCredit: 0.00,
      createdAt: new Date('2026-01-15').toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cust_003',
      name: 'Rajesh Nair',
      phone: '9900112233',
      email: 'nair.rajesh@outlook.com',
      address: 'House 18, 4th Cross, Teachers Colony',
      outstandingCredit: 2850.50,
      createdAt: new Date('2026-01-20').toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cust_004',
      name: 'Sunita Patel',
      phone: '9741234567',
      email: 'sunita.patel@gmail.com',
      address: 'Plot 89, defence colony, 100ft road',
      outstandingCredit: 420.00,
      createdAt: new Date('2026-02-01').toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cust_005',
      name: 'Amitabh Sengupta',
      phone: '9123456789',
      email: 'amitabh.s@gmail.com',
      address: 'Apt 104, Sunrise Enclave, Old Airport Rd',
      outstandingCredit: 0.00,
      createdAt: new Date('2026-02-10').toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  customerLedgers: [
    {
      id: 'ledg_001',
      customerId: 'cust_001',
      type: 'CREDIT',
      amount: 1950.00,
      balanceAfter: 1950.00,
      referenceType: 'SALE',
      referenceId: 'INV-2026-000101',
      note: 'Grocery items monthly credit purchase',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
    },
    {
      id: 'ledg_002',
      customerId: 'cust_001',
      type: 'PAYMENT',
      amount: 500.00,
      balanceAfter: 1450.00,
      referenceType: 'MANUAL',
      referenceId: 'UPI-REC-4892',
      note: 'Partial payment received via PhonePe UPI',
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 'ledg_003',
      customerId: 'cust_003',
      type: 'CREDIT',
      amount: 2850.50,
      balanceAfter: 2850.50,
      referenceType: 'SALE',
      referenceId: 'INV-2026-000104',
      note: 'Atta, Oil and Dairy products on khata',
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 'ledg_004',
      customerId: 'cust_004',
      type: 'CREDIT',
      amount: 420.00,
      balanceAfter: 420.00,
      referenceType: 'SALE',
      referenceId: 'INV-2026-000112',
      note: 'Evening snacks & household items',
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
    }
  ],
  sales: [
    {
      id: 'sale_001',
      invoiceNumber: 'INV-2026-000120',
      customerId: 'cust_002',
      customerName: 'Priya Verma',
      subtotal: 1045.00,
      discountAmount: 45.00,
      taxableAmount: 1000.00,
      taxAmount: 50.00,
      totalAmount: 1050.00,
      paidAmount: 1050.00,
      dueAmount: 0.00,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      paymentMethod: 'UPI',
      createdBy: 'Ramesh Sharma',
      createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
      items: [
        { productId: 'prod_001', name: 'Aashirvaad Superior MP Shudh Chakki Atta 5kg', quantity: 2, unitPrice: 265, discount: 20, lineTotal: 510 },
        { productId: 'prod_004', name: 'Amul Butter Pasteurised 500g', quantity: 1, unitPrice: 275, discount: 0, lineTotal: 275 },
        { productId: 'prod_007', name: 'Tata Tea Gold Rich & Aromatic 500g', quantity: 1, unitPrice: 330, discount: 25, lineTotal: 305 }
      ]
    },
    {
      id: 'sale_002',
      invoiceNumber: 'INV-2026-000121',
      customerId: 'cust_001',
      customerName: 'Suresh Kumar',
      subtotal: 780.00,
      discountAmount: 0.00,
      taxableAmount: 780.00,
      taxAmount: 28.00,
      totalAmount: 808.00,
      paidAmount: 808.00,
      dueAmount: 0.00,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      paymentMethod: 'CASH',
      createdBy: 'Ramesh Sharma',
      createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
      items: [
        { productId: 'prod_003', name: 'Fortune Sunlite Refined Sunflower Oil 1L Pouch', quantity: 3, unitPrice: 142, discount: 0, lineTotal: 426 },
        { productId: 'prod_006', name: 'Maggi 2-Minute Masala Instant Noodles 4-Pack 280g', quantity: 4, unitPrice: 58, discount: 0, lineTotal: 232 },
        { productId: 'prod_013', name: 'Cadbury Dairy Milk Silk Chocolate 150g', quantity: 1, unitPrice: 175, discount: 0, lineTotal: 175 }
      ]
    },
    {
      id: 'sale_003',
      invoiceNumber: 'INV-2026-000122',
      customerId: 'cust_004',
      customerName: 'Sunita Patel',
      subtotal: 420.00,
      discountAmount: 0.00,
      taxableAmount: 420.00,
      taxAmount: 0.00,
      totalAmount: 420.00,
      paidAmount: 0.00,
      dueAmount: 420.00,
      status: 'COMPLETED',
      paymentStatus: 'UNPAID',
      paymentMethod: 'CREDIT',
      createdBy: 'Ramesh Sharma',
      createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
      items: [
        { productId: 'prod_008', name: 'Parle-G Original Glucose Biscuits 800g Family Pack', quantity: 2, unitPrice: 85, discount: 0, lineTotal: 170 },
        { productId: 'prod_010', name: 'Dettol Original Germ Protection Bathing Soap 125g', quantity: 1, unitPrice: 240, discount: 0, lineTotal: 240 }
      ]
    },
    {
      id: 'sale_004',
      invoiceNumber: 'INV-2026-000123',
      customerId: null,
      customerName: 'Walk-in Cash Customer',
      subtotal: 580.00,
      discountAmount: 0.00,
      taxableAmount: 580.00,
      taxAmount: 25.00,
      totalAmount: 605.00,
      paidAmount: 605.00,
      dueAmount: 0.00,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      paymentMethod: 'UPI',
      createdBy: 'Suresh (Cashier)',
      createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
      items: [
        { productId: 'prod_002', name: 'Tata Salt Vaccum Evaporated Iodised 1kg', quantity: 2, unitPrice: 28, discount: 0, lineTotal: 56 },
        { productId: 'prod_005', name: 'Amul Taaza Homogenised Toned Milk 1L Tetra', quantity: 4, unitPrice: 72, discount: 0, lineTotal: 288 },
        { productId: 'prod_016', name: 'Vim Dishwash Gel Lemon 750ml Bottle', quantity: 1, unitPrice: 205, discount: 0, lineTotal: 205 }
      ]
    }
  ],
  suppliers: [
    {
      id: 'sup_001',
      name: 'National FMCG Distributors',
      companyName: 'National FMCG Agencies Pvt Ltd',
      phone: '9820011223',
      email: 'orders@nationalfmcg.com',
      address: 'Godown 4, APMC Yard, Yeshwanthpur, Bengaluru',
      taxNumber: '29AAACN1234F1Z8',
      balance: 14200.00,
      isActive: true
    },
    {
      id: 'sup_002',
      name: 'Amul Dairy Supply Agency',
      companyName: 'Gujarat Co-operative Milk Marketing Federation',
      phone: '9844055667',
      email: 'amul.blr@amul.coop',
      address: 'Dairy Circle, Bannerghatta Road, Bengaluru',
      taxNumber: '29AAACG5678H1Z2',
      balance: 4500.00,
      isActive: true
    },
    {
      id: 'sup_003',
      name: 'Sri Krishna Grain Millers',
      companyName: 'Sri Krishna Agro Traders',
      phone: '9880099887',
      email: 'krishna.grains@gmail.com',
      address: 'Grain Market Yard, APMC, Bengaluru',
      taxNumber: '29ABCDE9876P1Z3',
      balance: 0.00,
      isActive: true
    }
  ],
  purchases: [
    {
      id: 'po_001',
      purchaseOrderNumber: 'PO-2026-00045',
      supplierId: 'sup_001',
      supplierName: 'National FMCG Distributors',
      status: 'RECEIVED',
      paymentStatus: 'PAID',
      subtotal: 18500.00,
      taxAmount: 925.00,
      totalAmount: 19425.00,
      paidAmount: 19425.00,
      dueAmount: 0.00,
      purchaseDate: new Date(Date.now() - 7 * 86400000).toISOString(),
      items: [
        { productId: 'prod_006', name: 'Maggi 2-Minute Masala Instant Noodles 4-Pack', quantity: 100, unitCost: 48, lineTotal: 4800 },
        { productId: 'prod_008', name: 'Parle-G Original Glucose Biscuits 800g', quantity: 100, unitCost: 70, lineTotal: 7000 },
        { productId: 'prod_009', name: 'Surf Excel Quick Wash Detergent Powder 1kg', quantity: 36, unitCost: 185, lineTotal: 6660 }
      ]
    },
    {
      id: 'po_002',
      purchaseOrderNumber: 'PO-2026-00046',
      supplierId: 'sup_002',
      supplierName: 'Amul Dairy Supply Agency',
      status: 'RECEIVED',
      paymentStatus: 'PARTIALLY_PAID',
      subtotal: 9800.00,
      taxAmount: 490.00,
      totalAmount: 10290.00,
      paidAmount: 5790.00,
      dueAmount: 4500.00,
      purchaseDate: new Date(Date.now() - 2 * 86400000).toISOString(),
      items: [
        { productId: 'prod_004', name: 'Amul Butter Pasteurised 500g', quantity: 30, unitCost: 235, lineTotal: 7050 },
        { productId: 'prod_005', name: 'Amul Taaza Homogenised Toned Milk 1L Tetra', quantity: 44, unitCost: 62, lineTotal: 2728 }
      ]
    }
  ],
  expenses: [
    {
      id: 'exp_001',
      title: 'Shop Commercial Rent',
      category: 'Rent & Lease',
      amount: 25000.00,
      paymentMethod: 'BANK_TRANSFER',
      date: new Date(Date.now() - 5 * 86400000).toISOString(),
      note: 'Monthly shop premises rent paid to landlord'
    },
    {
      id: 'exp_002',
      title: 'BESCOM Electricity Bill',
      category: 'Utilities',
      amount: 4320.00,
      paymentMethod: 'UPI',
      date: new Date(Date.now() - 3 * 86400000).toISOString(),
      note: 'Shop deep freezers and lighting power consumption'
    },
    {
      id: 'exp_003',
      title: 'Delivery Staff Daily Fuel & Allowance',
      category: 'Logistics',
      amount: 850.00,
      paymentMethod: 'CASH',
      date: new Date().toISOString(),
      note: 'Local grocery home delivery vehicle fuel'
    }
  ],
  auditLogs: [
    {
      id: 'log_001',
      action: 'STOCK_RESTOCKED',
      productName: 'Aashirvaad Superior MP Shudh Chakki Atta 5kg',
      qty: 30,
      user: 'Ramesh Sharma',
      time: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'log_002',
      action: 'POS_CHECKOUT',
      productName: 'Amul Butter Pasteurised 500g',
      qty: -2,
      user: 'Ramesh Sharma',
      time: new Date(Date.now() - 2 * 3600000).toISOString()
    },
    {
      id: 'log_003',
      action: 'KHATA_PAYMENT',
      productName: 'Suresh Kumar (Received ₹500 via UPI)',
      qty: 0,
      user: 'Ramesh Sharma',
      time: new Date(Date.now() - 4 * 3600000).toISOString()
    }
  ],
  staff: [
    { id: '1', name: 'Ramesh Sharma', email: 'ramesh@greenmart.in', role: 'OWNER', createdAt: '2026-01-01T00:00:00.000Z' },
    { id: '2', name: 'Priya Verma', email: 'priya@greenmart.in', role: 'MANAGER', createdAt: '2026-01-05T00:00:00.000Z' },
    { id: '3', name: 'Suresh Kumar', email: 'suresh@greenmart.in', role: 'CASHIER', createdAt: '2026-01-10T00:00:00.000Z' }
  ]
};

// Storage Adapter Class
class KiranaStorageEngine {
  constructor() {
    this.isBrowser = typeof window !== 'undefined';
  }

  // Safe read from LocalStorage
  getItem(key, defaultValue = null) {
    if (!this.isBrowser) return defaultValue;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (err) {
      console.error(`Error reading ${key} from storage:`, err);
      return defaultValue;
    }
  }

  // Safe write to LocalStorage
  setItem(key, value) {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Dispatch custom event for real-time reactivity across components
      window.dispatchEvent(new CustomEvent('kirana_storage_updated', { detail: { key } }));
    } catch (err) {
      console.error(`Error writing ${key} to storage:`, err);
    }
  }

  // Check and initialize default dataset
  init() {
    if (!this.isBrowser) return;
    
    // Check if initialized or missing products
    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    const existingProducts = this.getItem(STORAGE_KEYS.PRODUCTS);
    
    if (!initialized || !existingProducts || existingProducts.length === 0) {
      this.resetToDefault();
    }
  }

  // Reset entire database to default seed
  resetToDefault() {
    if (!this.isBrowser) return;
    this.setItem(STORAGE_KEYS.MODE, 'local');
    this.setItem(STORAGE_KEYS.SESSION, INITIAL_SEED_DATA.session);
    this.setItem(STORAGE_KEYS.BUSINESS, INITIAL_SEED_DATA.business);
    this.setItem(STORAGE_KEYS.CATEGORIES, INITIAL_SEED_DATA.categories);
    this.setItem(STORAGE_KEYS.PRODUCTS, INITIAL_SEED_DATA.products);
    this.setItem(STORAGE_KEYS.CUSTOMERS, INITIAL_SEED_DATA.customers);
    this.setItem(STORAGE_KEYS.CUSTOMER_LEDGERS, INITIAL_SEED_DATA.customerLedgers);
    this.setItem(STORAGE_KEYS.SALES, INITIAL_SEED_DATA.sales);
    this.setItem(STORAGE_KEYS.SUPPLIERS, INITIAL_SEED_DATA.suppliers);
    this.setItem(STORAGE_KEYS.PURCHASE_ORDERS, INITIAL_SEED_DATA.purchases);
    this.setItem(STORAGE_KEYS.EXPENSES, INITIAL_SEED_DATA.expenses);
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, INITIAL_SEED_DATA.auditLogs);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    console.log('✅ Kirana Local Storage initialized with realistic FMCG dataset');
  }

  // Get current storage mode ('local' | 'cloud')
  getMode() {
    return this.getItem(STORAGE_KEYS.MODE, 'local');
  }

  // Set storage mode
  setMode(mode) {
    this.setItem(STORAGE_KEYS.MODE, mode);
  }

  // Active Session
  getSession() {
    return this.getItem(STORAGE_KEYS.SESSION, INITIAL_SEED_DATA.session);
  }

  setSession(session) {
    this.setItem(STORAGE_KEYS.SESSION, session);
  }

  // Business Info
  getBusiness() {
    return this.getItem(STORAGE_KEYS.BUSINESS, INITIAL_SEED_DATA.business);
  }

  updateBusiness(updates) {
    const current = this.getBusiness();
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    this.setItem(STORAGE_KEYS.BUSINESS, updated);
    return updated;
  }

  // Products CRUD
  getProducts(filters = {}) {
    let list = this.getItem(STORAGE_KEYS.PRODUCTS, INITIAL_SEED_DATA.products);
    const categories = this.getCategories();
    const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

    // Join with category object
    list = list.map(p => ({
      ...p,
      category: catMap[p.categoryId] || { id: p.categoryId, name: 'General' }
    }));

    // Filter by search
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    // Filter by category
    if (filters.categoryId) {
      list = list.filter(p => p.categoryId === filters.categoryId);
    }

    // Filter by brand
    if (filters.brand) {
      const b = filters.brand.toLowerCase();
      list = list.filter(p => p.brand && p.brand.toLowerCase().includes(b));
    }

    // Filter by stock status
    if (filters.status) {
      list = list.filter(p => {
        const qty = p.inventory?.quantity || 0;
        const threshold = p.inventory?.lowStockThreshold || 10;
        if (filters.status === 'OUT_OF_STOCK') return qty <= 0;
        if (filters.status === 'LOW_STOCK') return qty > 0 && qty <= threshold;
        if (filters.status === 'IN_STOCK') return qty > threshold;
        if (filters.status === 'INACTIVE') return p.isActive === false;
        return true;
      });
    }

    // Sorting
    const sortField = filters.sort || 'name';
    const sortOrder = filters.order === 'desc' ? -1 : 1;

    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (sortField === 'stock') {
        valA = a.inventory?.quantity || 0;
        valB = b.inventory?.quantity || 0;
      }
      if (typeof valA === 'string') {
        return valA.localeCompare(valB) * sortOrder;
      }
      return ((valA || 0) - (valB || 0)) * sortOrder;
    });

    const total = list.length;
    const page = parseInt(filters.page || 1, 10);
    const limit = parseInt(filters.limit || 50, 10);
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      products: paginated,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1
      }
    };
  }

  getProductById(id) {
    const products = this.getItem(STORAGE_KEYS.PRODUCTS, INITIAL_SEED_DATA.products);
    const prod = products.find(p => p.id === id);
    if (!prod) return null;
    const categories = this.getCategories();
    const cat = categories.find(c => c.id === prod.categoryId) || { id: prod.categoryId, name: 'General' };
    return { ...prod, category: cat };
  }

  saveProduct(data) {
    const products = this.getItem(STORAGE_KEYS.PRODUCTS, INITIAL_SEED_DATA.products);
    let updated;
    
    if (data.id) {
      // Update
      updated = products.map(p => {
        if (p.id === data.id) {
          return {
            ...p,
            ...data,
            inventory: {
              ...p.inventory,
              ...(data.inventory || {}),
              quantity: data.openingStock !== undefined ? Number(data.openingStock) : (data.inventory?.quantity ?? p.inventory?.quantity ?? 0),
              lowStockThreshold: Number(data.lowStockThreshold ?? p.inventory?.lowStockThreshold ?? 10),
              reorderQuantity: Number(data.reorderQuantity ?? p.inventory?.reorderQuantity ?? 20)
            },
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      });
    } else {
      // Create
      const newProduct = {
        id: `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: data.name,
        brand: data.brand || '',
        categoryId: data.categoryId || 'cat_staples',
        sku: data.sku || `SKU-${Date.now().toString().slice(-6)}`,
        barcode: data.barcode || '',
        unit: data.unit || 'piece',
        purchasePrice: Number(data.purchasePrice || 0),
        sellingPrice: Number(data.sellingPrice || 0),
        taxRate: Number(data.taxRate || 0),
        imageUrl: data.imageUrl || '',
        description: data.description || '',
        isActive: data.isActive !== false,
        inventory: {
          quantity: Number(data.openingStock || data.inventory?.quantity || 0),
          lowStockThreshold: Number(data.lowStockThreshold || 10),
          reorderQuantity: Number(data.reorderQuantity || 20)
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      updated = [newProduct, ...products];

      // Add audit log
      this.addAuditLog('PRODUCT_CREATED', newProduct.name, newProduct.inventory.quantity);
    }

    this.setItem(STORAGE_KEYS.PRODUCTS, updated);
    return data.id ? this.getProductById(data.id) : updated[0];
  }

  deleteProduct(id) {
    const products = this.getItem(STORAGE_KEYS.PRODUCTS, INITIAL_SEED_DATA.products);
    const filtered = products.filter(p => p.id !== id);
    this.setItem(STORAGE_KEYS.PRODUCTS, filtered);
    return true;
  }

  // Categories CRUD
  getCategories() {
    return this.getItem(STORAGE_KEYS.CATEGORIES, INITIAL_SEED_DATA.categories);
  }

  saveCategory(data) {
    const categories = this.getCategories();
    let updated;
    if (data.id) {
      updated = categories.map(c => c.id === data.id ? { ...c, ...data } : c);
    } else {
      const newCat = {
        id: `cat_${Date.now()}`,
        name: data.name,
        description: data.description || '',
        isActive: true
      };
      updated = [...categories, newCat];
    }
    this.setItem(STORAGE_KEYS.CATEGORIES, updated);
    return updated;
  }

  // Inventory & Stock adjustments
  adjustStock(productId, deltaQty, reason = 'ADJUSTMENT', note = '') {
    const products = this.getItem(STORAGE_KEYS.PRODUCTS, INITIAL_SEED_DATA.products);
    let targetProd = null;

    const updated = products.map(p => {
      if (p.id === productId) {
        const currentQty = p.inventory?.quantity || 0;
        const newQty = Math.max(0, currentQty + deltaQty);
        targetProd = {
          ...p,
          inventory: {
            ...p.inventory,
            quantity: newQty
          }
        };
        return targetProd;
      }
      return p;
    });

    if (targetProd) {
      this.setItem(STORAGE_KEYS.PRODUCTS, updated);
      this.addAuditLog(reason, `${targetProd.name} (${note || reason})`, deltaQty);
    }

    return targetProd;
  }

  // Sales & POS Checkout
  createSale(saleData) {
    const sales = this.getItem(STORAGE_KEYS.SALES, INITIAL_SEED_DATA.sales);
    const invoiceNum = `INV-${new Date().getFullYear()}-${String(sales.length + 101).padStart(6, '0')}`;
    const session = this.getSession();

    const newSale = {
      id: `sale_${Date.now()}`,
      invoiceNumber: invoiceNum,
      customerId: saleData.customerId || null,
      customerName: saleData.customerName || (saleData.customerId ? 'Valued Customer' : 'Walk-in Customer'),
      subtotal: Number(saleData.subtotal || 0),
      discountAmount: Number(saleData.discountAmount || 0),
      taxableAmount: Number(saleData.taxableAmount || saleData.subtotal || 0),
      taxAmount: Number(saleData.taxAmount || 0),
      totalAmount: Number(saleData.totalAmount || 0),
      paidAmount: Number(saleData.paidAmount || 0),
      dueAmount: Number(saleData.dueAmount || 0),
      status: 'COMPLETED',
      paymentStatus: saleData.dueAmount > 0 ? (saleData.paidAmount > 0 ? 'PARTIAL' : 'UNPAID') : 'PAID',
      paymentMethod: saleData.paymentMethod || 'CASH',
      createdBy: session.name || 'Owner',
      createdAt: new Date().toISOString(),
      items: saleData.items || []
    };

    // 1. Deduct stock for sold items
    if (saleData.items && saleData.items.length > 0) {
      saleData.items.forEach(item => {
        if (item.productId) {
          this.adjustStock(item.productId, -Math.abs(item.quantity || 1), 'SALE', `Invoice #${invoiceNum}`);
        }
      });
    }

    // 2. If Khata/Credit was used or customer has due amount, update customer balance
    if (saleData.customerId && (saleData.dueAmount > 0 || saleData.paymentMethod === 'CREDIT')) {
      const addedCredit = saleData.dueAmount > 0 ? saleData.dueAmount : saleData.totalAmount;
      this.addCustomerCharge(saleData.customerId, addedCredit, invoiceNum, 'Store POS Sale on Khata');
    }

    // 3. Save sale record
    this.setItem(STORAGE_KEYS.SALES, [newSale, ...sales]);
    return newSale;
  }

  getSales(filters = {}) {
    let list = this.getItem(STORAGE_KEYS.SALES, INITIAL_SEED_DATA.sales);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(s => 
        s.invoiceNumber.toLowerCase().includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q))
      );
    }

    if (filters.paymentMethod) {
      list = list.filter(s => s.paymentMethod === filters.paymentMethod);
    }

    if (filters.paymentStatus) {
      list = list.filter(s => s.paymentStatus === filters.paymentStatus);
    }

    return list;
  }

  getSaleById(id) {
    const sales = this.getItem(STORAGE_KEYS.SALES, INITIAL_SEED_DATA.sales);
    const sale = sales.find(s => s.id === id || s.invoiceNumber === id);
    if (!sale) return null;

    const biz = this.getBusiness();
    const customer = sale.customerId ? this.getCustomerById(sale.customerId) : null;
    
    // Normalize items
    const items = (sale.items || []).map((item, idx) => ({
      id: item.id || `item_${idx}`,
      productId: item.productId,
      productNameSnapshot: item.productNameSnapshot || item.name || 'Kirana Item',
      skuSnapshot: item.skuSnapshot || item.sku || '',
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unitPrice || 0),
      discountAmount: Number(item.discountAmount || item.discount || 0),
      taxRate: Number(item.taxRate || 0),
      lineTotal: Number(item.lineTotal || (item.unitPrice * (item.quantity || 1)))
    }));

    // Normalize payments
    let payments = sale.payments;
    if (!payments || payments.length === 0) {
      payments = [
        {
          id: `pay_${Date.now()}`,
          method: sale.paymentMethod || 'CASH',
          amount: Number(sale.paidAmount !== undefined ? sale.paidAmount : sale.totalAmount),
          reference: sale.paymentReference || ''
        }
      ];
    }

    return {
      ...sale,
      items,
      payments,
      business: biz,
      customer: customer || (sale.customerName ? { name: sale.customerName } : null),
      user: { name: sale.createdBy || 'Ramesh Sharma' },
      returns: []
    };
  }

  // Customers & Khata Udhaar
  getCustomers(search = '') {
    let customers = this.getItem(STORAGE_KEYS.CUSTOMERS, INITIAL_SEED_DATA.customers);
    if (search) {
      const q = search.toLowerCase();
      customers = customers.filter(c => 
        c.name.toLowerCase().includes(q) || 
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    }
    return customers;
  }

  getCustomerById(id) {
    const customers = this.getCustomers();
    const cust = customers.find(c => c.id === id);
    if (!cust) return null;
    const ledgers = this.getItem(STORAGE_KEYS.CUSTOMER_LEDGERS, INITIAL_SEED_DATA.customerLedgers);
    const custLedgers = ledgers.filter(l => l.customerId === id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { ...cust, ledgers: custLedgers };
  }

  saveCustomer(data) {
    const customers = this.getItem(STORAGE_KEYS.CUSTOMERS, INITIAL_SEED_DATA.customers);
    let updated;
    if (data.id) {
      updated = customers.map(c => c.id === data.id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c);
    } else {
      const newCust = {
        id: `cust_${Date.now()}`,
        name: data.name,
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        outstandingCredit: Number(data.outstandingCredit || 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      updated = [newCust, ...customers];
    }
    this.setItem(STORAGE_KEYS.CUSTOMERS, updated);
    return data.id ? this.getCustomerById(data.id) : updated[0];
  }

  addCustomerCharge(customerId, amount, refId = '', note = '') {
    const customers = this.getItem(STORAGE_KEYS.CUSTOMERS, INITIAL_SEED_DATA.customers);
    const ledgers = this.getItem(STORAGE_KEYS.CUSTOMER_LEDGERS, INITIAL_SEED_DATA.customerLedgers);
    let newBal = 0;

    const updatedCusts = customers.map(c => {
      if (c.id === customerId) {
        newBal = (c.outstandingCredit || 0) + Number(amount);
        return { ...c, outstandingCredit: newBal, updatedAt: new Date().toISOString() };
      }
      return c;
    });

    const newLedger = {
      id: `ledg_${Date.now()}`,
      customerId,
      type: 'CREDIT',
      amount: Number(amount),
      balanceAfter: newBal,
      referenceType: 'SALE',
      referenceId: refId,
      note: note || 'Store credit purchase',
      createdAt: new Date().toISOString()
    };

    this.setItem(STORAGE_KEYS.CUSTOMERS, updatedCusts);
    this.setItem(STORAGE_KEYS.CUSTOMER_LEDGERS, [newLedger, ...ledgers]);
    return { balance: newBal, ledger: newLedger };
  }

  recordCustomerPayment(customerId, amount, paymentMode = 'CASH', note = '') {
    const customers = this.getItem(STORAGE_KEYS.CUSTOMERS, INITIAL_SEED_DATA.customers);
    const ledgers = this.getItem(STORAGE_KEYS.CUSTOMER_LEDGERS, INITIAL_SEED_DATA.customerLedgers);
    let newBal = 0;

    const updatedCusts = customers.map(c => {
      if (c.id === customerId) {
        newBal = Math.max(0, (c.outstandingCredit || 0) - Number(amount));
        return { ...c, outstandingCredit: newBal, updatedAt: new Date().toISOString() };
      }
      return c;
    });

    const newLedger = {
      id: `ledg_${Date.now()}`,
      customerId,
      type: 'PAYMENT',
      amount: Number(amount),
      balanceAfter: newBal,
      referenceType: 'MANUAL',
      referenceId: `PAY-${Date.now().toString().slice(-6)}`,
      note: note || `Payment received via ${paymentMode}`,
      createdAt: new Date().toISOString()
    };

    this.setItem(STORAGE_KEYS.CUSTOMERS, updatedCusts);
    this.setItem(STORAGE_KEYS.CUSTOMER_LEDGERS, [newLedger, ...ledgers]);
    this.addAuditLog('KHATA_PAYMENT', `Customer Payment received ₹${amount} (${paymentMode})`, 0);
    return { balance: newBal, ledger: newLedger };
  }

  // Suppliers & Purchases
  getSuppliers() {
    return this.getItem(STORAGE_KEYS.SUPPLIERS, INITIAL_SEED_DATA.suppliers);
  }

  saveSupplier(data) {
    const suppliers = this.getSuppliers();
    let updated;
    if (data.id) {
      updated = suppliers.map(s => s.id === data.id ? { ...s, ...data } : s);
    } else {
      const newSup = {
        id: `sup_${Date.now()}`,
        name: data.name,
        companyName: data.companyName || data.name,
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        taxNumber: data.taxNumber || '',
        balance: Number(data.balance || 0),
        isActive: true
      };
      updated = [newSup, ...suppliers];
    }
    this.setItem(STORAGE_KEYS.SUPPLIERS, updated);
    return updated;
  }

  getPurchases() {
    return this.getItem(STORAGE_KEYS.PURCHASE_ORDERS, INITIAL_SEED_DATA.purchases);
  }

  createPurchase(poData) {
    const purchases = this.getPurchases();
    const poNumber = `PO-${new Date().getFullYear()}-${String(purchases.length + 47).padStart(5, '0')}`;
    
    const newPO = {
      id: `po_${Date.now()}`,
      purchaseOrderNumber: poNumber,
      supplierId: poData.supplierId,
      supplierName: poData.supplierName || 'Distributor',
      status: poData.status || 'RECEIVED',
      paymentStatus: poData.paymentStatus || 'PAID',
      subtotal: Number(poData.subtotal || 0),
      taxAmount: Number(poData.taxAmount || 0),
      totalAmount: Number(poData.totalAmount || 0),
      paidAmount: Number(poData.paidAmount || poData.totalAmount || 0),
      dueAmount: Number(poData.dueAmount || 0),
      purchaseDate: new Date().toISOString(),
      items: poData.items || []
    };

    // If marked received, add stock to inventory
    if (newPO.status === 'RECEIVED' && poData.items) {
      poData.items.forEach(item => {
        if (item.productId) {
          this.adjustStock(item.productId, Math.abs(item.quantity || 1), 'PURCHASE', `PO #${poNumber}`);
        }
      });
    }

    this.setItem(STORAGE_KEYS.PURCHASE_ORDERS, [newPO, ...purchases]);
    return newPO;
  }

  // Expenses
  getExpenses() {
    return this.getItem(STORAGE_KEYS.EXPENSES, INITIAL_SEED_DATA.expenses);
  }

  saveExpense(data) {
    const expenses = this.getExpenses();
    let updated;
    if (data.id) {
      updated = expenses.map(e => e.id === data.id ? { ...e, ...data } : e);
    } else {
      const newExp = {
        id: `exp_${Date.now()}`,
        title: data.title,
        category: data.category || 'General Expense',
        amount: Number(data.amount || 0),
        paymentMethod: data.paymentMethod || 'CASH',
        date: data.date || new Date().toISOString(),
        note: data.note || ''
      };
      updated = [newExp, ...expenses];
    }
    this.setItem(STORAGE_KEYS.EXPENSES, updated);
    return updated;
  }

  deleteExpense(id) {
    const expenses = this.getExpenses();
    const filtered = expenses.filter(e => e.id !== id);
    this.setItem(STORAGE_KEYS.EXPENSES, filtered);
    return true;
  }

  // Audit Logs
  getAuditLogs() {
    return this.getItem(STORAGE_KEYS.AUDIT_LOGS, INITIAL_SEED_DATA.auditLogs);
  }

  addAuditLog(action, productName, qty = 0) {
    const logs = this.getAuditLogs();
    const session = this.getSession();
    const newLog = {
      id: `log_${Date.now()}`,
      action,
      productName,
      qty,
      user: session.name || 'Owner',
      time: new Date().toISOString()
    };
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, [newLog, ...logs.slice(0, 49)]);
  }

  // Staff Accounts
  getStaff() {
    return this.getItem(STORAGE_KEYS.STAFF, INITIAL_SEED_DATA.staff);
  }

  saveStaff(member) {
    const staff = this.getStaff();
    let updated;
    if (member.id) {
      updated = staff.map(s => s.id === member.id ? { ...s, ...member } : s);
    } else {
      const newM = {
        id: `staff_${Date.now()}`,
        name: member.name,
        email: member.email,
        role: member.role || 'CASHIER',
        createdAt: new Date().toISOString()
      };
      updated = [...staff, newM];
    }
    this.setItem(STORAGE_KEYS.STAFF, updated);
    return updated;
  }

  deleteStaff(id) {
    const staff = this.getStaff();
    const updated = staff.filter(s => s.id !== id);
    this.setItem(STORAGE_KEYS.STAFF, updated);
    return updated;
  }

  // Dashboard Aggregated Metrics
  getDashboardMetrics() {
    const sales = this.getItem(STORAGE_KEYS.SALES, INITIAL_SEED_DATA.sales);
    const products = this.getItem(STORAGE_KEYS.PRODUCTS, INITIAL_SEED_DATA.products);
    const customers = this.getItem(STORAGE_KEYS.CUSTOMERS, INITIAL_SEED_DATA.customers);
    const logs = this.getAuditLogs();

    // Today's boundaries
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    let todaySales = 0;
    let todayProfit = 0;
    let itemsSold = 0;
    let totalUnits = 0;
    let outOfStock = 0;
    let inventoryValue = 0;

    // Build Product Cost lookup
    const costMap = Object.fromEntries(products.map(p => [p.id, p.purchasePrice || 0]));

    sales.forEach(sale => {
      const saleTime = new Date(sale.createdAt).getTime();
      const isToday = saleTime >= startOfDay;

      if (isToday) {
        todaySales += sale.totalAmount || 0;
        if (sale.items) {
          sale.items.forEach(item => {
            const qty = item.quantity || 1;
            itemsSold += qty;
            const cost = (costMap[item.productId] || (item.unitPrice * 0.8)) * qty;
            const revenue = item.lineTotal || (item.unitPrice * qty);
            todayProfit += Math.max(0, revenue - cost);
          });
        }
      }
    });

    // Fallback values if no sales recorded today yet for realistic demo feel
    if (todaySales === 0 && sales.length > 0) {
      sales.forEach(sale => {
        todaySales += sale.totalAmount || 0;
        if (sale.items) {
          sale.items.forEach(item => {
            itemsSold += (item.quantity || 1);
            const cost = (costMap[item.productId] || (item.unitPrice * 0.8)) * (item.quantity || 1);
            todayProfit += Math.max(0, (item.lineTotal || 0) - cost);
          });
        }
      });
    }

    // Low stock count & list & inventory totals
    const lowStockDetails = [];
    products.forEach(p => {
      const qty = p.inventory?.quantity || 0;
      const threshold = p.inventory?.lowStockThreshold || 10;
      totalUnits += qty;
      if (qty === 0) outOfStock++;
      inventoryValue += qty * (p.purchasePrice || p.sellingPrice || 0);

      if (qty <= threshold) {
        lowStockDetails.push({
          id: p.id,
          name: p.name,
          stock: qty,
          threshold,
          reorderQty: p.inventory?.reorderQuantity || 20
        });
      }
    });

    // Outstanding Udhaar / Credit
    const outstandingCredit = customers.reduce((sum, c) => sum + (c.outstandingCredit || 0), 0);

    // Sales Chart Data (last 7 days)
    const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dayName = daysMap[d.getDay()];
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;

      let dayTotal = 0;
      sales.forEach(s => {
        const st = new Date(s.createdAt).getTime();
        if (st >= dayStart && st < dayEnd) {
          dayTotal += s.totalAmount || 0;
        }
      });

      // Sample base if 0
      if (dayTotal === 0) {
        dayTotal = Math.floor(1800 + Math.sin(i) * 600 + Math.random() * 800);
      }

      chartData.push({ name: dayName, sales: Math.round(dayTotal) });
    }

    // Top Selling Products
    const soldMap = {};
    sales.forEach(s => {
      if (s.items) {
        s.items.forEach(item => {
          const name = item.name || 'FMCG Item';
          soldMap[name] = (soldMap[name] || 0) + (item.quantity || 1);
        });
      }
    });

    const topSelling = Object.entries(soldMap)
      .map(([name, sold], i) => ({ id: `top_${i}`, name, sold }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    if (topSelling.length === 0) {
      topSelling.push(
        { id: '1', name: 'Aashirvaad Superior MP Shudh Chakki Atta 5kg', sold: 28 },
        { id: '2', name: 'Amul Butter Pasteurised 500g', sold: 24 },
        { id: '3', name: 'Maggi 2-Minute Masala Instant Noodles 4-Pack', sold: 19 },
        { id: '4', name: 'Tata Tea Gold Rich & Aromatic 500g', sold: 15 },
        { id: '5', name: 'Fortune Sunlite Refined Sunflower Oil 1L', sold: 12 }
      );
    }

    return {
      totalProducts: products.length,
      totalUnits,
      lowStock: lowStockDetails.length,
      outOfStock,
      inventoryValue: Math.round(inventoryValue),
      todaySales: Math.round(todaySales),
      todayProfit: Math.round(todayProfit),
      itemsSold,
      outstandingCredit: Math.round(outstandingCredit),
      lowStockDetails,
      chartData,
      topSelling,
      recentActivity: logs.slice(0, 6)
    };
  }

  // Intelligent Rule-Based AI Assistant for Kirana
  askAssistant(query) {
    const q = (query || '').toLowerCase().trim();
    const products = this.getItem(STORAGE_KEYS.PRODUCTS, INITIAL_SEED_DATA.products);
    const sales = this.getItem(STORAGE_KEYS.SALES, INITIAL_SEED_DATA.sales);
    const customers = this.getItem(STORAGE_KEYS.CUSTOMERS, INITIAL_SEED_DATA.customers);
    const metrics = this.getDashboardMetrics();

    if (q.includes('stock') || q.includes('low stock') || q.includes('reorder')) {
      const low = metrics.lowStockDetails;
      if (low.length === 0) {
        return "✨ Great news! All products have healthy stock levels above their low-stock thresholds.";
      }
      const listStr = low.map(l => `• **${l.name}**: only ${l.stock} left (suggested reorder: +${l.reorderQty})`).join('\n');
      return `⚠️ **${low.length} Items Require Reordering Soon:**\n\n${listStr}\n\nYou can generate purchase orders directly from the **Purchases** tab.`;
    }

    if (q.includes('sales') || q.includes('today') || q.includes('revenue') || q.includes('profit')) {
      return `📊 **Today's Store Summary:**\n• Total Revenue: **₹${metrics.todaySales.toLocaleString('en-IN')}**\n• Estimated Gross Profit: **₹${metrics.todayProfit.toLocaleString('en-IN')}**\n• Total Items Checked Out: **${metrics.itemsSold} units**\n• Profit Margin: **${metrics.todaySales > 0 ? Math.round((metrics.todayProfit / metrics.todaySales) * 100) : 0}%**`;
    }

    if (q.includes('udhaar') || q.includes('credit') || q.includes('khata') || q.includes('pending')) {
      const debtors = customers.filter(c => c.outstandingCredit > 0).sort((a, b) => b.outstandingCredit - a.outstandingCredit);
      const debtorList = debtors.map(d => `• **${d.name}** (${d.phone}): ₹${d.outstandingCredit.toLocaleString('en-IN')}`).join('\n');
      return `📒 **Customer Khata / Udhaar Outstanding (Total: ₹${metrics.outstandingCredit.toLocaleString('en-IN')}):**\n\n${debtorList}\n\nYou can send WhatsApp payment reminders directly from the **Customers** screen.`;
    }

    if (q.includes('top') || q.includes('best seller') || q.includes('popular')) {
      const tops = metrics.topSelling.map((t, idx) => `${idx + 1}. **${t.name}** — ${t.sold} sold`).join('\n');
      return `🏆 **Top 5 Best-Selling FMCG Products:**\n\n${tops}`;
    }

    return `Namaste! I am your **Kirana Smart Assistant**. I can help you with:\n• 📦 *"Which items have low stock?"*\n• 💰 *"What are today's sales and profits?"*\n• 📒 *"Show pending customer udhaar balances"*\n• 🏆 *"What are my best-selling items?"*\n\nHow can I help your store right now?`;
  }

  // Export JSON Backup
  exportData() {
    return {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      business: this.getBusiness(),
      categories: this.getCategories(),
      products: this.getItem(STORAGE_KEYS.PRODUCTS, []),
      customers: this.getItem(STORAGE_KEYS.CUSTOMERS, []),
      customerLedgers: this.getItem(STORAGE_KEYS.CUSTOMER_LEDGERS, []),
      sales: this.getItem(STORAGE_KEYS.SALES, []),
      suppliers: this.getSuppliers(),
      purchases: this.getPurchases(),
      expenses: this.getExpenses(),
      auditLogs: this.getAuditLogs()
    };
  }

  // Import JSON Backup
  importData(jsonData) {
    if (!jsonData || typeof jsonData !== 'object') {
      throw new Error('Invalid JSON backup format');
    }

    if (jsonData.business) this.setItem(STORAGE_KEYS.BUSINESS, jsonData.business);
    if (jsonData.categories) this.setItem(STORAGE_KEYS.CATEGORIES, jsonData.categories);
    if (jsonData.products) this.setItem(STORAGE_KEYS.PRODUCTS, jsonData.products);
    if (jsonData.customers) this.setItem(STORAGE_KEYS.CUSTOMERS, jsonData.customers);
    if (jsonData.customerLedgers) this.setItem(STORAGE_KEYS.CUSTOMER_LEDGERS, jsonData.customerLedgers);
    if (jsonData.sales) this.setItem(STORAGE_KEYS.SALES, jsonData.sales);
    if (jsonData.suppliers) this.setItem(STORAGE_KEYS.SUPPLIERS, jsonData.suppliers);
    if (jsonData.purchases) this.setItem(STORAGE_KEYS.PURCHASE_ORDERS, jsonData.purchases);
    if (jsonData.expenses) this.setItem(STORAGE_KEYS.EXPENSES, jsonData.expenses);
    if (jsonData.auditLogs) this.setItem(STORAGE_KEYS.AUDIT_LOGS, jsonData.auditLogs);

    this.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    return true;
  }

  // Calculate storage usage statistics in bytes & record counts
  getStorageStats() {
    if (!this.isBrowser) return { totalSizeKB: 0, counts: {} };
    let totalBytes = 0;
    const counts = {};

    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      const val = localStorage.getItem(key);
      if (val) {
        totalBytes += (key.length + val.length) * 2;
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) {
            counts[name.toLowerCase()] = parsed.length;
          }
        } catch {}
      }
    });

    return {
      totalSizeKB: (totalBytes / 1024).toFixed(2),
      counts,
      mode: this.getMode()
    };
  }
}

export const kiranaStorage = new KiranaStorageEngine();
