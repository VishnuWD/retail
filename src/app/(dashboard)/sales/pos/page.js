'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Percent, 
  DollarSign, 
  UserPlus, 
  Users, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  X,
  Keyboard,
  Printer,
  Download,
  FileText
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { apiClient } from '@/lib/api-client';
import { useStorage } from '@/lib/storage/StorageContext';
import { QrCode, Share2, Eye } from 'lucide-react';
import { printReceiptDirectly } from '@/lib/printer/receiptPrinter';
import ReceiptModal from '@/components/sales/ReceiptModal';

export default function POSPage() {
  const router = useRouter();
  const { t, tp, tc, tu, tb, ts } = useLanguage();
  
  // Search & suggestions
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef(null);

  // Cart state
  const [cart, setCart] = useState([]);
  const [cartDiscountType, setCartDiscountType] = useState('NONE'); // NONE, FIXED, PERCENT
  const [cartDiscountVal, setCartDiscountVal] = useState(0);
  const [mobileView, setMobileView] = useState('catalog'); // 'catalog' | 'cart'

  // Customers selection
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  
  // New Customer Modal
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  
  // Checkout & Settle state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [splitPayments, setSplitPayments] = useState([{ method: 'CASH', amount: 0, reference: '' }]);
  const [amountReceived, setAmountReceived] = useState(0);
  const [isCheckoutProcessing, setIsCheckoutProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [completedSaleResult, setCompletedSaleResult] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [isPrintingDirect, setIsPrintingDirect] = useState(false);

  // Keyboard shortcut help
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

  // Load defaults
  useEffect(() => {
    // Focus search box on load
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    
    // Bind keyboard listeners
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K: Focus product search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // Ctrl/Cmd + Enter: Open checkout payment settle
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (cart.length > 0) {
          openCheckoutSettle();
        }
      }
      
      // Esc: Close any open modal
      if (e.key === 'Escape') {
        setCheckoutModalOpen(false);
        setNewCustomerOpen(false);
        setShowShortcutHelp(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Debounced product lookup
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      performSearch('');
      return;
    }
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim().length > 1) {
        performSearch(searchQuery);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Execute query search
  const performSearch = async (query) => {
    setSearchLoading(true);
    try {
      const q = new URLSearchParams({ search: query, limit: '12' });
      const json = await apiClient.get(`/api/products?${q.toString()}`);
      if (json.success && json.data) {
        setProducts(json.data.products || []);
        
        // Barcode reader integration: If exact match barcode is returned, auto add it!
        const trimmed = query.trim();
        if (trimmed) {
          const matchesBarcode = (json.data.products || []).find(p => p.barcode === trimmed || p.sku === trimmed);
          if (matchesBarcode && matchesBarcode.inventory?.quantity > 0) {
            addToCart(matchesBarcode);
            setSearchQuery('');
            setProducts([]);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Customer search list
  useEffect(() => {
    if (customerSearchQuery.trim()) {
      const fetchCustomers = async () => {
        try {
          const json = await apiClient.get(`/api/customers?search=${encodeURIComponent(customerSearchQuery)}`);
          if (json.success && json.data) {
            setCustomers(json.data);
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchCustomers();
    } else {
      setCustomers([]);
    }
  }, [customerSearchQuery]);

  // Cart operations
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    const available = product.inventory?.quantity || 0;
    
    if (available <= 0) {
      alert(`"${product.name}" is out of stock!`);
      return;
    }

    if (existing) {
      if (existing.quantity >= available) {
        alert(`Only ${available} units of "${product.name}" are available in inventory.`);
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.name,
        brand: product.brand,
        unit: product.unit,
        imageUrl: product.imageUrl,
        unitPrice: product.sellingPrice,
        purchasePrice: product.purchasePrice,
        taxRate: product.taxRate,
        quantity: 1,
        discountType: 'NONE',
        discountVal: 0,
        maxStock: available
      }]);
    }
  };

  const updateCartQty = (productId, newQty) => {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    if (newQty <= 0) {
      // Remove
      setCart(cart.filter(i => i.id !== productId));
      return;
    }

    if (newQty > item.maxStock) {
      alert(`Only ${item.maxStock} units of "${item.name}" are available.`);
      return;
    }

    setCart(cart.map(i => i.id === productId ? { ...i, quantity: newQty } : i));
  };

  const updateItemDiscount = (productId, type, value) => {
    const numericVal = parseFloat(value) || 0;
    setCart(cart.map(item => {
      if (item.id === productId) {
        let actualDisc = 0;
        const subtotal = item.unitPrice * item.quantity;
        
        if (type === 'FIXED') {
          actualDisc = Math.min(subtotal, numericVal);
        } else if (type === 'PERCENT') {
          actualDisc = Math.min(subtotal, (subtotal * (numericVal / 100)));
        }
        
        return {
          ...item,
          discountType: type,
          discountVal: numericVal,
          lineDiscount: actualDisc
        };
      }
      return item;
    }));
  };

  // Cart total calculations
  const calculateCartTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;
    let itemsDiscountTotal = 0;

    cart.forEach(item => {
      const lineSubtotal = item.unitPrice * item.quantity;
      
      // Calculate item line discount
      let itemDisc = 0;
      if (item.discountType === 'FIXED') {
        itemDisc = Math.min(lineSubtotal, item.discountVal);
      } else if (item.discountType === 'PERCENT') {
        itemDisc = Math.min(lineSubtotal, (lineSubtotal * (item.discountVal / 100)));
      }
      
      const lineTaxable = lineSubtotal - itemDisc;
      const lineTax = lineTaxable * (item.taxRate / 100);
      
      subtotal += lineSubtotal;
      itemsDiscountTotal += itemDisc;
      taxTotal += lineTax;
    });

    // Calculate cart discount
    let cartDiscountAmount = 0;
    if (cartDiscountType === 'FIXED') {
      cartDiscountAmount = Math.min(subtotal - itemsDiscountTotal, cartDiscountVal);
    } else if (cartDiscountType === 'PERCENT') {
      cartDiscountAmount = Math.min(subtotal - itemsDiscountTotal, (subtotal - itemsDiscountTotal) * (cartDiscountVal / 100));
    }

    const totalDiscount = itemsDiscountTotal + cartDiscountAmount;
    const taxableAmount = Math.max(0, subtotal - totalDiscount);
    const grandTotal = taxableAmount + taxTotal;

    return {
      subtotal,
      cartDiscountAmount,
      totalDiscount,
      taxableAmount,
      tax: taxTotal,
      total: grandTotal
    };
  };

  const totals = calculateCartTotals();

  // Create Quick Customer Profile
  // Create Quick Customer Profile
  const handleQuickCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;

    try {
      const json = await apiClient.post('/api/customers', { name: newCustomerName, phone: newCustomerPhone });
      if (json.success && json.data) {
        setSelectedCustomer(json.data);
        setNewCustomerOpen(false);
        setNewCustomerName('');
        setNewCustomerPhone('');
      } else {
        alert(json.error?.message || 'Failed to create customer.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Settle checkout modal triggers
  const openCheckoutSettle = () => {
    setSplitPayments([{ method: 'CASH', amount: totals.total, reference: '' }]);
    setAmountReceived(totals.total);
    setCheckoutError(null);
    setCheckoutModalOpen(true);
  };

  // Adjust split payment array
  const addSplitPayment = () => {
    setSplitPayments([...splitPayments, { method: 'CASH', amount: 0, reference: '' }]);
  };

  const removeSplitPayment = (index) => {
    setSplitPayments(splitPayments.filter((_, i) => i !== index));
  };

  const updateSplitPayment = (index, field, value) => {
    const updated = splitPayments.map((p, i) => {
      if (i === index) {
        if (field === 'amount') {
          return { ...p, amount: parseFloat(value) || 0 };
        }
        return { ...p, [field]: value };
      }
      return p;
    });
    setSplitPayments(updated);

    // Sum cash payments for change returns calculations
    const cashTotal = updated
      .filter(p => p.method === 'CASH')
      .reduce((sum, p) => sum + p.amount, 0);
    setAmountReceived(cashTotal);
  };

  // Submit complete POS Sale
  const handleCompleteSale = async () => {
    const creditAmount = splitPayments
      .filter(p => p.method === 'CREDIT')
      .reduce((sum, p) => sum + p.amount, 0);

    if (creditAmount > 0 && !selectedCustomer) {
      setCheckoutError('Select a customer before creating a credit sale.');
      return;
    }

    setIsCheckoutProcessing(true);
    setCheckoutError(null);

    // Prepare payload matching API validations
    const payload = {
      customerId: selectedCustomer?.id || null,
      customerName: selectedCustomer?.name || 'Walk-in Customer',
      customerPhone: selectedCustomer?.phone || '',
      discountAmount: totals.cartDiscountAmount,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      totalAmount: totals.total,
      paidAmount: totals.total - creditAmount,
      dueAmount: creditAmount,
      paymentMethod: splitPayments[0]?.method || 'CASH',
      items: cart.map(i => {
        let lineDisc = 0;
        const lineSub = i.unitPrice * i.quantity;
        if (i.discountType === 'FIXED') lineDisc = i.discountVal;
        else if (i.discountType === 'PERCENT') lineDisc = lineSub * (i.discountVal / 100);

        return {
          productId: i.id,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountAmount: lineDisc,
          lineTotal: (i.unitPrice * i.quantity) - lineDisc
        };
      }),
      payments: splitPayments.map(p => ({
        method: p.method,
        amount: p.amount,
        reference: p.reference
      }))
    };

    try {
      const json = await apiClient.post('/api/sales', payload);

      if (!json.success) {
        throw new Error(json.error?.message || 'Checkout failed.');
      }

      const rawSale = json.data?.sale || json.data;
      const invoiceNumber = json.data?.invoiceNumber || rawSale?.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
      const changeDue = Math.max(0, amountReceived - totals.total);

      setCompletedSaleResult({
        sale: rawSale || { ...payload, invoiceNumber },
        invoiceNumber,
        change: changeDue,
        items: cart,
        total: totals.total,
        customer: selectedCustomer
      });

      setCart([]);
      setCartDiscountVal(0);
      setSelectedCustomer(null);
      setCheckoutModalOpen(false);
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setIsCheckoutProcessing(false);
    }
  };

  // Direct Invisible Thermal Print Trigger
  const printReceipt = async () => {
    if (!completedSaleResult) return;
    try {
      setIsPrintingDirect(true);
      const configuredPaper = business?.capabilities?.printPaperSize || '58mm';
      await printReceiptDirectly(completedSaleResult.sale, business, configuredPaper);
    } catch (err) {
      console.error('Direct print failed:', err);
    } finally {
      setIsPrintingDirect(false);
    }
  };

  // WhatsApp Share Invoice generator
  const shareWhatsAppInvoice = () => {
    if (!completedSaleResult) return;
    const phone = completedSaleResult.customer?.phone || '';
    const itemsText = completedSaleResult.items.map(i => `• ${i.name} (x${i.quantity}) - ₹${i.unitPrice * i.quantity}`).join('%0A');
    const msg = `*Green Mart Kirana - Invoice #${completedSaleResult.invoiceNumber}*%0A%0A*Items:*%0A${itemsText}%0A%0A*Total Amount:* ₹${completedSaleResult.total}%0A*Status:* Completed%0A%0AThank you for shopping with Green Mart! Call +91 98765 43210 for free home delivery.`;
    
    const url = phone 
      ? `https://wa.me/91${phone.replace(/\D/g, '')}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col gap-3 pb-16 md:pb-0">
      
      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden bg-slate-200/80 p-1 rounded-xl shrink-0">
        <button 
          type="button"
          onClick={() => setMobileView('catalog')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            mobileView === 'catalog' 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🔍 Scan & Items
        </button>
        <button 
          type="button"
          onClick={() => setMobileView('cart')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mobileView === 'cart' 
              ? 'bg-white text-indigo-600 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🛒 Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)}) • {formatCurrency(totals.total)}
        </button>
      </div>

      {/* Top Search bar, Customer dropdown selection */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0 ${mobileView === 'cart' ? 'hidden md:grid' : 'grid'}`}>
        
        {/* Product catalog scanner search */}
        <div className="md:col-span-2 relative flex items-center bg-white border border-slate-200 rounded-xl shadow-sm pr-3">
          <span className="pl-3.5 text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            ref={searchInputRef}
            className="w-full pl-3 pr-4 py-2.5 focus:outline-none text-sm font-semibold placeholder-slate-400"
            placeholder={t('pos.searchPlaceholder')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button 
            onClick={() => setShowShortcutHelp(true)}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            title="Keyboard Shortcuts"
          >
            <Keyboard size={18} />
          </button>
        </div>

        {/* Customer selectors */}
        <div className="relative flex items-center bg-white border border-slate-200 rounded-xl shadow-sm px-3.5 py-1">
          <Users size={16} className="text-slate-400 mr-2.5 shrink-0" />
          
          {selectedCustomer ? (
            <div className="flex-1 flex justify-between items-center text-sm font-bold text-slate-800">
              <span className="truncate">{selectedCustomer.name}</span>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-red-500 p-0.5 rounded ml-2"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex-1 relative">
              <input
                type="text"
                className="w-full py-1 text-sm font-semibold placeholder-slate-400 focus:outline-none"
                placeholder={t('pos.walkInCustomer')}
                value={customerSearchQuery}
                onChange={e => {
                  setCustomerSearchQuery(e.target.value);
                  setCustomerDropdownOpen(true);
                }}
                onFocus={() => setCustomerDropdownOpen(true)}
              />
              
              {customerDropdownOpen && (customerSearchQuery || customers.length > 0) && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setCustomerDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-20 text-xs font-semibold">
                    {customers.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerSearchQuery('');
                          setCustomerDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-indigo-50 border-b border-slate-50 flex flex-col"
                      >
                        <span className="font-bold text-slate-800">{c.name}</span>
                        {c.phone && <span className="text-[10px] text-slate-400 mt-0.5">{c.phone}</span>}
                      </button>
                    ))}
                    {customers.length === 0 && (
                      <div className="px-3 py-2 text-slate-400 italic">No customers found</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <button 
            onClick={() => setNewCustomerOpen(true)}
            className="ml-2 p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg shrink-0"
            title="Create customer profile"
          >
            <UserPlus size={15} />
          </button>
        </div>

      </div>

      {/* Main split grid: Left (Products Search results), Right (Cart) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
        
        {/* Left Side: Product Search Selection Grid */}
        <div className={`md:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-4 overflow-y-auto flex-col ${mobileView === 'cart' ? 'hidden md:flex' : 'flex'}`}>
          {searchLoading ? (
            <div className="flex-1 flex justify-center items-center gap-2 text-slate-500 text-sm font-semibold py-12">
              <Loader2 className="animate-spin text-indigo-600" size={20} /> Querying catalog database...
            </div>
          ) : searchQuery.trim().length <= 1 ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center text-slate-400 space-y-2 py-8">
              <ShoppingCart size={40} className="text-slate-300" />
              <h3 className="font-bold text-slate-700">POS Billing Register</h3>
              <p className="text-xs font-semibold text-slate-400 max-w-xs leading-relaxed">
                Scan product barcodes with a scanner gun or type in product details to load items to checkout.
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center text-slate-400 py-10">
              <AlertCircle size={28} className="text-slate-300 mb-2" />
              <span>No products found matching query.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {products.map(prod => {
                const stock = prod.inventory?.quantity || 0;
                const isOut = stock <= 0;
                return (
                  <div 
                    key={prod.id}
                    onClick={() => !isOut && addToCart(prod)}
                    className={`border border-slate-100 p-3 rounded-lg flex flex-col gap-2 transition-all text-xs font-semibold select-none cursor-pointer ${
                      isOut ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-indigo-400 hover:shadow-sm bg-white active:scale-98'
                    }`}
                  >
                    <div className="h-20 bg-slate-50 rounded border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                      {prod.imageUrl ? (
                        <img src={prod.imageUrl} className="h-full w-full object-cover" alt="" />
                      ) : (
                        <ShoppingCart className="text-slate-300" size={20} />
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800 line-clamp-2 leading-tight">{tp(prod.name)}</h4>
                        <span className="text-[10px] text-slate-400 font-bold mt-0.5 block">{tb(prod.brand) || '—'}</span>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-sm">{formatCurrency(prod.sellingPrice)}</span>
                        {isOut ? (
                          <span className="text-red-500 font-extrabold uppercase text-[9px] bg-red-50 px-1 rounded">{ts('OUT_OF_STOCK')}</span>
                        ) : (
                          <span className="text-slate-500 font-bold">{t('common.quantity')}: {stock}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Active Cart */}
        <div className={`bg-white border border-slate-200 rounded-xl shadow-sm flex-col overflow-hidden ${mobileView === 'catalog' ? 'hidden md:flex' : 'flex'}`}>
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <ShoppingCart size={16} /> Checkout Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)})
            </h3>
            {cart.length > 0 && (
              <button 
                onClick={() => setCart([])}
                className="text-xs text-red-600 hover:text-red-500 font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 px-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-slate-400 text-xs font-semibold py-12">
                <span>{t('pos.cartEmpty')}</span>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="py-3 flex flex-col gap-2 text-xs font-semibold">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-slate-900 line-clamp-1">{tp(item.name)}</span>
                    <button 
                      onClick={() => updateCartQty(item.id, 0)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                      <button 
                        type="button"
                        onClick={() => updateCartQty(item.id, item.quantity - 1)}
                        className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 rounded-l-lg"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="px-2 text-sm font-bold text-slate-800">{item.quantity}</span>
                      <button 
                        type="button"
                        onClick={() => updateCartQty(item.id, item.quantity + 1)}
                        className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 rounded-r-lg"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 block font-medium">@{formatCurrency(item.unitPrice)}</span>
                      <span className="font-bold text-slate-800 block text-sm">{formatCurrency(item.unitPrice * item.quantity)}</span>
                    </div>
                  </div>

                  {/* Line discounts */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded p-1.5 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Item Disc:</span>
                    <div className="flex items-center gap-1">
                      <select
                        value={item.discountType}
                        onChange={e => updateItemDiscount(item.id, e.target.value, item.discountVal)}
                        className="border border-slate-200 bg-white rounded text-[10px] font-bold px-1"
                      >
                        <option value="NONE">None</option>
                        <option value="FIXED">₹ Fixed</option>
                        <option value="PERCENT">% Percent</option>
                      </select>
                      {item.discountType !== 'NONE' && (
                        <input
                          type="number"
                          className="w-12 border border-slate-200 bg-white rounded text-[10px] px-1 focus:outline-none"
                          min="0"
                          value={item.discountVal}
                          onChange={e => updateItemDiscount(item.id, item.discountType, e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing summary */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 space-y-3 text-xs font-semibold">
            
            <div className="flex justify-between text-slate-500">
              <span>{t('pos.subtotal')}</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>

            {/* Cart wide discount */}
            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1.5">{t('pos.discount')}</span>
              <div className="flex items-center gap-1">
                <select
                  value={cartDiscountType}
                  onChange={e => {
                    setCartDiscountType(e.target.value);
                    setCartDiscountVal(0);
                  }}
                  className="border border-slate-200 bg-white rounded text-[10px] px-1 py-0.5"
                >
                  <option value="NONE">None</option>
                  <option value="FIXED">₹ Fixed</option>
                  <option value="PERCENT">% Percent</option>
                </select>
                {cartDiscountType !== 'NONE' && (
                  <input
                    type="number"
                    className="w-12 border border-slate-200 bg-white rounded text-[10px] px-1 py-0.5"
                    min="0"
                    value={cartDiscountVal}
                    onChange={e => setCartDiscountVal(parseFloat(e.target.value) || 0)}
                  />
                )}
              </div>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>{t('pos.tax')}</span>
              <span>{formatCurrency(totals.tax)}</span>
            </div>

            <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-900 font-extrabold text-sm">
              <span>{t('pos.total')}</span>
              <span className="text-indigo-600 text-lg">{formatCurrency(totals.total)}</span>
            </div>

            <button
              onClick={openCheckoutSettle}
              disabled={cart.length === 0}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 mt-2"
            >
              {t('pos.checkout')}
            </button>
          </div>

        </div>

      </div>

      {/* Floating Mobile Cart Action Bar */}
      {mobileView === 'catalog' && cart.length > 0 && (
        <div className="md:hidden fixed bottom-14 left-3 right-3 z-30 animate-in slide-in-from-bottom-2 duration-150">
          <button
            type="button"
            onClick={() => setMobileView('cart')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between font-bold text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-black">
                {cart.reduce((sum, i) => sum + i.quantity, 0)} items
              </span>
              <span>Review Cart & Settle</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-300 font-extrabold text-base">
              <span>{formatCurrency(totals.total)}</span>
              <span>→</span>
            </div>
          </button>
        </div>
      )}

      {/* NEW CUSTOMER MODAL */}
      {newCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setNewCustomerOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm border border-slate-200 p-6 space-y-4 z-50 text-sm font-semibold">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-base">Quick Customer Setup</h3>
              <button onClick={() => setNewCustomerOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleQuickCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Ramesh Kumar"
                  value={newCustomerName}
                  onChange={e => setNewCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Phone Number</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. 9876543210"
                  value={newCustomerPhone}
                  onChange={e => setNewCustomerPhone(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setNewCustomerOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHECKOUT SETTLEMENT MODAL */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-6">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setCheckoutModalOpen(false)} />
          
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 animate-in fade-in zoom-in-95 duration-150 z-50 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-lg">Billing Settle & Payment</h3>
              <button onClick={() => setCheckoutModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-sm font-semibold">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex justify-between items-center text-slate-800">
                <span className="font-bold">Total Bill Due:</span>
                <span className="text-2xl font-extrabold text-indigo-700">{formatCurrency(totals.total)}</span>
              </div>

              {checkoutError && (
                <div className="rounded-lg bg-red-50 p-3 border border-red-200 text-xs text-red-600 flex gap-2 items-center">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {/* Split Payment Options */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Allocation Split</h4>
                  <button
                    type="button"
                    onClick={addSplitPayment}
                    className="text-xs text-indigo-600 hover:text-indigo-500 font-bold"
                  >
                    + Add Split Method
                  </button>
                </div>

                <div className="space-y-3">
                  {splitPayments.map((pay, idx) => (
                    <div key={idx} className="border border-slate-200 p-3 rounded-xl bg-slate-50 space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 items-center">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Method</label>
                          <select
                            value={pay.method}
                            onChange={e => updateSplitPayment(idx, 'method', e.target.value)}
                            className="mt-1 block w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none"
                          >
                            <option value="CASH">Cash</option>
                            <option value="UPI">UPI (QR/GPay)</option>
                            <option value="CARD">Card</option>
                            <option value="CREDIT">Store Credit (Udhaar)</option>
                            <option value="BANK_TRANSFER">Bank NetTransfer</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Amount (₹)</label>
                          <input
                            type="number"
                            className="mt-1 block w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 text-xs font-bold text-right focus:outline-none"
                            value={pay.amount}
                            onChange={e => updateSplitPayment(idx, 'amount', e.target.value)}
                          />
                        </div>

                        <div className="col-span-2 sm:col-span-1 flex gap-1 items-end">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Reference</label>
                            <input
                              type="text"
                              className="mt-1 block w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none placeholder-slate-300"
                              placeholder="e.g. UPI Ref"
                              value={pay.reference}
                              onChange={e => updateSplitPayment(idx, 'reference', e.target.value)}
                            />
                          </div>
                          {splitPayments.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSplitPayment(idx)}
                              className="p-2 border border-red-200 bg-white text-red-500 rounded-lg hover:bg-red-50 shrink-0 mt-auto"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cash Return calculations */}
              {splitPayments.some(p => p.method === 'CASH') && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Cash Received</label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-right"
                      value={amountReceived}
                      onChange={e => setAmountReceived(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex flex-col justify-end text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Change Return</span>
                    <span className="text-xl font-extrabold text-emerald-600 mt-1 block">
                      {amountReceived > 0 ? formatCurrency(Math.max(0, amountReceived - splitPayments.filter(p => p.method === 'CASH').reduce((sum, p) => sum + p.amount, 0))) : '₹0.00'}
                    </span>
                  </div>
                </div>
              )}

              {/* UPI Dynamic QR Code Generator */}
              {splitPayments.some(p => p.method === 'UPI') && (
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="h-28 w-28 bg-white p-2 rounded-xl border border-indigo-200 flex flex-col items-center justify-center shadow-xs shrink-0">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=upi://pay?pa=greenmart@upi%26pn=GreenMart%26am=${totals.total}%26cu=INR`} 
                      alt="UPI QR Code"
                      className="h-24 w-24 object-contain"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-indigo-900 font-bold text-sm">
                      <QrCode size={16} className="text-indigo-600" />
                      <span>Instant UPI Scan & Pay</span>
                    </div>
                    <p className="text-xs text-indigo-700 font-medium">
                      Scan with Google Pay, PhonePe, Paytm, or BHIM.
                    </p>
                    <div className="text-[11px] font-mono text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-indigo-100 inline-block">
                      UPI ID: <span className="font-bold text-slate-900">greenmart@upi</span> • ₹{totals.total}
                    </div>
                  </div>
                </div>
              )}

              {/* Credit Udhaar selector reminder */}
              {splitPayments.some(p => p.method === 'CREDIT') && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 flex gap-2.5">
                  <AlertCircle size={18} className="shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900">Udhaar Khata Account Selected:</span>
                    <p className="mt-0.5 leading-relaxed">
                      {selectedCustomer 
                        ? `This will log ₹${splitPayments.filter(p => p.method === 'CREDIT').reduce((sum, p) => sum + p.amount, 0).toFixed(2)} to customer "${selectedCustomer.name}" ledger. Current outstanding: ₹${(selectedCustomer.outstandingCredit || 0).toFixed(2)}`
                        : 'Please select or add a Customer profile at the top first, or credit payment checkout will fail.'}
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Settle checkout footer */}
            <div className="flex justify-end gap-2 p-5 border-t border-slate-200 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setCheckoutModalOpen(false)}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={isCheckoutProcessing}
                className="flex items-center gap-1.5 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-200 disabled:opacity-50 cursor-pointer"
              >
                {isCheckoutProcessing ? <Loader2 size={16} className="animate-spin" /> : null}
                Complete Checkout Sale (₹{totals.total})
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SUCCESSFUL CHECKOUT SCREEN OVERLAY */}
      {completedSaleResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 p-6 text-center space-y-5 text-sm font-semibold select-none animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
              <CheckCircle size={32} />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">Sale Completed Successfully!</h3>
              <p className="text-xs text-slate-500 font-bold">Invoice #{completedSaleResult.invoiceNumber}</p>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-2 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold uppercase">Customer</span>
                <span className="font-bold text-slate-900">{completedSaleResult.customer?.name || 'Walk-in Customer'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold uppercase">Items Purchased</span>
                <span className="font-bold text-slate-900">{completedSaleResult.items?.length || 0} items</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/80 pt-2 text-sm">
                <span className="text-slate-700 font-bold">Total Amount Paid</span>
                <span className="font-extrabold text-indigo-600 text-base">₹{completedSaleResult.total}</span>
              </div>
              
              {completedSaleResult.change > 0 && (
                <div className="flex justify-between items-center border-t border-slate-200/80 pt-1 text-xs">
                  <span className="text-emerald-700 font-bold">Change Due to Customer</span>
                  <span className="font-extrabold text-emerald-600 text-sm">{formatCurrency(completedSaleResult.change)}</span>
                </div>
              )}
            </div>

            {/* Success checkout Actions */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={printReceipt}
                disabled={isPrintingDirect}
                className="flex items-center justify-center gap-1 px-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Printer size={14} /> {isPrintingDirect ? 'Printing...' : 'Direct Print'}
              </button>
              <button
                type="button"
                onClick={() => setReceiptModalOpen(true)}
                className="flex items-center justify-center gap-1 px-2 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Eye size={14} className="text-indigo-600" /> Preview
              </button>
              <button
                type="button"
                onClick={shareWhatsAppInvoice}
                className="flex items-center justify-center gap-1 px-2 py-2.5 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Share2 size={14} className="text-emerald-600" /> WhatsApp
              </button>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setCompletedSaleResult(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md cursor-pointer transition-all"
              >
                Start New POS Sale (Ctrl+K)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT PREVIEW MODAL */}
      <ReceiptModal 
        sale={completedSaleResult?.sale} 
        isOpen={receiptModalOpen} 
        onClose={() => setReceiptModalOpen(false)} 
      />

      {/* KEYBOARD SHORTCUT HELP BOX */}
      {showShortcutHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowShortcutHelp(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm border border-slate-200 p-6 space-y-4 z-50 text-sm font-semibold">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-base">Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcutHelp(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <div className="space-y-3 font-medium text-slate-700">
              <div className="flex justify-between items-center">
                <span>Focus product search bar</span>
                <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-bold">Ctrl + K</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Proceed to checkout settlement</span>
                <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-bold">Ctrl + Enter</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Close active popup / modal</span>
                <kbd className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-bold">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
