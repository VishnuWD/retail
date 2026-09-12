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
  FileText,
  Zap,
  Copy,
  Check,
  Image as ImageIcon,
  ExternalLink,
  Send
} from 'lucide-react';
import { formatCurrency, formatNumber, formatWhatsAppPhone, generateWhatsAppInvoice, openWhatsAppLink } from '@/lib/utils';
import { downloadReceiptPng, copyReceiptImageToClipboard, shareReceiptImage } from '@/lib/printer/receiptCanvas';
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
  const { business } = useStorage();
  
  // Search & suggestions
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [posCategory, setPosCategory] = useState('ALL');
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
  const [whatsAppTargetPhone, setWhatsAppTargetPhone] = useState('');
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [imageSharedToast, setImageSharedToast] = useState(null);
  const [whatsAppFormat, setWhatsAppFormat] = useState('pdf'); // 'pdf' | 'image'
  const [isSendingWhatsAppApi, setIsSendingWhatsAppApi] = useState(false);

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
      const q = new URLSearchParams({ search: query, limit: query ? '24' : '48' });
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

      // Pre-fill phone if selected customer has phone
      setWhatsAppTargetPhone(selectedCustomer?.phone ? selectedCustomer.phone.replace(/\D/g, '') : '');
      setCopiedReceipt(false);

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

  // Direct Smart Share (Web Share API or WhatsApp fallback)
  const handleDirectShare = async () => {
    if (!completedSaleResult) return;
    const phoneToUse = whatsAppTargetPhone || completedSaleResult.customer?.phone || '';
    const invoiceUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/print/${completedSaleResult.invoiceNumber}?type=a4`
      : '';

    const shareTitle = `Receipt #${completedSaleResult.invoiceNumber} - ${business?.name || 'Green Mart'}`;
    const shareText = `🧾 Bill #${completedSaleResult.invoiceNumber}\nStore: ${business?.name || 'Green Mart'}\nCustomer: ${completedSaleResult.customer?.name || 'Walk-in Customer'}\nTotal Paid: ₹${completedSaleResult.total}\nView Invoice: ${invoiceUrl}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: invoiceUrl
        });
        setImageSharedToast('Receipt shared successfully!');
        setTimeout(() => setImageSharedToast(null), 3000);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.warn('Native share failed, falling back to WhatsApp:', err);
      }
    }

    shareWhatsAppInvoice(phoneToUse);
  };

  // Direct WhatsApp Send via Server API (PDF or Image)
  const handleDirectWhatsAppSend = async (formatOverride) => {
    if (!completedSaleResult) return;
    const phoneToUse = whatsAppTargetPhone || completedSaleResult.customer?.phone || '';
    if (!phoneToUse || phoneToUse.length < 10) {
      alert('Please enter a valid 10-digit customer mobile number.');
      return;
    }

    const fmt = formatOverride || whatsAppFormat;
    setIsSendingWhatsAppApi(true);

    try {
      const res = await apiClient.post('/api/whatsapp/send', {
        phone: phoneToUse,
        invoiceNumber: completedSaleResult.invoiceNumber,
        format: fmt,
        sale: {
          customerName: completedSaleResult.customer?.name || 'Walk-in Customer',
          totalAmount: completedSaleResult.total,
          items: completedSaleResult.items,
          subtotal: completedSaleResult.sale?.subtotal,
          discountAmount: completedSaleResult.sale?.discountAmount,
          taxAmount: completedSaleResult.sale?.taxAmount
        }
      });

      if (res.success) {
        if (res.data?.mode === 'CLOUD_API') {
          setImageSharedToast(`Bill ${fmt.toUpperCase()} dispatched to +${res.data.recipient} via WhatsApp!`);
        } else {
          // Open WhatsApp Web with the prefilled message & digital invoice link
          if (res.data?.whatsappWebUrl) {
            openWhatsAppLink(res.data.whatsappWebUrl);
          }
          setImageSharedToast(`Bill ${fmt.toUpperCase()} prepared for +${res.data.recipient}! Opened in WhatsApp.`);
        }
      } else {
        throw new Error(res.error?.message || 'Failed to dispatch WhatsApp message');
      }
    } catch (err) {
      console.warn('API send error, using fallback:', err.message);
      shareWhatsAppInvoice(phoneToUse);
    } finally {
      setIsSendingWhatsAppApi(false);
      setTimeout(() => setImageSharedToast(null), 5000);
    }
  };

  // WhatsApp Share Invoice generator
  const shareWhatsAppInvoice = (overridePhone) => {
    if (!completedSaleResult) return;
    const phoneToUse = overridePhone !== undefined ? overridePhone : (whatsAppTargetPhone || completedSaleResult.customer?.phone || '');
    
    const invoiceUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/print/${completedSaleResult.invoiceNumber}?type=a4`
      : '';

    const { url } = generateWhatsAppInvoice({
      phone: phoneToUse,
      invoiceNumber: completedSaleResult.invoiceNumber,
      storeName: business?.name || 'Green Mart Kirana',
      storePhone: business?.phone || '+91 98765 43210',
      items: completedSaleResult.items || [],
      subtotal: completedSaleResult.sale?.subtotal || completedSaleResult.total,
      discount: completedSaleResult.sale?.discountAmount || 0,
      tax: completedSaleResult.sale?.taxAmount || 0,
      total: completedSaleResult.total,
      customerName: completedSaleResult.customer?.name || 'Valued Customer',
      date: completedSaleResult.sale?.createdAt || new Date(),
      upiId: business?.upiId || '',
      footerNote: business?.capabilities?.receiptFooter || 'Free Home Delivery: +91 98765 43210',
      invoiceUrl
    });

    openWhatsAppLink(url);
  };

  // Share or copy receipt as PNG Image
  const handleShareReceiptImage = async () => {
    if (!completedSaleResult) return;
    const phoneToUse = whatsAppTargetPhone || completedSaleResult.customer?.phone || '';
    const invoiceUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/print/${completedSaleResult.invoiceNumber}?type=a4`
      : '';

    const saleData = {
      storeName: business?.name || 'Green Mart Kirana & Superstore',
      storeAddress: business?.address || 'Indiranagar, Bengaluru, Karnataka',
      storePhone: business?.phone || '+91 98765 43210',
      storeGstin: business?.taxNumber || '29ABCDE1234F1Z5',
      invoiceNumber: completedSaleResult.invoiceNumber,
      customerName: completedSaleResult.customer?.name || 'Walk-in Customer',
      customerPhone: phoneToUse,
      items: completedSaleResult.items || [],
      subtotal: completedSaleResult.sale?.subtotal || completedSaleResult.total,
      discount: completedSaleResult.sale?.discountAmount || 0,
      tax: completedSaleResult.sale?.taxAmount || 0,
      total: completedSaleResult.total,
      date: completedSaleResult.sale?.createdAt || new Date(),
      footerNote: business?.capabilities?.receiptFooter || 'Thank you for shopping with us! Visit again.'
    };

    const { url } = generateWhatsAppInvoice({
      ...saleData,
      phone: phoneToUse,
      invoiceUrl
    });

    const res = await shareReceiptImage(saleData, url);
    if (res === 'shared') {
      setImageSharedToast('Receipt image shared to WhatsApp!');
    } else if (res === 'copied') {
      setImageSharedToast('Receipt image copied to clipboard! Press Ctrl+V in WhatsApp to send.');
    }
    setTimeout(() => setImageSharedToast(null), 4500);
  };

  // Download receipt PNG image file
  const handleDownloadPng = () => {
    if (!completedSaleResult) return;
    downloadReceiptPng({
      storeName: business?.name || 'Green Mart Kirana & Superstore',
      storeAddress: business?.address || 'Indiranagar, Bengaluru, Karnataka',
      storePhone: business?.phone || '+91 98765 43210',
      storeGstin: business?.taxNumber || '29ABCDE1234F1Z5',
      invoiceNumber: completedSaleResult.invoiceNumber,
      customerName: completedSaleResult.customer?.name || 'Walk-in Customer',
      customerPhone: whatsAppTargetPhone || completedSaleResult.customer?.phone || '',
      items: completedSaleResult.items || [],
      subtotal: completedSaleResult.sale?.subtotal || completedSaleResult.total,
      discount: completedSaleResult.sale?.discountAmount || 0,
      tax: completedSaleResult.sale?.taxAmount || 0,
      total: completedSaleResult.total,
      date: completedSaleResult.sale?.createdAt || new Date(),
      footerNote: business?.capabilities?.receiptFooter || 'Thank you for shopping with us! Visit again.'
    });
  };

  // Open A4 Tax Invoice for Print / Save as PDF
  const handleOpenPdf = () => {
    if (!completedSaleResult) return;
    window.open(`/print/${completedSaleResult.invoiceNumber}?type=a4&autoprint=true`, '_blank');
  };

  // Copy structured invoice text to clipboard
  const copyReceiptText = () => {
    if (!completedSaleResult) return;
    const invoiceUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/print/${completedSaleResult.invoiceNumber}?type=a4`
      : '';

    const { text } = generateWhatsAppInvoice({
      phone: whatsAppTargetPhone || completedSaleResult.customer?.phone || '',
      invoiceNumber: completedSaleResult.invoiceNumber,
      storeName: business?.name || 'Green Mart Kirana',
      storePhone: business?.phone || '+91 98765 43210',
      items: completedSaleResult.items || [],
      subtotal: completedSaleResult.sale?.subtotal || completedSaleResult.total,
      discount: completedSaleResult.sale?.discountAmount || 0,
      tax: completedSaleResult.sale?.taxAmount || 0,
      total: completedSaleResult.total,
      customerName: completedSaleResult.customer?.name || 'Valued Customer',
      date: completedSaleResult.sale?.createdAt || new Date(),
      upiId: business?.upiId || '',
      footerNote: business?.capabilities?.receiptFooter || 'Free Home Delivery: +91 98765 43210',
      invoiceUrl
    });

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2500);
    }
  };

  return (
    <div className="h-full md:h-[calc(100dvh-7.25rem)] max-h-[calc(100dvh-7.25rem)] flex flex-col gap-3 overflow-hidden pb-16 md:pb-0">
      
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
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
        
        {/* Left Side: Product Search Selection Grid / Quick Frequently Bought Items */}
        <div className={`md:col-span-2 bg-white border border-slate-200/90 rounded-2xl shadow-sm p-4 flex flex-col h-full min-h-0 overflow-hidden ${mobileView === 'cart' ? 'hidden md:flex' : 'flex'}`}>
          {searchLoading ? (
            <div className="flex-1 flex justify-center items-center gap-2 text-slate-500 text-sm font-semibold py-16">
              <Loader2 className="animate-spin text-indigo-600" size={22} /> Loading catalog items...
            </div>
          ) : (
            (() => {
              const categoriesList = ['ALL', ...new Set(products.map(p => p.category?.name).filter(Boolean))];
              const filteredProducts = posCategory === 'ALL' 
                ? products 
                : products.filter(p => p.category?.name === posCategory);

              return (
                <>
                  {/* Frequently Sold & Quick Items Header & Category Filters when not actively searching */}
                  {searchQuery.trim().length <= 1 && (
                    <div className="flex flex-col gap-2.5 mb-4 shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shadow-2xs">
                            <Zap size={13} className="text-amber-500 fill-amber-400" />
                          </span>
                          <h3 className="font-black text-slate-900 text-sm tracking-tight">
                            Frequently Sold & Quick Items
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {filteredProducts.length} items
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">
                          ⚡ Tap or click to add directly to cart
                        </span>
                      </div>

                      {/* Category Quick Filter Chips */}
                      {categoriesList.length > 1 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                          {categoriesList.map(cat => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setPosCategory(cat)}
                              className={`px-3 py-1 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer ${
                                posCategory === cat
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                            >
                              {cat === 'ALL' ? '⭐ All Items' : tc(cat) || cat}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Active Search Query Header */}
                  {searchQuery.trim().length > 1 && (
                    <div className="flex items-center justify-between mb-3 shrink-0">
                      <span className="text-xs font-bold text-slate-700">
                        Search results for &ldquo;{searchQuery}&rdquo;
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {filteredProducts.length} items found
                      </span>
                    </div>
                  )}

                  {/* Products Grid Container with Independent Scroll */}
                  {filteredProducts.length === 0 ? (
                    <div className="flex-1 flex flex-col justify-center items-center text-center text-slate-400 py-12">
                      <AlertCircle size={32} className="text-slate-300 mb-2" />
                      <span className="text-sm font-semibold text-slate-600">No products found.</span>
                      <p className="text-xs text-slate-400 mt-1">Try another search term or select &ldquo;All Items&rdquo;.</p>
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1.5">
                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                        {filteredProducts.map(prod => {
                          const stock = prod.inventory?.quantity || 0;
                          const isOut = stock <= 0;
                          const cartItem = cart.find(i => i.id === prod.id);
                          const qtyInCart = cartItem ? cartItem.quantity : 0;

                          return (
                            <div 
                              key={prod.id}
                              onClick={() => !isOut && addToCart(prod)}
                              className={`group relative border p-3 rounded-xl flex flex-col justify-between gap-2.5 transition-all text-xs font-semibold select-none cursor-pointer ${
                                isOut 
                                  ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' 
                                  : qtyInCart > 0
                                  ? 'bg-indigo-50/40 border-indigo-300 shadow-xs ring-1 ring-indigo-200 hover:border-indigo-400 active:scale-98'
                                  : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-md active:scale-98'
                              }`}
                            >
                              {/* In-cart badge indicator */}
                              {qtyInCart > 0 && (
                                <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                                  <span>{qtyInCart} in cart</span>
                                </div>
                              )}

                              {/* Square Aspect Ratio Product Image */}
                              <div 
                                className="aspect-square w-full bg-slate-50/80 rounded-xl border border-slate-100/90 overflow-hidden flex items-center justify-center p-2 shrink-0 group-hover:scale-102 transition-transform"
                                style={{ aspectRatio: '1 / 1' }}
                              >
                                {prod.imageUrl ? (
                                  <img 
                                    src={prod.imageUrl} 
                                    className="w-full h-full object-contain aspect-square" 
                                    alt={prod.name} 
                                    loading="lazy"
                                    style={{ aspectRatio: '1 / 1' }}
                                  />
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-slate-400 gap-1 aspect-square" style={{ aspectRatio: '1 / 1' }}>
                                    <ShoppingCart className="text-slate-300" size={26} />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{tc(prod.category?.name) || 'Kirana'}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 flex flex-col justify-between">
                                <div>
                                  <h4 className="font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                                    {tp(prod.name)}
                                  </h4>
                                  <span className="text-[10px] text-slate-400 font-bold mt-0.5 block truncate">
                                    {tb(prod.brand) || '—'}
                                  </span>
                                </div>

                                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                                  <span className="font-black text-slate-900 text-sm">
                                    {formatCurrency(prod.sellingPrice)}
                                  </span>
                                  
                                  {isOut ? (
                                    <span className="text-red-600 font-extrabold uppercase text-[9px] bg-red-50 px-1.5 py-0.5 rounded">
                                      {ts('OUT_OF_STOCK')}
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addToCart(prod);
                                      }}
                                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white transition-colors"
                                    >
                                      <Plus size={12} />
                                      <span>Add</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              );
            })()
          )}
        </div>

        {/* Right Side: Active Cart (Pinned and Independently Scrollable) */}
        <div className={`md:col-span-1 bg-white border border-slate-200/90 rounded-2xl shadow-sm flex flex-col h-full min-h-0 overflow-hidden sticky top-0 ${mobileView === 'catalog' ? 'hidden md:flex' : 'flex'}`}>
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
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-slate-100 px-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 p-4 sm:p-6 text-center space-y-4 sm:space-y-5 text-sm font-semibold select-none animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[96vh] overflow-y-auto">
            <div className="mx-auto h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
              <CheckCircle size={30} className="sm:size-8" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-black text-slate-900">Sale Completed Successfully!</h3>
              <p className="text-xs text-slate-500 font-bold">Invoice #{completedSaleResult.invoiceNumber}</p>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-100 p-3 sm:p-4 space-y-2 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold uppercase">Customer</span>
                <span className="font-bold text-slate-900 truncate max-w-[180px]">{completedSaleResult.customer?.name || 'Walk-in Customer'}</span>
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

            {/* Image/Share Toast Notification */}
            {imageSharedToast && (
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center gap-2 animate-in fade-in">
                <Check size={14} className="text-emerald-600 shrink-0" />
                <span>{imageSharedToast}</span>
              </div>
            )}

            {/* Primary checkout Actions */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1">
              <button
                type="button"
                onClick={printReceipt}
                disabled={isPrintingDirect}
                className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] sm:text-xs font-extrabold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Printer size={14} className="shrink-0" /> <span className="truncate">{isPrintingDirect ? 'Printing...' : 'Direct Print'}</span>
              </button>
              <button
                type="button"
                onClick={handleDirectShare}
                className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] sm:text-xs font-extrabold transition-all shadow-sm shadow-emerald-200 cursor-pointer"
                title="Directly share bill via WhatsApp or System Share"
              >
                <Share2 size={14} className="shrink-0" /> <span className="truncate">Share Bill</span>
              </button>
              <button
                type="button"
                onClick={() => setReceiptModalOpen(true)}
                className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 bg-white rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Eye size={14} className="text-indigo-600 shrink-0" /> <span className="truncate">Preview Slip</span>
              </button>
            </div>

            {/* Secondary Quick Actions */}
            <div className="flex items-center justify-center gap-2.5 sm:gap-4 text-xs font-bold text-slate-500 pt-0.5 flex-wrap">
              <button 
                type="button" 
                onClick={handleOpenPdf}
                className="hover:text-indigo-600 flex items-center gap-1 transition-colors cursor-pointer"
                title="View / Save PDF Invoice"
              >
                <FileText size={13} className="text-indigo-500" /> Save PDF
              </button>
              <span className="text-slate-300">•</span>
              <button 
                type="button" 
                onClick={() => shareWhatsAppInvoice(whatsAppTargetPhone)}
                className="hover:text-emerald-600 flex items-center gap-1 transition-colors cursor-pointer"
                title="Open invoice in WhatsApp"
              >
                <Share2 size={13} className="text-emerald-500" /> WhatsApp
              </button>
              <span className="text-slate-300">•</span>
              <button 
                type="button" 
                onClick={copyReceiptText}
                className="hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
                title="Copy receipt link & summary to clipboard"
              >
                {copiedReceipt ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copiedReceipt ? 'Copied!' : 'Copy Link'}</span>
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
