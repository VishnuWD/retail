'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Search, 
  Trash2, 
  Plus, 
  PlusCircle,
  Loader2, 
  AlertTriangle,
  FileText,
  User,
  ShoppingBag,
  Percent,
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function NewPurchasePage() {
  const router = useRouter();

  // Suppliers list
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');

  // Cart & products lookup
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef(null);

  // Active items
  const [cart, setCart] = useState([]);
  const [autoReceive, setAutoReceive] = useState(false);
  const [poDiscount, setPoDiscount] = useState(0);

  // Modals state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Quick Product setup modal
  const [quickProductOpen, setQuickProductOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategoryId, setNewProdCategoryId] = useState('');
  const [newProdBrand, setNewProdBrand] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdBarcode, setNewProdBarcode] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('piece');
  const [newProdPurchasePrice, setNewProdPurchasePrice] = useState('');
  const [newProdSellingPrice, setNewProdSellingPrice] = useState('');
  const [newProdTaxRate, setNewProdTaxRate] = useState('0');
  const [quickProductSaving, setQuickProductSaving] = useState(false);
  const [quickProductError, setQuickProductError] = useState(null);

  // Load active suppliers and categories
  useEffect(() => {
    async function loadData() {
      try {
        const [supRes, catRes] = await Promise.all([
          fetch('/api/suppliers?limit=1000&status=ACTIVE'),
          fetch('/api/categories?limit=1000')
        ]);
        const supJson = await supRes.json();
        const catJson = await catRes.json();
        if (supRes.ok) setSuppliers(supJson.data.suppliers);
        if (catRes.ok) setCategories(catJson.data.categories || catJson.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  // Debounced product lookup
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        performProductSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 200);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const performProductSearch = async (query) => {
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/products?search=${query}&limit=6`);
      const json = await res.json();
      if (res.ok) {
        setSearchResults(json.data.products);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Cart Management
  const addToCart = (product) => {
    const existing = cart.find(i => i.productId === product.id);
    if (existing) {
      setCart(cart.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        brand: product.brand || '—',
        sku: product.sku || '—',
        quantity: 1,
        unitCost: product.purchasePrice || 0,
        discountAmount: 0,
        taxRate: product.taxRate || 0
      }]);
    }
    setSearchQuery('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  const updateCartItem = (idx, field, value) => {
    setCart(cart.map((item, i) => {
      if (i === idx) {
        if (field === 'quantity') {
          return { ...item, quantity: Math.max(1, parseInt(value) || 1) };
        }
        if (field === 'unitCost') {
          return { ...item, unitCost: Math.max(0, parseFloat(value) || 0) };
        }
        if (field === 'discountAmount') {
          return { ...item, discountAmount: Math.max(0, parseFloat(value) || 0) };
        }
        if (field === 'taxRate') {
          return { ...item, taxRate: Math.max(0, parseFloat(value) || 0) };
        }
      }
      return item;
    }));
  };

  const removeFromCart = (idx) => {
    setCart(cart.filter((_, i) => i !== idx));
  };

  // Totals calculations
  const calculateTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;
    let itemsDiscountTotal = 0;

    cart.forEach(item => {
      const lineSubtotal = item.unitCost * item.quantity;
      const lineTaxable = Math.max(0, lineSubtotal - item.discountAmount);
      const lineTax = lineTaxable * (item.taxRate / 100);

      subtotal += lineSubtotal;
      itemsDiscountTotal += item.discountAmount;
      taxTotal += lineTax;
    });

    const taxableAmount = Math.max(0, subtotal - itemsDiscountTotal - poDiscount);
    const grandTotal = taxableAmount + taxTotal;

    return {
      subtotal,
      itemsDiscountTotal,
      tax: taxTotal,
      total: grandTotal
    };
  };

  const totals = calculateTotals();

  // Create quick catalog product
  const handleSaveQuickProduct = async (e) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdCategoryId || !newProdPurchasePrice || !newProdSellingPrice) {
      setQuickProductError('Fill out all mandatory fields.');
      return;
    }

    setQuickProductSaving(true);
    setQuickProductError(null);

    const payload = {
      name: newProdName,
      categoryId: newProdCategoryId,
      brand: newProdBrand || null,
      sku: newProdSku || null,
      barcode: newProdBarcode || null,
      unit: newProdUnit,
      purchasePrice: parseFloat(newProdPurchasePrice),
      sellingPrice: parseFloat(newProdSellingPrice),
      taxRate: parseFloat(newProdTaxRate),
      lowStockThreshold: 10,
      reorderQuantity: 20
    };

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (res.ok) {
        // Add newly created product directly to cart
        addToCart(json.data);
        setQuickProductOpen(false);
        // Clear
        setNewProdName('');
        setNewProdCategoryId('');
        setNewProdBrand('');
        setNewProdSku('');
        setNewProdBarcode('');
        setNewProdPurchasePrice('');
        setNewProdSellingPrice('');
        setNewProdTaxRate('0');
      } else {
        throw new Error(json.error?.message || 'Failed to save product profile.');
      }
    } catch (err) {
      setQuickProductError(err.message);
    } finally {
      setQuickProductSaving(false);
    }
  };

  // Submit complete PO
  const handleSubmitPO = async () => {
    if (!selectedSupplierId) {
      setSubmitError('Select a supplier.');
      return;
    }
    if (cart.length === 0) {
      setSubmitError('Cart is empty.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      supplierId: selectedSupplierId,
      supplierInvoiceNumber: supplierInvoiceNumber || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : null,
      expectedDate: expectedDate ? new Date(expectedDate).toISOString() : null,
      notes: notes || null,
      discountAmount: poDiscount,
      autoReceive, // immediately receive stock
      items: cart.map(i => ({
        productId: i.productId,
        orderedQuantity: i.quantity,
        unitCost: i.unitCost,
        discountAmount: i.discountAmount,
        taxRate: i.taxRate
      }))
    };

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (res.ok) {
        router.push(`/purchases/${json.data.id}`);
      } else {
        throw new Error(json.error?.message || 'Failed to save purchase.');
      }
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Back button header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/purchases" className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Purchase Flow</span>
            <h2 className="text-xl font-extrabold text-slate-900">Log Purchase Order / Intake</h2>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="rounded-lg bg-red-50 p-3.5 border border-red-200 text-xs font-semibold text-red-600 flex gap-2 items-center">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Top Details panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold">
        
        {/* Supplier */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Supplier *</label>
          <select
            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            value={selectedSupplierId}
            onChange={e => setSelectedSupplierId(e.target.value)}
          >
            <option value="">Select Supplier</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name} {s.companyName ? `(${s.companyName})` : ''}</option>
            ))}
          </select>
        </div>

        {/* Invoice Number */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Supplier Bill / Invoice Number</label>
          <input
            type="text"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none"
            placeholder="e.g. INV-ABC-98213"
            value={supplierInvoiceNumber}
            onChange={e => setSupplierInvoiceNumber(e.target.value)}
          />
        </div>

        {/* Purchase Date */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Purchase Date</label>
          <input
            type="date"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none"
            value={purchaseDate}
            onChange={e => setPurchaseDate(e.target.value)}
          />
        </div>

        {/* Expected Date */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Expected Stock Arrival</label>
          <input
            type="date"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none"
            value={expectedDate}
            onChange={e => setExpectedDate(e.target.value)}
          />
        </div>

      </div>

      {/* Cart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Product Selector Cart rows */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Search selection input */}
          <div className="relative bg-white border border-slate-200 rounded-xl shadow-sm pr-3 flex items-center">
            <span className="pl-3.5 text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              ref={searchInputRef}
              className="w-full pl-3 pr-4 py-2.5 focus:outline-none text-xs font-semibold placeholder-slate-400"
              placeholder="Search catalog by name, brand, SKU or barcode..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />

            {searchResults.length === 0 && searchQuery.trim().length > 1 && !searchLoading && (
              <button
                type="button"
                onClick={() => setQuickProductOpen(true)}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded text-xxs font-bold shrink-0 flex items-center gap-1"
              >
                <PlusCircle size={12} /> Create Product
              </button>
            )}
            
            {searchResults.length > 0 && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSearchResults([])} />
                <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-20 text-xs font-semibold">
                  {searchResults.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-indigo-50 border-b border-slate-50 flex justify-between items-center"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{p.name}</span>
                        {p.brand && <span className="text-[10px] text-slate-400 block mt-0.5">Brand: {p.brand} | SKU: {p.sku}</span>}
                      </div>
                      <span className="text-[10px] text-slate-400">Stock: {p.inventory?.quantity || 0} units</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Cart table list */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs font-semibold">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-800 text-sm">
              Purchase Items List
            </div>

            {cart.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <ShoppingBag className="mx-auto text-slate-300" size={32} />
                <h3 className="font-bold text-slate-700">Stock Cart is Empty</h3>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Search active catalog lines at the top to add purchase quantities and cost snapshots.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th scope="col" className="px-4 py-2.5">Product</th>
                      <th scope="col" className="px-4 py-2.5 text-right w-20">Qty Ordered</th>
                      <th scope="col" className="px-4 py-2.5 text-right w-24">Unit Cost</th>
                      <th scope="col" className="px-4 py-2.5 text-right w-20">Line Disc</th>
                      <th scope="col" className="px-4 py-2.5 text-right w-20">Tax Rate</th>
                      <th scope="col" className="px-4 py-2.5 text-right">Line Total</th>
                      <th scope="col" className="px-4 py-2.5 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                    {cart.map((item, idx) => {
                      const lineSub = item.unitCost * item.quantity;
                      const lineTaxable = Math.max(0, lineSub - item.discountAmount);
                      const lineTax = lineTaxable * (item.taxRate / 100);
                      const total = lineTaxable + lineTax;

                      return (
                        <tr key={idx} className="align-middle">
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-900 block">{item.name}</span>
                            <span className="text-[9px] text-slate-400 block font-bold mt-0.5">SKU: {item.sku}</span>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              className="w-full border border-slate-200 rounded px-2 py-1 text-right focus:outline-none text-xs"
                              min="1"
                              value={item.quantity}
                              onChange={e => updateCartItem(idx, 'quantity', e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              className="w-full border border-slate-200 rounded px-2 py-1 text-right focus:outline-none text-xs"
                              min="0.01"
                              step="0.01"
                              value={item.unitCost}
                              onChange={e => updateCartItem(idx, 'unitCost', e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              className="w-full border border-slate-200 rounded px-2 py-1 text-right focus:outline-none text-xs font-semibold"
                              min="0"
                              value={item.discountAmount}
                              onChange={e => updateCartItem(idx, 'discountAmount', e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              className="w-full border border-slate-200 rounded px-2 py-1 text-right focus:outline-none text-xs"
                              min="0"
                              value={item.taxRate}
                              onChange={e => updateCartItem(idx, 'taxRate', e.target.value)}
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-extrabold text-slate-900">
                            {formatCurrency(total)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeFromCart(idx)}
                              className="p-1 text-slate-400 hover:text-red-500 rounded"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Totals and Save triggers */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4 text-xs font-semibold flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex justify-between items-center">
              <span>Checkout Settle</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Stock order</span>
            </h3>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Purchase notes / comments</label>
              <textarea
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none resize-none h-16"
                placeholder="e.g. Terms, delivery vehicle details..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2.5 text-slate-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-slate-800 font-bold">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Items discounts</span>
                <span className="text-red-500 font-bold">-{formatCurrency(totals.itemsDiscountTotal)}</span>
              </div>
              
              {/* Cart wide discount */}
              <div className="flex items-center justify-between">
                <span>Bill Discount</span>
                <input
                  type="number"
                  className="w-20 border border-slate-300 bg-white rounded px-2 py-0.5 text-right font-bold text-slate-700"
                  min="0"
                  value={poDiscount}
                  onChange={e => setPoDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="flex justify-between">
                <span>Taxes (GST output)</span>
                <span className="text-slate-800 font-bold">{formatCurrency(totals.tax)}</span>
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between font-extrabold text-sm text-slate-900">
                <span>Total Payable</span>
                <span className="text-indigo-600 text-lg">{formatCurrency(totals.total)}</span>
              </div>
            </div>

            {/* Instant Stock Intake selection checkbox */}
            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex gap-2 items-start text-xs text-indigo-950">
              <input
                type="checkbox"
                id="autoReceiveStockCheck"
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                checked={autoReceive}
                onChange={e => setAutoReceive(e.target.checked)}
              />
              <div>
                <label htmlFor="autoReceiveStockCheck" className="font-extrabold cursor-pointer block select-none">
                  Immediately receive stock
                </label>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5">
                  Check this to immediately increment inventory counts and log full stock intake to ledger. Leaving it unchecked creates a Purchase Order (receive later).
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={handleSubmitPO}
              disabled={isSubmitting || cart.length === 0}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {autoReceive ? 'Save & Receive Stock Now' : 'Save Purchase Order'}
            </button>
          </div>
        </div>

      </div>

      {/* QUICK PRODUCT CREATOR MODAL */}
      {quickProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-6">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setQuickProductOpen(false)} />
          
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 animate-in fade-in zoom-in-95 duration-150 z-50 flex flex-col max-h-[90vh] text-sm font-semibold text-slate-800">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Quick Product setup</h3>
              <button onClick={() => setQuickProductOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveQuickProduct} className="p-6 overflow-y-auto space-y-3 flex-1">
              
              {quickProductError && (
                <div className="rounded-lg bg-red-50 p-3 border border-red-200 text-xs text-red-600 flex gap-2 items-center">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{quickProductError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Product Name *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none"
                  placeholder="e.g. Britania Marie Gold Biscuits 200g"
                  value={newProdName}
                  onChange={e => setNewProdName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Category *</label>
                  <select
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none bg-white"
                    value={newProdCategoryId}
                    onChange={e => setNewProdCategoryId(e.target.value)}
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Brand Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none"
                    placeholder="e.g. Britannia"
                    value={newProdBrand}
                    onChange={e => setNewProdBrand(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">SKU Code</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none"
                    placeholder="e.g. BR-MARIE-200"
                    value={newProdSku}
                    onChange={e => setNewProdSku(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Barcode EAN</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none font-mono"
                    placeholder="e.g. 8901063142277"
                    value={newProdBarcode}
                    onChange={e => setNewProdBarcode(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Unit *</label>
                  <select
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none bg-white"
                    value={newProdUnit}
                    onChange={e => setNewProdUnit(e.target.value)}
                  >
                    <option value="piece">Piece (Pcs)</option>
                    <option value="packet">Packet</option>
                    <option value="box">Box</option>
                    <option value="bottle">Bottle</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="liter">Liter (L)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Purchase Cost *</label>
                  <input
                    type="number"
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none text-right font-bold text-slate-900"
                    placeholder="Cost ₹"
                    value={newProdPurchasePrice}
                    onChange={e => setNewProdPurchasePrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Retail Price *</label>
                  <input
                    type="number"
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none text-right font-bold text-slate-900"
                    placeholder="Selling ₹"
                    value={newProdSellingPrice}
                    onChange={e => setNewProdSellingPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Tax rate (GST %)</label>
                  <select
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none bg-white"
                    value={newProdTaxRate}
                    onChange={e => setNewProdTaxRate(e.target.value)}
                  >
                    <option value="0">0% (Exempt)</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST</option>
                    <option value="28">28% GST</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setQuickProductOpen(false)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickProductSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  {quickProductSaving ? 'Saving...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function X({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
