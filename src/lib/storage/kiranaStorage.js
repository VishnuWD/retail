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
  INITIALIZED: 'pixelcode_seeded_catalog_v7'
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
    { id: 'cat_beverages', name: 'Beverages & Artisan Drinks', description: 'Gourmet coffees, artisan teas, cold-pressed juices and sparkling beverages', isActive: true },
    { id: 'cat_dairy_bakery', name: 'Dairy, Bakery & Spreads', description: 'Greek yogurts, gourmet cheeses, artisan breads and breakfast spreads', isActive: true },
    { id: 'cat_snacks', name: 'Snacks & Confectionery', description: 'Artisanal chocolates, tortilla chips, roasted nuts and gourmet munchies', isActive: true },
    { id: 'cat_fresh_produce', name: 'Fresh Produce & Organics', description: 'Farm fresh organic fruits, hydroponic greens and fresh exotic vegetables', isActive: true },
    { id: 'cat_gourmet_staples', name: 'Gourmet Staples & Pastas', description: 'Cold-pressed extra virgin oils, durum wheat pasta, basmati rice and organic honey', isActive: true },
    { id: 'cat_electronics', name: 'Electronics & Mobile Gear', description: 'Fast GaN chargers, braided cables, wired earphones and ultra alkaline batteries', isActive: true },
    { id: 'cat_personal_care', name: 'Personal Care & Grooming', description: 'Premium face washes, keratin shampoos, hand hygiene and oral care', isActive: true },
    { id: 'cat_home_cleaning', name: 'Home Care & Eco Cleaning', description: 'Liquid matic detergents, surface glass cleaners and room aroma gels', isActive: true },
    { id: 'cat_health_fitness', name: 'Health & Fitness Nutrition', description: 'Whey protein isolates, vitamin effervescents and wellness supplements', isActive: true },
    { id: 'cat_stationery', name: 'Stationery & Desk Supplies', description: 'Spiral bound notebooks, fine roller pens, sticky notes and desk essentials', isActive: true }
  ],
  products: [
    // 1. BEVERAGES & ARTISAN DRINKS
    {
      id: 'prod_bev_01',
      name: 'Blue Tokai Roasted Coffee Beans (Attikan Estate) 250g',
      brand: 'Blue Tokai',
      categoryId: 'cat_beverages',
      sku: 'BT-ATTIKAN-250G',
      barcode: '8906101230012',
      unit: 'pack',
      purchasePrice: 440,
      sellingPrice: 550,
      taxRate: 5,
      imageUrl: 'https://ts4.explicit.bing.net/th?id=OIP.17L5-nNi8ORyidglh64rSgHaHa&pid=15.1',
      isActive: true,
      description: '100% Specialty Arabica beans with dark chocolate and fig tasting notes',
      inventory: { quantity: 35, lowStockThreshold: 10, reorderQuantity: 20 }
    },
    {
      id: 'prod_bev_02',
      name: 'Red Bull Energy Drink 250ml Sleek Can',
      brand: 'Red Bull',
      categoryId: 'cat_beverages',
      sku: 'RB-ENERGY-250ML',
      barcode: '9002490100070',
      unit: 'can',
      purchasePrice: 102,
      sellingPrice: 125,
      taxRate: 28,
      imageUrl: 'https://ts3.mm.bing.net/th?id=OIP.GyQWy5QouwITz8NZFhrEiAHaHa&pid=15.1',
      isActive: true,
      description: 'Vitalizes Body and Mind with high quality alpine ingredients',
      inventory: { quantity: 80, lowStockThreshold: 20, reorderQuantity: 48 }
    },
    {
      id: 'prod_bev_03',
      name: 'Raw Pressery Cold Pressed Valencia Orange Juice 1L',
      brand: 'Raw Pressery',
      categoryId: 'cat_beverages',
      sku: 'RAW-ORNG-1L',
      barcode: '8906063412010',
      unit: 'bottle',
      purchasePrice: 185,
      sellingPrice: 230,
      taxRate: 12,
      imageUrl: 'https://ts3.mm.bing.net/th?id=OIP.OxOfyXlZd1lkLSNCv3WsjgHaHa&pid=15.1',
      isActive: true,
      description: '100% pure cold pressed orange juice with no added sugar or preservatives',
      inventory: { quantity: 24, lowStockThreshold: 6, reorderQuantity: 15 }
    },
    {
      id: 'prod_bev_04',
      name: 'Organic India Tulsi Green Tea Classic 100g Tin',
      brand: 'Organic India',
      categoryId: 'cat_beverages',
      sku: 'OI-TULSI-100G',
      barcode: '8904052600210',
      unit: 'tin',
      purchasePrice: 205,
      sellingPrice: 260,
      taxRate: 5,
      imageUrl: 'https://ts3.mm.bing.net/th?id=OIP.CWJtOkZELD10TkETg0Xr0wHaHa&pid=15.1',
      isActive: true,
      description: 'Certified organic blend of healing Rama, Krishna and Vana Tulsi with green tea',
      inventory: { quantity: 42, lowStockThreshold: 12, reorderQuantity: 24 }
    },
    {
      id: 'prod_bev_05',
      name: 'Paper Boat Tender Coconut Water 200ml Tetra',
      brand: 'Paper Boat',
      categoryId: 'cat_beverages',
      sku: 'PB-COCO-200ML',
      barcode: '8906059420081',
      unit: 'pack',
      purchasePrice: 38,
      sellingPrice: 50,
      taxRate: 12,
      imageUrl: 'https://ts1.mm.bing.net/th?id=OIP.lmnhnfZxTuNEREV-RPlOowHaHa&pid=15.1',
      isActive: true,
      description: 'Refreshing natural tender coconut water packed with electrolytes',
      inventory: { quantity: 60, lowStockThreshold: 15, reorderQuantity: 30 }
    },

    // 2. DAIRY, BAKERY & GOURMET SPREADS
    {
      id: 'prod_dai_01',
      name: 'Epigamia Greek Yogurt Natural Strawberry 120g Cup',
      brand: 'Epigamia',
      categoryId: 'cat_dairy_bakery',
      sku: 'EPI-STRW-120G',
      barcode: '8906082490014',
      unit: 'cup',
      purchasePrice: 46,
      sellingPrice: 60,
      taxRate: 5,
      imageUrl: 'https://ts2.mm.bing.net/th?id=OIP.IJfk-6MBt8K7mKvjR_Z_1wHaHa&pid=15.1',
      isActive: true,
      description: 'Thick, creamy Greek yogurt loaded with real strawberries and high protein',
      inventory: { quantity: 28, lowStockThreshold: 8, reorderQuantity: 18 }
    },
    {
      id: 'prod_dai_02',
      name: 'The Laughing Cow Cheese Triangles (8 Portions) 120g',
      brand: 'The Laughing Cow',
      categoryId: 'cat_dairy_bakery',
      sku: 'TLC-CHS-8P',
      barcode: '8906093550013',
      unit: 'box',
      purchasePrice: 110,
      sellingPrice: 140,
      taxRate: 12,
      imageUrl: 'https://ts4.mm.bing.net/th?id=OIP.ibdjiulLbnvPIIjS6Fe9xgHaHa&pid=15.1',
      isActive: true,
      description: 'Creamy and soft delicious cheese triangles rich in calcium and vitamins',
      inventory: { quantity: 32, lowStockThreshold: 10, reorderQuantity: 20 }
    },
    {
      id: 'prod_dai_03',
      name: 'English Oven 100% Whole Wheat Brown Bread 400g',
      brand: 'English Oven',
      categoryId: 'cat_dairy_bakery',
      sku: 'EO-WHEAT-400G',
      barcode: '8906019620021',
      unit: 'loaf',
      purchasePrice: 38,
      sellingPrice: 50,
      taxRate: 0,
      imageUrl: 'https://ts3.mm.bing.net/th?id=OIP.Qrjd42CnxF7SCcG1qyjvmgHaHa&pid=15.1',
      isActive: true,
      description: 'Zero maida artisan brown bread baked with 100% whole wheat grains',
      inventory: { quantity: 20, lowStockThreshold: 6, reorderQuantity: 15 }
    },
    {
      id: 'prod_dai_04',
      name: 'Farm Fresh Organic Free-Range Brown Eggs (Pack of 6)',
      brand: 'Farm Fresh',
      categoryId: 'cat_dairy_bakery',
      sku: 'FF-EGGS-6PK',
      barcode: '8906001200051',
      unit: 'tray',
      purchasePrice: 72,
      sellingPrice: 95,
      taxRate: 0,
      imageUrl: 'https://ts2.mm.bing.net/th?id=OIP.gDW43NI92tmG0cTIUrF6FAHaEc&pid=15.1',
      isActive: true,
      description: 'Nutritious antibiotic-free farm fresh organic brown eggs with golden yolks',
      inventory: { quantity: 45, lowStockThreshold: 12, reorderQuantity: 30 }
    },
    {
      id: 'prod_dai_05',
      name: 'Nutella Hazelnut Cocoa Spread 350g Glass Jar',
      brand: 'Nutella',
      categoryId: 'cat_dairy_bakery',
      sku: 'NUT-SPRD-350G',
      barcode: '8000500179860',
      unit: 'jar',
      purchasePrice: 275,
      sellingPrice: 340,
      taxRate: 18,
      imageUrl: 'https://ts4.mm.bing.net/th?id=OIP.koBL2Ozs4Rb7UqecdLTwRwHaHa&pid=15.1',
      isActive: true,
      description: 'Iconic hazelnut spread made from quality roasted hazelnuts and cocoa',
      inventory: { quantity: 22, lowStockThreshold: 6, reorderQuantity: 16 }
    },

    // 3. PREMIUM SNACKS & CONFECTIONERY
    {
      id: 'prod_snk_01',
      name: "Doritos Sizzlin' Hot Nacho Cheese Tortilla Chips 140g",
      brand: 'Doritos',
      categoryId: 'cat_snacks',
      sku: 'DOR-SIZZ-140G',
      barcode: '8901491102927',
      unit: 'pack',
      purchasePrice: 48,
      sellingPrice: 60,
      taxRate: 12,
      imageUrl: 'https://ts2.mm.bing.net/th?id=OIP.x78APQ-dUBGNp2P5MNMqYgHaHa&pid=15.1',
      isActive: true,
      description: 'Intense crunch tortilla chips with fiery hot bold cheese seasoning',
      inventory: { quantity: 50, lowStockThreshold: 15, reorderQuantity: 30 }
    },
    {
      id: 'prod_snk_02',
      name: 'Ferrero Rocher Premium Hazelnut Pralines Box of 16',
      brand: 'Ferrero Rocher',
      categoryId: 'cat_snacks',
      sku: 'FR-ROCH-16PK',
      barcode: '8000500003783',
      unit: 'box',
      purchasePrice: 430,
      sellingPrice: 549,
      taxRate: 18,
      imageUrl: 'https://ts1.mm.bing.net/th?id=OIP.TGnVa1l07kXlsCxHI0URqQHaHa&pid=15.1',
      isActive: true,
      description: 'Whole crunchy hazelnut in a delicious creamy filling wrapped in crisp wafer',
      inventory: { quantity: 18, lowStockThreshold: 5, reorderQuantity: 12 }
    },
    {
      id: 'prod_snk_03',
      name: 'Pringles Sour Cream & Onion Potato Crisps 107g Canister',
      brand: 'Pringles',
      categoryId: 'cat_snacks',
      sku: 'PRN-SC-107G',
      barcode: '8886467100017',
      unit: 'can',
      purchasePrice: 95,
      sellingPrice: 120,
      taxRate: 12,
      imageUrl: 'https://ts2.mm.bing.net/th?id=OIP.jm4iRzmjE14vMsYZ8Fv_LwHaHa&pid=15.1',
      isActive: true,
      description: 'Crispy saddle-shaped potato chips packed in the iconic resealable tube',
      inventory: { quantity: 40, lowStockThreshold: 10, reorderQuantity: 24 }
    },
    {
      id: 'prod_snk_04',
      name: 'Cadbury Dairy Milk Silk Roasted Almond Chocolate 143g',
      brand: 'Cadbury',
      categoryId: 'cat_snacks',
      sku: 'CDM-SILK-ALM-143G',
      barcode: '8901233024823',
      unit: 'bar',
      purchasePrice: 145,
      sellingPrice: 185,
      taxRate: 18,
      imageUrl: 'https://ts2.mm.bing.net/th?id=OIP.uH6jK59i4G5eNtzpDsDEhQHaHa&pid=15.1',
      isActive: true,
      description: 'Silky smooth milk chocolate filled with whole crunchy roasted almonds',
      inventory: { quantity: 30, lowStockThreshold: 8, reorderQuantity: 20 }
    },
    {
      id: 'prod_snk_05',
      name: 'Happilo Premium California Roasted & Salted Almonds 200g',
      brand: 'Happilo',
      categoryId: 'cat_snacks',
      sku: 'HAP-ALM-200G',
      barcode: '8906081120042',
      unit: 'pouch',
      purchasePrice: 215,
      sellingPrice: 275,
      taxRate: 5,
      imageUrl: 'https://ts3.mm.bing.net/th?id=OIP.Yimk_A8eR9I9YMsYGJ0ohAHaHa&pid=15.1',
      isActive: true,
      description: 'Handpicked California almonds roasted to perfection with Himalayan pink salt',
      inventory: { quantity: 26, lowStockThreshold: 8, reorderQuantity: 15 }
    },

    // 4. FRESH PRODUCE & FARM ORGANICS
    {
      id: 'prod_fre_01',
      name: 'Fresh Hass Avocados Imported (Pack of 2)',
      brand: 'Fresh Farm',
      categoryId: 'cat_fresh_produce',
      sku: 'AVO-HASS-2PK',
      barcode: '8906009800018',
      unit: 'pack',
      purchasePrice: 175,
      sellingPrice: 230,
      taxRate: 0,
      imageUrl: 'https://ts4.mm.bing.net/th?id=OIP.BIYQQJ_YCLAUWW07W_ABZAHaHa&pid=15.1',
      isActive: true,
      description: 'Ripe and creamy nutrient-dense premium imported Hass avocados',
      inventory: { quantity: 18, lowStockThreshold: 5, reorderQuantity: 12 }
    },
    {
      id: 'prod_fre_02',
      name: 'Hydroponic Fresh Baby Spinach Box 200g',
      brand: 'Fresh Farm',
      categoryId: 'cat_fresh_produce',
      sku: 'HYD-SPIN-200G',
      barcode: '8906009800025',
      unit: 'box',
      purchasePrice: 42,
      sellingPrice: 60,
      taxRate: 0,
      imageUrl: 'https://ts3.mm.bing.net/th?id=OIP.dwo4PCh9r6BXW7rBTLhp0wHaHa&pid=15.1',
      isActive: true,
      description: 'Tender pesticide-free baby spinach leaves grown in hydroponic vertical farms',
      inventory: { quantity: 25, lowStockThreshold: 6, reorderQuantity: 15 }
    },
    {
      id: 'prod_fre_03',
      name: 'Washington Red Delicious Apples 1kg Net Bag',
      brand: 'Fresh Farm',
      categoryId: 'cat_fresh_produce',
      sku: 'APL-WASH-1KG',
      barcode: '8906009800032',
      unit: 'kg',
      purchasePrice: 160,
      sellingPrice: 210,
      taxRate: 0,
      imageUrl: 'https://ts4.mm.bing.net/th?id=OIP.bn-t44YHl3SmJ6p_F5cEZAHaJO&pid=15.1',
      isActive: true,
      description: 'Crisp, sweet, and juicy handpicked Washington Red Delicious apples',
      inventory: { quantity: 30, lowStockThreshold: 10, reorderQuantity: 20 }
    },

    // 5. GOURMET STAPLES, PASTAS & OILS
    {
      id: 'prod_sta_01',
      name: 'Borges Extra Virgin Olive Oil Cold Extracted 1L Glass Bottle',
      brand: 'Borges',
      categoryId: 'cat_gourmet_staples',
      sku: 'BORG-EVOO-1L',
      barcode: '8410179010014',
      unit: 'bottle',
      purchasePrice: 840,
      sellingPrice: 1099,
      taxRate: 5,
      imageUrl: 'https://ts4.mm.bing.net/th?id=OIP.jeGCgDa3-5k9ixzX-lOCdgHaHa&pid=15.1',
      isActive: true,
      description: 'First cold pressed extra virgin olive oil made from Mediterranean olives',
      inventory: { quantity: 15, lowStockThreshold: 4, reorderQuantity: 10 }
    },
    {
      id: 'prod_sta_02',
      name: 'Barilla Penne Rigate 100% Italian Durum Wheat Pasta 500g',
      brand: 'Barilla',
      categoryId: 'cat_gourmet_staples',
      sku: 'BAR-PENNE-500G',
      barcode: '8076809513753',
      unit: 'box',
      purchasePrice: 170,
      sellingPrice: 225,
      taxRate: 12,
      imageUrl: 'https://ts4.mm.bing.net/th?id=OIP.zqFAcnREkI7pNpcCSwcOzgHaHa&pid=15.1',
      isActive: true,
      description: 'Authentic Italian pasta crafted with high protein durum wheat semolina',
      inventory: { quantity: 36, lowStockThreshold: 10, reorderQuantity: 24 }
    },
    {
      id: 'prod_sta_03',
      name: 'Daawat Rozana Super Basmati Long Grain Rice 5kg Bag',
      brand: 'Daawat',
      categoryId: 'cat_gourmet_staples',
      sku: 'DAAW-ROZ-5KG',
      barcode: '8901537001016',
      unit: 'bag',
      purchasePrice: 375,
      sellingPrice: 460,
      taxRate: 0,
      imageUrl: 'https://ts3.mm.bing.net/th?id=OIP.9rqB53vgJEJIxDdJSWrHRQHaHa&pid=15.1',
      isActive: true,
      description: 'Aromatic aged long grain basmati rice perfect for daily biryanis and pulao',
      inventory: { quantity: 28, lowStockThreshold: 8, reorderQuantity: 18 }
    },
    {
      id: 'prod_sta_04',
      name: 'Disano 100% Pure Wild Forest Organic Honey 500g Glass Bottle',
      brand: 'Disano',
      categoryId: 'cat_gourmet_staples',
      sku: 'DIS-HNY-500G',
      barcode: '8906063490025',
      unit: 'jar',
      purchasePrice: 230,
      sellingPrice: 299,
      taxRate: 5,
      imageUrl: 'https://ts1.mm.bing.net/th?id=OIP.ije4h5bVih1YyOhiQTssggHaHa&pid=15.1',
      isActive: true,
      description: 'Unprocessed pure forest honey rich in antioxidants and natural enzymes',
      inventory: { quantity: 24, lowStockThreshold: 6, reorderQuantity: 15 }
    },

    // 6. ELECTRONICS & MOBILE ACCESSORIES
    {
      id: 'prod_ele_01',
      name: 'Boat Bassheads 100 Wired In-Ear Earphones with Mic',
      brand: 'boAt',
      categoryId: 'cat_electronics',
      sku: 'BOAT-BH-100',
      barcode: '8904130830018',
      unit: 'piece',
      purchasePrice: 280,
      sellingPrice: 399,
      taxRate: 18,
      imageUrl: 'https://ts2.mm.bing.net/th?id=OIP.hCADVzqEJJPo1szjL5VwcQHaHa&pid=15.1',
      isActive: true,
      description: 'Hawk inspired design wired earphones with 10mm dynamic bass drivers',
      inventory: { quantity: 25, lowStockThreshold: 6, reorderQuantity: 15 }
    },
    {
      id: 'prod_ele_02',
      name: 'Portronics 65W GaN Dual Port USB-C Fast Charger Adapter',
      brand: 'Portronics',
      categoryId: 'cat_electronics',
      sku: 'PORT-GAN-65W',
      barcode: '8906123490054',
      unit: 'piece',
      purchasePrice: 990,
      sellingPrice: 1499,
      taxRate: 18,
      imageUrl: 'https://ts1.mm.bing.net/th?id=OIP.TA0fjCXUJ3KU1o14iR91iwHaHa&pid=15.1',
      isActive: true,
      description: 'Gallium Nitride ultra compact wall charger for laptops, phones and tablets',
      inventory: { quantity: 12, lowStockThreshold: 3, reorderQuantity: 8 }
    },
    {
      id: 'prod_ele_03',
      name: 'Duracell Ultra Alkaline AA Batteries (Pack of 4)',
      brand: 'Duracell',
      categoryId: 'cat_electronics',
      sku: 'DUR-AA-4PK',
      barcode: '5000394002692',
      unit: 'pack',
      purchasePrice: 135,
      sellingPrice: 180,
      taxRate: 18,
      imageUrl: 'https://ts4.mm.bing.net/th?id=OIP.1Bo0AcDj_qGPLuJQVVP_WwHaHa&pid=15.1',
      isActive: true,
      description: 'Longest lasting AA batteries with Powercheck technology for high-drain devices',
      inventory: { quantity: 45, lowStockThreshold: 12, reorderQuantity: 30 }
    },
    {
      id: 'prod_ele_04',
      name: 'Amkette Braided USB-C to USB-C Fast Charging Cable 1.5m',
      brand: 'Amkette',
      categoryId: 'cat_electronics',
      sku: 'AMK-USBC-1.5M',
      barcode: '8904033201887',
      unit: 'piece',
      purchasePrice: 180,
      sellingPrice: 299,
      taxRate: 18,
      imageUrl: 'https://ts2.mm.bing.net/th?id=OIP.tgSb8-0CxGyULCfsvW7_HwHaHa&pid=15.1',
      isActive: true,
      description: 'Nylon braided 100W Power Delivery high speed syncing and charging cable',
      inventory: { quantity: 30, lowStockThreshold: 8, reorderQuantity: 20 }
    },

    // 7. PERSONAL CARE & GROOMING
    {
      id: 'prod_per_01',
      name: 'Nivea Men Deep Impact Charcoal Shower Gel & Face Wash 250ml',
      brand: 'Nivea Men',
      categoryId: 'cat_personal_care',
      sku: 'NIV-DEEP-250ML',
      barcode: '4005900543210',
      unit: 'bottle',
      purchasePrice: 165,
      sellingPrice: 225,
      taxRate: 18,
      imageUrl: 'https://ts2.mm.bing.net/th?id=OIP.5Lcu9CpATdkGkAFSIEdcCgHaHa&pid=15.1',
      isActive: true,
      description: '3-in-1 body, face and hair wash infused with micro-fine natural charcoal',
      inventory: { quantity: 20, lowStockThreshold: 5, reorderQuantity: 12 }
    },
    {
      id: 'prod_per_02',
      name: 'L’Oreal Paris Total Repair 5 Keratin Shampoo 650ml Pump',
      brand: "L'Oreal Paris",
      categoryId: 'cat_personal_care',
      sku: 'LOR-TR5-650ML',
      barcode: '8901526002109',
      unit: 'bottle',
      purchasePrice: 420,
      sellingPrice: 549,
      taxRate: 18,
      imageUrl: 'https://ts1.mm.bing.net/th?id=OIP.1BItNXBBsrpmvLCZy7VhLQHaF-&pid=15.1',
      isActive: true,
      description: 'Restores hair strength, density, shine and prevents split ends with Ceramide',
      inventory: { quantity: 16, lowStockThreshold: 4, reorderQuantity: 10 }
    },
    {
      id: 'prod_per_03',
      name: 'Dettol Skincare Liquid Handwash Germ Protection Refill 1.5L',
      brand: 'Dettol',
      categoryId: 'cat_personal_care',
      sku: 'DET-HAND-1.5L',
      barcode: '8901396388015',
      unit: 'pouch',
      purchasePrice: 165,
      sellingPrice: 219,
      taxRate: 18,
      imageUrl: 'https://ts1.mm.bing.net/th?id=OIP.3U4QcehMUT-MGgd7I4xgJQHaJ4&pid=15.1',
      isActive: true,
      description: '99.9% germ protection handwash enriched with added moisturizers',
      inventory: { quantity: 35, lowStockThreshold: 10, reorderQuantity: 20 }
    },
    {
      id: 'prod_per_04',
      name: 'Sensodyne Rapid Relief Sensitivity Toothpaste 100g',
      brand: 'Sensodyne',
      categoryId: 'cat_personal_care',
      sku: 'SEN-RAPID-100G',
      barcode: '8901030700019',
      unit: 'tube',
      purchasePrice: 175,
      sellingPrice: 220,
      taxRate: 18,
      imageUrl: 'https://ts1.mm.bing.net/th?id=OIP.p-SBhEYLZYjWTod5Ey2sVwHaHa&pid=15.1',
      isActive: true,
      description: 'Clinically proven fast relief from tooth sensitivity within 60 seconds',
      inventory: { quantity: 40, lowStockThreshold: 10, reorderQuantity: 25 }
    },

    // 8. HOME CARE & ECO CLEANING
    {
      id: 'prod_cln_01',
      name: 'Ariel Matic Top Load Liquid Detergent Fresh Scent 2L Bottle',
      brand: 'Ariel',
      categoryId: 'cat_home_cleaning',
      sku: 'ARI-MAT-2L',
      barcode: '8901030800023',
      unit: 'bottle',
      purchasePrice: 360,
      sellingPrice: 460,
      taxRate: 18,
      imageUrl: 'https://ts1.mm.bing.net/th?id=OIP.rT_ikqWsmYhwowueX7RT8wHaHa&pid=15.1',
      isActive: true,
      description: 'Tough stain removal in 1 wash with pleasant long-lasting fresh fragrance',
      inventory: { quantity: 22, lowStockThreshold: 6, reorderQuantity: 15 }
    },
    {
      id: 'prod_cln_02',
      name: 'Colin Glass and Multi-Surface Cleaner Trigger Spray 500ml',
      brand: 'Colin',
      categoryId: 'cat_home_cleaning',
      sku: 'COL-SPRY-500ML',
      barcode: '8901396340013',
      unit: 'bottle',
      purchasePrice: 82,
      sellingPrice: 105,
      taxRate: 18,
      imageUrl: 'https://ts4.mm.bing.net/th?id=OIP.wAek7wVHLizulvgXKsh4AAHaHa&pid=15.1',
      isActive: true,
      description: 'Shine boosters formula for streak-free sparkling glass and shiny surfaces',
      inventory: { quantity: 30, lowStockThreshold: 8, reorderQuantity: 20 }
    },
    {
      id: 'prod_cln_03',
      name: 'Godrej Aer Pocket Bathroom Fragrance Gel (Pack of 3)',
      brand: 'Godrej Aer',
      categoryId: 'cat_home_cleaning',
      sku: 'AER-PCKT-3PK',
      barcode: '8901023020018',
      unit: 'pack',
      purchasePrice: 135,
      sellingPrice: 175,
      taxRate: 18,
      imageUrl: 'https://ts2.mm.bing.net/th?id=OIP.TN8pn2wA9PV3Ymv2PQvGDQHaHa&pid=15.1',
      isActive: true,
      description: 'Unique power gel technology keeps bathrooms fragrant for up to 30 days',
      inventory: { quantity: 38, lowStockThreshold: 10, reorderQuantity: 25 }
    },

    // 9. HEALTH, FITNESS & NUTRITION
    {
      id: 'prod_hlf_01',
      name: 'MuscleBlaze 100% Whey Protein Isolate Rich Chocolate 1kg',
      brand: 'MuscleBlaze',
      categoryId: 'cat_health_fitness',
      sku: 'MB-WHEY-1KG',
      barcode: '8906067020017',
      unit: 'tub',
      purchasePrice: 2350,
      sellingPrice: 2999,
      taxRate: 18,
      imageUrl: 'https://ts3.mm.bing.net/th?id=OIP.1CGBZ3DNSLvyFmraVEYKxgHaK3&pid=15.1',
      isActive: true,
      description: '27g pure protein per scoop with 5.9g BCAAs and zero added sugar',
      inventory: { quantity: 10, lowStockThreshold: 3, reorderQuantity: 6 }
    },
    {
      id: 'prod_hlf_02',
      name: 'Fast&Up Charge Natural Vitamin C Effervescent 20 Tablets',
      brand: 'Fast&Up',
      categoryId: 'cat_health_fitness',
      sku: 'FST-VITC-20T',
      barcode: '8906097560012',
      unit: 'tube',
      purchasePrice: 275,
      sellingPrice: 350,
      taxRate: 18,
      imageUrl: 'https://ts3.mm.bing.net/th?id=OIP.Gwz7aumiGql5ZW1BcmYEJAHaHa&pid=15.1',
      isActive: true,
      description: 'Natural Amla extract 1000mg Vitamin C with Zinc for daily immune health',
      inventory: { quantity: 35, lowStockThreshold: 10, reorderQuantity: 20 }
    },

    // 10. STATIONERY & DESK SUPPLIES
    {
      id: 'prod_sta_11',
      name: 'Classmate Pulse Spiral Bound Single Line Notebooks (Pack of 4)',
      brand: 'Classmate',
      categoryId: 'cat_stationery',
      sku: 'CLS-SPIR-4PK',
      barcode: '8901030990014',
      unit: 'pack',
      purchasePrice: 215,
      sellingPrice: 280,
      taxRate: 12,
      imageUrl: 'https://ts1.mm.bing.net/th?id=OIP.om5pz-bW9sNvaPRMtUsp3gHaHa&pid=15.1',
      isActive: true,
      description: 'High brightness 70 GSM elemental chlorine free paper with twin wire spiral binding',
      inventory: { quantity: 24, lowStockThreshold: 6, reorderQuantity: 16 }
    },
    {
      id: 'prod_sta_12',
      name: 'Uni-ball Eye Fine Waterproof Roller Pen Black (Pack of 3)',
      brand: 'Uni-ball',
      categoryId: 'cat_stationery',
      sku: 'UNI-EYE-3PK',
      barcode: '4902778913610',
      unit: 'pack',
      purchasePrice: 185,
      sellingPrice: 240,
      taxRate: 12,
      imageUrl: 'https://ts1.mm.bing.net/th?id=OIP.e__GQBcNxXNnkuSoepiv6wHaHa&pid=15.1',
      isActive: true,
      description: 'Super Ink fade proof, waterproof 0.7mm stainless steel roller ball pens',
      inventory: { quantity: 30, lowStockThreshold: 8, reorderQuantity: 20 }
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
    
    // Check if initialized or missing products or outdated seed version
    const initializedVersion = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    const existingProducts = this.getItem(STORAGE_KEYS.PRODUCTS);
    
    if (initializedVersion !== 'pixelcode_seeded_catalog_v7' || !existingProducts || existingProducts.length === 0) {
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
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'pixelcode_seeded_catalog_v7');
    console.log('✅ pixelcode.in Local Storage initialized with new multi-category catalog');
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
