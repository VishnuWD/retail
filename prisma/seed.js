const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Load environment configuration
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing database tables...');
  await db.auditLog.deleteMany({});
  await db.saleReturnItem.deleteMany({});
  await db.saleReturn.deleteMany({});
  await db.salePayment.deleteMany({});
  await db.saleItem.deleteMany({});
  await db.sale.deleteMany({});
  await db.customerLedger.deleteMany({});
  await db.customer.deleteMany({});
  await db.invoiceSequence.deleteMany({});
  await db.inventoryTransaction.deleteMany({});
  await db.inventory.deleteMany({});
  await db.product.deleteMany({});
  await db.category.deleteMany({});
  await db.user.deleteMany({});
  await db.business.deleteMany({});

  console.log('Seeding Business "Green Mart"...');
  const business = await db.business.create({
    data: {
      name: 'Green Mart',
      legalName: 'Green Mart Retail Private Limited',
      phone: '9876543210',
      email: 'contact@greenmart.com',
      address: '12, 80 Feet Road, Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      currency: 'INR',
      taxNumber: '29AAAAA0000A1Z1'
    }
  });

  // Create Invoice Sequence counter for the business
  const invoiceSeq = await db.invoiceSequence.create({
    data: {
      businessId: business.id,
      prefix: 'INV-YYYY-',
      nextValue: 1
    }
  });

  console.log('Seeding Users with role permissions...');
  const ownerPassword = await bcrypt.hash('ramesh123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const cashierPassword = await bcrypt.hash('suresh123', 10);
  const inventoryPassword = await bcrypt.hash('anil123', 10);

  const owner = await db.user.create({
    data: {
      name: 'Ramesh (Owner)',
      email: 'ramesh@greenmart.com',
      password: ownerPassword,
      role: 'OWNER',
      businessId: business.id
    }
  });

  const manager = await db.user.create({
    data: {
      name: 'Amit (Manager)',
      email: 'amit@greenmart.com',
      password: managerPassword,
      role: 'MANAGER',
      businessId: business.id
    }
  });

  const cashier = await db.user.create({
    data: {
      name: 'Suresh (Cashier)',
      email: 'suresh@greenmart.com',
      password: cashierPassword,
      role: 'CASHIER',
      businessId: business.id
    }
  });

  const inventoryStaff = await db.user.create({
    data: {
      name: 'Anil (Inventory Staff)',
      email: 'anil@greenmart.com',
      password: inventoryPassword,
      role: 'INVENTORY',
      businessId: business.id
    }
  });

  console.log('Seeding Customers...');
  const raj = await db.customer.create({
    data: {
      businessId: business.id,
      name: 'Raj Kumar',
      phone: '9876543211',
      email: 'raj.kumar@gmail.com',
      address: 'Block 4, Koramangala, Bengaluru',
      outstandingCredit: 0.0
    }
  });

  const priya = await db.customer.create({
    data: {
      businessId: business.id,
      name: 'Priya Sharma',
      phone: '9988776655',
      email: 'priya.sharma@gmail.com',
      address: 'Sector 3, HSR Layout, Bengaluru',
      outstandingCredit: 0.0
    }
  });

  console.log('Seeding Categories...');
  const categoriesData = [
    { name: 'Dairy', description: 'Fresh milk, paneer, butter, cheese and curd.' },
    { name: 'Beverages', description: 'Soda, energy drinks, juices, tea and coffee.' },
    { name: 'Snacks', description: 'Biscuits, chips, chocolates and instant noodles.' },
    { name: 'Staples', description: 'Atta, rice, oil, sugar and lentils.' },
    { name: 'Household', description: 'Detergents, floor cleaners and dishwash bars.' },
    { name: 'Personal Care', description: 'Soaps, toothpaste, shampoos and lotions.' },
    { name: 'Stationery', description: 'Notebooks, pens, markers and staplers.' },
    { name: 'Toys', description: 'Board games, cards, cars and toys.' }
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const createdCat = await db.category.create({
      data: {
        name: cat.name,
        description: cat.description,
        businessId: business.id,
        isActive: true
      }
    });
    categories[cat.name] = createdCat;
  }

  console.log('Defining 100+ realistic product records...');
  const rawProducts = [
    // 1. Dairy
    { name: 'Amul Taaza Milk 1L', brand: 'Amul', category: 'Dairy', unit: 'packet', purchasePrice: 50.00, sellingPrice: 56.00, taxRate: 0, openingStock: 60, lowStock: 15, reorder: 40, barcode: '8901262010214', sku: 'AMUL-TZ-1L', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150&q=80' },
    { name: 'Amul Gold Milk 500ml', brand: 'Amul', category: 'Dairy', unit: 'packet', purchasePrice: 28.00, sellingPrice: 32.00, taxRate: 0, openingStock: 80, lowStock: 20, reorder: 50, barcode: '8901262010115', sku: 'AMUL-GD-500', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=150&q=80' },
    { name: 'Amul Butter 100g', brand: 'Amul', category: 'Dairy', unit: 'piece', purchasePrice: 42.00, sellingPrice: 48.00, taxRate: 12, openingStock: 30, lowStock: 8, reorder: 20, barcode: '8901262020015', sku: 'AMUL-BT-100' },
    { name: 'Amul Cheese Slices 200g', brand: 'Amul', category: 'Dairy', unit: 'packet', purchasePrice: 110.00, sellingPrice: 130.00, taxRate: 12, openingStock: 25, lowStock: 5, reorder: 15, barcode: '8901262030014', sku: 'AMUL-CH-200' },
    { name: 'Mother Dairy Paneer 200g', brand: 'Mother Dairy', category: 'Dairy', unit: 'piece', purchasePrice: 70.00, sellingPrice: 85.00, taxRate: 0, openingStock: 15, lowStock: 5, reorder: 10, barcode: '8901648000450', sku: 'MD-PN-200' },
    { name: 'Nandini Pure Ghee 1L', brand: 'Nandini', category: 'Dairy', unit: 'bottle', purchasePrice: 560.00, sellingPrice: 610.00, taxRate: 12, openingStock: 12, lowStock: 4, reorder: 8, barcode: '8906010090150', sku: 'ND-GH-1L' },
    { name: 'Amul Masti Dahi 400g', brand: 'Amul', category: 'Dairy', unit: 'cup', purchasePrice: 28.00, sellingPrice: 32.00, taxRate: 0, openingStock: 3, lowStock: 8, reorder: 20, barcode: '8901262040112', sku: 'AMUL-DH-400' },
    { name: 'Mother Dairy Curd 200g', brand: 'Mother Dairy', category: 'Dairy', unit: 'cup', purchasePrice: 18.00, sellingPrice: 22.00, taxRate: 0, openingStock: 0, lowStock: 10, reorder: 30, barcode: '8901648000551', sku: 'MD-CD-200' },
    
    // 2. Beverages
    { name: 'Coca-Cola 500ml', brand: 'Coca-Cola', category: 'Beverages', unit: 'bottle', purchasePrice: 30.00, sellingPrice: 40.00, taxRate: 18, openingStock: 100, lowStock: 15, reorder: 40, barcode: '5449000000996', sku: 'COKE-500ML', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150&q=80' },
    { name: 'Pepsi 2L', brand: 'Pepsi', category: 'Beverages', unit: 'bottle', purchasePrice: 70.00, sellingPrice: 95.00, taxRate: 18, openingStock: 40, lowStock: 10, reorder: 25, barcode: '8902083002021', sku: 'PEPSI-2L' },
    { name: 'Red Bull 250ml', brand: 'Red Bull', category: 'Beverages', unit: 'piece', purchasePrice: 100.00, sellingPrice: 125.00, taxRate: 18, openingStock: 48, lowStock: 12, reorder: 24, barcode: '9002490100070', sku: 'REDBULL-250' },
    { name: 'Frooti Mango 1L', brand: 'Parle Agro', category: 'Beverages', unit: 'box', purchasePrice: 50.00, sellingPrice: 65.00, taxRate: 12, openingStock: 30, lowStock: 8, reorder: 20, barcode: '8901491101859', sku: 'FROOTI-1L' },
    { name: 'Tata Tea Gold 500g', brand: 'Tata Tea', category: 'Beverages', unit: 'packet', purchasePrice: 180.00, sellingPrice: 220.00, taxRate: 5, openingStock: 25, lowStock: 6, reorder: 15, barcode: '8901058002319', sku: 'TATA-TEA-500' },
    { name: 'Bru Instant Coffee 100g', brand: 'Bru', category: 'Beverages', unit: 'jar', purchasePrice: 140.00, sellingPrice: 175.00, taxRate: 5, openingStock: 18, lowStock: 5, reorder: 12, barcode: '8901030753048', sku: 'BRU-COFFEE-100' },
    { name: 'Bisleri Mineral Water 1L', brand: 'Bisleri', category: 'Beverages', unit: 'bottle', purchasePrice: 14.00, sellingPrice: 20.00, taxRate: 18, openingStock: 120, lowStock: 24, reorder: 60, barcode: '8906001370070', sku: 'BISLERI-1L' },
    { name: 'Paper Boat Aam Panna 250ml', brand: 'Paper Boat', category: 'Beverages', unit: 'piece', purchasePrice: 28.00, sellingPrice: 35.00, taxRate: 12, openingStock: 4, lowStock: 10, reorder: 20, barcode: '8906046200950', sku: 'PBOAT-AP-250' },
    
    // 3. Snacks
    { name: 'Lays Classic Salted 50g', brand: 'Lays', category: 'Snacks', unit: 'packet', purchasePrice: 16.00, sellingPrice: 20.00, taxRate: 18, openingStock: 90, lowStock: 15, reorder: 40, barcode: '8901491102559', sku: 'LAYS-SLT-50G', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d20?w=150&q=80' },
    { name: 'Kurkure Masala Munch 90g', brand: 'Kurkure', category: 'Snacks', unit: 'packet', purchasePrice: 16.00, sellingPrice: 20.00, taxRate: 18, openingStock: 110, lowStock: 15, reorder: 40, barcode: '8901491501857', sku: 'KURKURE-MM-90' },
    { name: 'Oreo Biscuits 120g', brand: 'Cadbury', category: 'Snacks', unit: 'packet', purchasePrice: 24.00, sellingPrice: 30.00, taxRate: 18, openingStock: 60, lowStock: 12, reorder: 30, barcode: '7622210825316', sku: 'OREO-120G' },
    { name: 'Marie Gold 250g', brand: 'Britannia', category: 'Snacks', unit: 'packet', purchasePrice: 22.00, sellingPrice: 28.00, taxRate: 18, openingStock: 75, lowStock: 15, reorder: 30, barcode: '8901063142277', sku: 'BRIT-MARIE-250' },
    { name: 'Parle-G Biscuits 150g', brand: 'Parle', category: 'Snacks', unit: 'packet', purchasePrice: 8.00, sellingPrice: 10.00, taxRate: 18, openingStock: 200, lowStock: 30, reorder: 80, barcode: '8901725181223', sku: 'PARLE-G-150G' },
    { name: 'Maggi 2-Min Noodles 70g', brand: 'Maggi', category: 'Snacks', unit: 'packet', purchasePrice: 11.50, sellingPrice: 14.00, taxRate: 18, openingStock: 180, lowStock: 25, reorder: 50, barcode: '8901058002470', sku: 'MAGGI-70G' },
    { name: 'Hide & Seek Chocolate 100g', brand: 'Parle', category: 'Snacks', unit: 'packet', purchasePrice: 24.00, sellingPrice: 30.00, taxRate: 18, openingStock: 2, lowStock: 10, reorder: 20, barcode: '8901725191017', sku: 'PARLE-HS-100' },
    { name: 'Haldirams Alu Bhujia 150g', brand: 'Haldirams', category: 'Snacks', unit: 'packet', purchasePrice: 27.50, sellingPrice: 35.00, taxRate: 18, openingStock: 0, lowStock: 15, reorder: 30, barcode: '8904063200155', sku: 'HALDIRAM-AB-150' },
    
    // 4. Staples
    { name: 'Aashirvaad Atta 5kg', brand: 'Aashirvaad', category: 'Staples', unit: 'box', purchasePrice: 210.00, sellingPrice: 245.00, taxRate: 0, openingStock: 40, lowStock: 10, reorder: 20, barcode: '8901725181056', sku: 'AASH-ATTA-5K', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&q=80' },
    { name: 'Fortune Sunflower Oil 1L', brand: 'Fortune', category: 'Staples', unit: 'bottle', purchasePrice: 115.00, sellingPrice: 135.00, taxRate: 5, openingStock: 50, lowStock: 12, reorder: 30, barcode: '8906007281050', sku: 'FORT-SFOIL-1L' },
    { name: 'Tata Salt 1kg', brand: 'Tata', category: 'Staples', unit: 'packet', purchasePrice: 20.00, sellingPrice: 25.00, taxRate: 0, openingStock: 100, lowStock: 15, reorder: 40, barcode: '8901058890060', sku: 'TATA-SALT-1K' },
    { name: 'Daawat Basmati Rice 1kg', brand: 'Daawat', category: 'Staples', unit: 'packet', purchasePrice: 90.00, sellingPrice: 110.00, taxRate: 0, openingStock: 35, lowStock: 8, reorder: 20, barcode: '8901537006124', sku: 'DAAWAT-RICE-1K' },
    { name: 'Tata Sampann Toor Dal 1kg', brand: 'Tata', category: 'Staples', unit: 'packet', purchasePrice: 135.00, sellingPrice: 160.00, taxRate: 0, openingStock: 25, lowStock: 6, reorder: 15, barcode: '8901058894105', sku: 'TATA-TOORDAL-1K' },
    { name: 'Catch Turmeric Powder 100g', brand: 'Catch', category: 'Staples', unit: 'packet', purchasePrice: 22.00, sellingPrice: 28.00, taxRate: 5, openingStock: 40, lowStock: 10, reorder: 20, barcode: '8901192201058', sku: 'CATCH-HALDI-100' },
    { name: 'Madhur Sugar 1kg', brand: 'Madhur', category: 'Staples', unit: 'packet', purchasePrice: 42.00, sellingPrice: 50.00, taxRate: 5, openingStock: 60, lowStock: 15, reorder: 30, barcode: '8906012431050', sku: 'MADHUR-SUG-1K' },
    
    // 5. Household
    { name: 'Vim Dishwash Bar 125g', brand: 'Vim', category: 'Household', unit: 'piece', purchasePrice: 8.00, sellingPrice: 10.00, taxRate: 18, openingStock: 150, lowStock: 25, reorder: 50, barcode: '8901030784011', sku: 'VIM-BAR-125', image: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=150&q=80' },
    { name: 'Surf Excel Easy Wash 1kg', brand: 'Surf Excel', category: 'Household', unit: 'packet', purchasePrice: 110.00, sellingPrice: 135.00, taxRate: 18, openingStock: 35, lowStock: 8, reorder: 20, barcode: '8901030704408', sku: 'SURF-EASY-1K' },
    { name: 'Harpic Toilet Cleaner 500ml', brand: 'Harpic', category: 'Household', unit: 'bottle', purchasePrice: 72.00, sellingPrice: 88.00, taxRate: 18, openingStock: 25, lowStock: 6, reorder: 15, barcode: '8901396328320', sku: 'HARPIC-RED-500' },
    { name: 'Lizol Floor Cleaner 500ml', brand: 'Lizol', category: 'Household', unit: 'bottle', purchasePrice: 75.00, sellingPrice: 93.00, taxRate: 18, openingStock: 30, lowStock: 6, reorder: 15, barcode: '8901396348328', sku: 'LIZOL-CIT-500' },
    { name: 'Dettol Liquid Handwash 200ml', brand: 'Dettol', category: 'Household', unit: 'bottle', purchasePrice: 80.00, sellingPrice: 99.00, taxRate: 18, openingStock: 40, lowStock: 8, reorder: 20, barcode: '8901396388423', sku: 'DETTOL-HW-200' },
    { name: 'Hit Mosquito Spray 400ml', brand: 'Godrej', category: 'Household', unit: 'bottle', purchasePrice: 160.00, sellingPrice: 199.00, taxRate: 18, openingStock: 3, lowStock: 8, reorder: 15, barcode: '8901117275010', sku: 'HIT-MOSQ-400' },
    
    // 6. Personal Care
    { name: 'Dettol Bath Soap 125g', brand: 'Dettol', category: 'Personal Care', unit: 'piece', purchasePrice: 32.00, sellingPrice: 40.00, taxRate: 18, openingStock: 80, lowStock: 15, reorder: 40, barcode: '8901396378417', sku: 'DETTOL-SP-125', image: 'https://images.unsplash.com/photo-1607006342411-9243da19ffeb?w=150&q=80' },
    { name: 'Dove Cream Soap 100g', brand: 'Dove', category: 'Personal Care', unit: 'piece', purchasePrice: 44.00, sellingPrice: 55.00, taxRate: 18, openingStock: 50, lowStock: 10, reorder: 25, barcode: '8901030752072', sku: 'DOVE-SOAP-100' },
    { name: 'Colgate Strong Teeth 150g', brand: 'Colgate', category: 'Personal Care', unit: 'piece', purchasePrice: 78.00, sellingPrice: 94.00, taxRate: 18, openingStock: 45, lowStock: 10, reorder: 20, barcode: '8901314310507', sku: 'COLGATE-ST-150' },
    { name: 'Clinic Plus Shampoo 180ml', brand: 'Clinic Plus', category: 'Personal Care', unit: 'bottle', purchasePrice: 80.00, sellingPrice: 99.00, taxRate: 18, openingStock: 35, lowStock: 8, reorder: 15, barcode: '8901030691500', sku: 'CLINIC-SH-180' },
    { name: 'Parachute Coconut Oil 200ml', brand: 'Parachute', category: 'Personal Care', unit: 'bottle', purchasePrice: 85.00, sellingPrice: 100.00, taxRate: 5, openingStock: 40, lowStock: 8, reorder: 20, barcode: '8901088001085', sku: 'PARA-OIL-200' },
    
    // 7. Stationery
    { name: 'Classmate A4 Notebook 172 Pgs', brand: 'Classmate', category: 'Stationery', unit: 'piece', purchasePrice: 48.00, sellingPrice: 60.00, taxRate: 12, openingStock: 120, lowStock: 20, reorder: 50, barcode: '8901725181155', sku: 'CLASSMATE-A4-172', image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=150&q=80' },
    { name: 'Reynolds 045 Blue Pen', brand: 'Reynolds', category: 'Stationery', unit: 'piece', purchasePrice: 7.50, sellingPrice: 10.00, taxRate: 12, openingStock: 300, lowStock: 50, reorder: 100, barcode: '8901030790104', sku: 'REY-045-BLU' },
    { name: 'Nataraj 621 Pencil Box', brand: 'Nataraj', category: 'Stationery', unit: 'box', purchasePrice: 40.00, sellingPrice: 50.00, taxRate: 12, openingStock: 35, lowStock: 8, reorder: 20, barcode: '8901324001150', sku: 'NATARAJ-PENCIL-BOX' },
    { name: 'Fevicol MR Squeezy 100g', brand: 'Pidilite', category: 'Stationery', unit: 'bottle', purchasePrice: 35.00, sellingPrice: 45.00, taxRate: 12, openingStock: 5, lowStock: 10, reorder: 20, barcode: '8901262010313', sku: 'FEVICOL-MR-100' },
    
    // 8. Toys
    { name: 'Hot Wheels Diecast Car', brand: 'Hot Wheels', category: 'Toys', unit: 'piece', purchasePrice: 90.00, sellingPrice: 120.00, taxRate: 18, openingStock: 40, lowStock: 8, reorder: 20, barcode: '074299057854', sku: 'HW-DIECAST-CAR', image: 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=150&q=80' },
    { name: 'Monopoly Board Game classic', brand: 'Hasbro', category: 'Toys', unit: 'piece', purchasePrice: 750.00, sellingPrice: 999.00, taxRate: 18, openingStock: 10, lowStock: 3, reorder: 5, barcode: '5010993860505', sku: 'MONOPOLY-CLASSIC' },
    { name: 'UNO Card Game classic', brand: 'Mattel', category: 'Toys', unit: 'piece', purchasePrice: 110.00, sellingPrice: 150.00, taxRate: 18, openingStock: 25, lowStock: 6, reorder: 15, barcode: '078779313204', sku: 'UNO-CARDS' }
  ];

  const categoriesList = ['Dairy', 'Beverages', 'Snacks', 'Staples', 'Household', 'Personal Care', 'Stationery', 'Toys'];
  const brandsList = ['General', 'Nestle', 'Britannia', 'P&G', 'HUL', 'ITC', 'Dabur', 'Cadbury'];
  const unitsList = ['piece', 'packet', 'box', 'bottle', 'kg'];
  
  const currentCount = rawProducts.length;
  const targetCount = 105;
  
  for (let i = currentCount + 1; i <= targetCount; i++) {
    const category = categoriesList[i % categoriesList.length];
    const brand = brandsList[i % brandsList.length];
    const unit = unitsList[i % unitsList.length];
    const purchase = Math.round((20 + (i * 2.5)) * 100) / 100;
    const selling = Math.round((purchase * 1.25) * 100) / 100;
    
    rawProducts.push({
      name: `${brand} ${category} Pack Type-${i}`,
      brand: brand,
      category: category,
      unit: unit,
      purchasePrice: purchase,
      sellingPrice: selling,
      taxRate: i % 4 === 0 ? 18 : i % 3 === 0 ? 12 : i % 2 === 0 ? 5 : 0,
      openingStock: i % 12 === 0 ? 0 : i % 7 === 0 ? 4 : 25 + (i % 20),
      lowStock: 10,
      reorder: 25,
      barcode: `89000000${1000 + i}`,
      sku: `${brand.slice(0,3).toUpperCase()}-${category.slice(0,3).toUpperCase()}-${i}`
    });
  }

  console.log(`Seeding ${rawProducts.length} products...`);
  const createdProducts = [];
  const productMap = {};
  
  for (const item of rawProducts) {
    const category = categories[item.category];
    
    const product = await db.product.create({
      data: {
        businessId: business.id,
        categoryId: category.id,
        name: item.name,
        brand: item.brand,
        sku: item.sku,
        barcode: item.barcode,
        imageUrl: item.image || null,
        purchasePrice: item.purchasePrice,
        sellingPrice: item.sellingPrice,
        taxRate: item.taxRate,
        isActive: true,
        unit: item.unit
      }
    });
    
    await db.inventory.create({
      data: {
        businessId: business.id,
        productId: product.id,
        quantity: item.openingStock,
        lowStockThreshold: item.lowStock,
        reorderQuantity: item.reorder
      }
    });

    if (item.openingStock > 0) {
      await db.inventoryTransaction.create({
        data: {
          businessId: business.id,
          productId: product.id,
          type: 'OPENING_STOCK',
          quantity: item.openingStock,
          note: 'Database seed opening stock',
          createdBy: owner.id
        }
      });
    }
    
    createdProducts.push({
      ...product,
      stock: item.openingStock
    });
    productMap[product.id] = product;
  }

  console.log('Seeding sales, split payments, and customer credit ledger history...');
  const today = new Date();
  
  // Pick fast moving products
  const fastMovingProducts = createdProducts.filter(p => p.stock > 20).slice(0, 10);
  let globalInvoiceNum = 1;

  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const txDate = new Date(today);
    txDate.setDate(today.getDate() - dayOffset);
    
    // 3 Sales per day
    for (let s = 0; s < 3; s++) {
      const isCredit = s === 2; // Last transaction of day is credit
      const customer = isCredit ? (s % 2 === 0 ? raj : priya) : null;
      const paymentMethod = isCredit ? 'CREDIT' : (s === 1 ? 'UPI' : 'CASH');

      // Select random products to sell
      const itemsToBuy = [
        fastMovingProducts[(s + dayOffset) % fastMovingProducts.length],
        fastMovingProducts[(s + dayOffset + 3) % fastMovingProducts.length]
      ];

      let subtotal = 0;
      let taxAmount = 0;
      const saleItemsToInsert = [];

      for (const prod of itemsToBuy) {
        const qty = 1 + (globalInvoiceNum % 3); // 1 to 3 items
        const itemSubtotal = prod.sellingPrice * qty;
        const itemTax = itemSubtotal * (prod.taxRate / 100);
        
        subtotal += itemSubtotal;
        taxAmount += itemTax;

        saleItemsToInsert.push({
          productId: prod.id,
          productNameSnapshot: prod.name,
          skuSnapshot: prod.sku,
          barcodeSnapshot: prod.barcode,
          quantity: qty,
          unitPrice: prod.sellingPrice,
          taxRate: prod.taxRate,
          taxAmount: itemTax,
          lineTotal: itemSubtotal + itemTax
        });
      }

      const totalAmount = subtotal + taxAmount;
      const invoiceNumber = `INV-${txDate.getFullYear()}-${String(globalInvoiceNum).padStart(6, '0')}`;
      
      // Update sequence in sequence table
      await db.invoiceSequence.update({
        where: { businessId: business.id },
        data: { nextValue: globalInvoiceNum + 1 }
      });

      // Create Sale
      const sale = await db.sale.create({
        data: {
          businessId: business.id,
          invoiceNumber,
          customerId: customer ? customer.id : null,
          subtotal,
          discountAmount: 0,
          taxableAmount: subtotal,
          taxAmount,
          totalAmount,
          paidAmount: isCredit ? 0.0 : totalAmount,
          dueAmount: isCredit ? totalAmount : 0.0,
          status: 'COMPLETED',
          paymentStatus: isCredit ? 'UNPAID' : 'PAID',
          createdBy: cashier.id,
          createdAt: txDate
        }
      });

      // Insert Items & deduct inventory
      for (const item of saleItemsToInsert) {
        await db.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            productNameSnapshot: item.productNameSnapshot,
            skuSnapshot: item.skuSnapshot,
            barcodeSnapshot: item.barcodeSnapshot,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            lineTotal: item.lineTotal
          }
        });

        // Decrement stock
        await db.inventory.update({
          where: { productId: item.productId },
          data: { quantity: { decrement: item.quantity } }
        });

        await db.inventoryTransaction.create({
          data: {
            businessId: business.id,
            productId: item.productId,
            type: 'SALE',
            quantity: -item.quantity,
            referenceType: 'SALE',
            referenceId: sale.id,
            note: `POS seed sale #${invoiceNumber}`,
            createdBy: cashier.id,
            createdAt: txDate
          }
        });
      }

      // Settle Payments
      await db.salePayment.create({
        data: {
          saleId: sale.id,
          method: paymentMethod,
          amount: totalAmount,
          createdAt: txDate
        }
      });

      // Credit ledger mapping
      if (isCredit && customer) {
        // Increment customer outstanding
        const customerBefore = s % 2 === 0 ? raj.outstandingCredit : priya.outstandingCredit;
        const customerAfter = customerBefore + totalAmount;
        
        await db.customer.update({
          where: { id: customer.id },
          data: { outstandingCredit: { increment: totalAmount } }
        });

        await db.customerLedger.create({
          data: {
            businessId: business.id,
            customerId: customer.id,
            type: 'CREDIT',
            amount: totalAmount,
            balanceAfter: customerAfter,
            referenceType: 'SALE',
            referenceId: sale.id,
            note: `Store credit invoice #${invoiceNumber}`,
            createdBy: owner.id,
            createdAt: txDate
          }
        });

        // Update local memory outstanding for loop
        if (s % 2 === 0) raj.outstandingCredit = customerAfter;
        else priya.outstandingCredit = customerAfter;
      }

      globalInvoiceNum++;
    }
  }

  console.log('Seeding Wholesale Suppliers and Purchases...');
  
  // 1. Create Suppliers
  const abcDistributors = await db.supplier.create({
    data: {
      businessId: business.id,
      name: 'ABC Distributors',
      companyName: 'ABC Distributors Pvt Ltd',
      phone: '+91 9876543221',
      email: 'sales@abcdistributors.com',
      taxNumber: '29BBBBB0000B1Z1',
      address: 'Industrial Area, Yeshwanthpur, Bengaluru',
      notes: 'Payment terms: 15 days credit. Delivery on Tuesdays.'
    }
  });

  const xyzWholesale = await db.supplier.create({
    data: {
      businessId: business.id,
      name: 'XYZ Wholesale',
      companyName: 'XYZ Wholesale Corporation',
      phone: '+91 9988771122',
      email: 'orders@xyzwholesale.com',
      taxNumber: '29CCCCC0000C1Z1',
      address: 'Peenya Industrial Estate, Bengaluru',
      notes: 'No credit. Advance/UPI payments only.'
    }
  });

  // Find products to purchase
  const milk = createdProducts.find(p => p.sku === 'AMUL-TZ-1L');
  const coke = createdProducts.find(p => p.sku === 'COKE-500ML');
  const lays = createdProducts.find(p => p.sku === 'LAYS-SLT-50G');
  const vim = createdProducts.find(p => p.sku === 'VIM-BAR-125');

  // PO 1: Fully Received, Fully Paid
  const po1Date = new Date(today);
  po1Date.setDate(today.getDate() - 5);
  
  const po1 = await db.purchaseOrder.create({
    data: {
      businessId: business.id,
      supplierId: abcDistributors.id,
      purchaseOrderNumber: 'PO-2026-000001',
      supplierInvoiceNumber: 'ABC-99128',
      status: 'RECEIVED',
      paymentStatus: 'PAID',
      subtotal: 6200.0,
      discountAmount: 0.0,
      taxAmount: 252.0,
      totalAmount: 6452.0,
      paidAmount: 6452.0,
      dueAmount: 0.0,
      notes: 'Settle milk and beverage stocks',
      purchaseDate: po1Date,
      createdBy: owner.id,
      createdAt: po1Date
    }
  });

  await db.purchaseOrderItem.create({
    data: {
      purchaseOrderId: po1.id,
      productId: milk.id,
      productNameSnapshot: milk.name,
      skuSnapshot: milk.sku,
      orderedQuantity: 100,
      receivedQuantity: 100,
      unitCost: 48.00,
      discountAmount: 0,
      taxRate: 0,
      taxAmount: 0,
      lineTotal: 4800.0
    }
  });

  await db.purchaseOrderItem.create({
    data: {
      purchaseOrderId: po1.id,
      productId: coke.id,
      productNameSnapshot: coke.name,
      skuSnapshot: coke.sku,
      orderedQuantity: 50,
      receivedQuantity: 50,
      unitCost: 28.00,
      discountAmount: 0,
      taxRate: 18,
      taxAmount: 252.0,
      lineTotal: 1652.0
    }
  });

  // Increment stock
  await db.inventory.update({
    where: { productId: milk.id },
    data: { quantity: { increment: 100 } }
  });
  await db.inventory.update({
    where: { productId: coke.id },
    data: { quantity: { increment: 50 } }
  });

  // Create Inventory Transactions
  await db.inventoryTransaction.create({
    data: {
      businessId: business.id,
      productId: milk.id,
      type: 'PURCHASE',
      quantity: 100,
      referenceType: 'PURCHASE',
      referenceId: po1.id,
      note: 'Received stock from PO #PO-2026-000001',
      createdBy: owner.id,
      createdAt: po1Date
    }
  });
  await db.inventoryTransaction.create({
    data: {
      businessId: business.id,
      productId: coke.id,
      type: 'PURCHASE',
      quantity: 50,
      referenceType: 'PURCHASE',
      referenceId: po1.id,
      note: 'Received stock from PO #PO-2026-000001',
      createdBy: owner.id,
      createdAt: po1Date
    }
  });

  // Settle Payment PO 1
  const payment1 = await db.supplierPayment.create({
    data: {
      businessId: business.id,
      supplierId: abcDistributors.id,
      purchaseOrderId: po1.id,
      amount: 6452.0,
      method: 'UPI',
      reference: 'UPI-99283-OK',
      createdBy: owner.id,
      createdAt: po1Date
    }
  });

  // Ledger entries for PO 1
  await db.supplierLedger.create({
    data: {
      businessId: business.id,
      supplierId: abcDistributors.id,
      type: 'CREDIT',
      amount: 6452.0,
      balanceAfter: 6452.0,
      referenceType: 'PURCHASE',
      referenceId: po1.id,
      note: 'Received stock from PO #PO-2026-000001',
      createdBy: owner.id,
      createdAt: po1Date
    }
  });

  await db.supplierLedger.create({
    data: {
      businessId: business.id,
      supplierId: abcDistributors.id,
      type: 'PAYMENT',
      amount: -6452.0,
      balanceAfter: 0.0,
      referenceType: 'PAYMENT',
      referenceId: payment1.id,
      note: 'Payment settled for PO #PO-2026-000001',
      createdBy: owner.id,
      createdAt: po1Date
    }
  });


  // PO 2: Partially Received, Partially Paid
  const po2Date = new Date(today);
  po2Date.setDate(today.getDate() - 3);

  const po2 = await db.purchaseOrder.create({
    data: {
      businessId: business.id,
      supplierId: xyzWholesale.id,
      purchaseOrderNumber: 'PO-2026-000002',
      supplierInvoiceNumber: 'XYZ-7721',
      status: 'PARTIALLY_RECEIVED',
      paymentStatus: 'PARTIALLY_PAID',
      subtotal: 3000.0,
      discountAmount: 0.0,
      taxAmount: 540.0,
      totalAmount: 3540.0,
      paidAmount: 1000.0,
      dueAmount: 2540.0,
      notes: 'Bulk purchase salted chips',
      purchaseDate: po2Date,
      createdBy: owner.id,
      createdAt: po2Date
    }
  });

  await db.purchaseOrderItem.create({
    data: {
      purchaseOrderId: po2.id,
      productId: lays.id,
      productNameSnapshot: lays.name,
      skuSnapshot: lays.sku,
      orderedQuantity: 200,
      receivedQuantity: 120, // 120 units received
      unitCost: 15.00,
      discountAmount: 0,
      taxRate: 18,
      taxAmount: 540.0,
      lineTotal: 3540.0
    }
  });

  // Increment stock
  await db.inventory.update({
    where: { productId: lays.id },
    data: { quantity: { increment: 120 } }
  });

  // Create Inventory Transaction
  await db.inventoryTransaction.create({
    data: {
      businessId: business.id,
      productId: lays.id,
      type: 'PURCHASE',
      quantity: 120,
      referenceType: 'PURCHASE',
      referenceId: po2.id,
      note: 'Received stock from PO #PO-2026-000002',
      createdBy: owner.id,
      createdAt: po2Date
    }
  });

  // Settle Payment PO 2
  const payment2 = await db.supplierPayment.create({
    data: {
      businessId: business.id,
      supplierId: xyzWholesale.id,
      purchaseOrderId: po2.id,
      amount: 1000.0,
      method: 'CASH',
      createdBy: owner.id,
      createdAt: po2Date
    }
  });

  // Ledger entries for PO 2 (Credit is proportional to received goods: (3540 / 200) * 120 = 2124)
  await db.supplierLedger.create({
    data: {
      businessId: business.id,
      supplierId: xyzWholesale.id,
      type: 'CREDIT',
      amount: 2124.0,
      balanceAfter: 2124.0,
      referenceType: 'PURCHASE',
      referenceId: po2.id,
      note: 'Received stock from PO #PO-2026-000002',
      createdBy: owner.id,
      createdAt: po2Date
    }
  });

  await db.supplierLedger.create({
    data: {
      businessId: business.id,
      supplierId: xyzWholesale.id,
      type: 'PAYMENT',
      amount: -1000.0,
      balanceAfter: 1124.0,
      referenceType: 'PAYMENT',
      referenceId: payment2.id,
      note: 'Payment settled for PO #PO-2026-000002',
      createdBy: owner.id,
      createdAt: po2Date
    }
  });


  // PO 3: Ordered (not received), Unpaid
  const po3Date = new Date(today);
  po3Date.setDate(today.getDate() - 1);

  const po3 = await db.purchaseOrder.create({
    data: {
      businessId: business.id,
      supplierId: abcDistributors.id,
      purchaseOrderNumber: 'PO-2026-000003',
      supplierInvoiceNumber: 'ABC-99432',
      status: 'ORDERED',
      paymentStatus: 'UNPAID',
      subtotal: 3750.0,
      discountAmount: 0.0,
      taxAmount: 675.0,
      totalAmount: 4425.0,
      paidAmount: 0.0,
      dueAmount: 4425.0,
      notes: 'Pre-order dishwash bars',
      purchaseDate: po3Date,
      createdBy: owner.id,
      createdAt: po3Date
    }
  });

  await db.purchaseOrderItem.create({
    data: {
      purchaseOrderId: po3.id,
      productId: vim.id,
      productNameSnapshot: vim.name,
      skuSnapshot: vim.sku,
      orderedQuantity: 500,
      receivedQuantity: 0,
      unitCost: 7.50,
      discountAmount: 0,
      taxRate: 18,
      taxAmount: 675.0,
      lineTotal: 4425.0
    }
  });

  // Note: No ledger or inventory for PO 3 because no items are received yet!

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
