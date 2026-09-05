'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productEditSchema } from '@/lib/validations';
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  ImageIcon, 
  Loader2, 
  AlertTriangle, 
  Calendar,
  User,
  Boxes,
  Tag,
  Barcode,
  DollarSign,
  TrendingUp,
  X,
  Check,
  Sparkles
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import Link from 'next/link';

export default function ProductDetailPage({ params }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Modal State
  const [editModalOpen, setCreateModalOpen] = useState(false);
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [imageSuggestions, setImageSuggestions] = useState([]);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [imageSearchErr, setImageSearchErr] = useState(null);

  // Fetch product data details
  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to fetch product details.');
      }
      setProduct(json.data);
      setImageSearchQuery(json.data.name);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const json = await res.json();
      if (res.ok) {
        setCategories(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProductDetails();
    fetchCategories();
  }, [productId]);

  // Edit form declaration
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productEditSchema)
  });

  const watchPurchase = watch('purchasePrice') || 0;
  const watchSelling = watch('sellingPrice') || 0;
  const watchImageUrl = watch('imageUrl');

  // Compute margin in real-time
  const marginVal = watchSelling - watchPurchase;
  const marginPct = watchSelling > 0 ? (marginVal / watchSelling) * 100 : 0;

  const handleOpenEdit = () => {
    reset({
      name: product.name,
      brand: product.brand || '',
      categoryId: product.categoryId,
      description: product.description || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      unit: product.unit,
      imageUrl: product.imageUrl || '',
      isActive: product.isActive,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      taxRate: product.taxRate,
      lowStockThreshold: product.inventory?.lowStockThreshold || 10,
      reorderQuantity: product.inventory?.reorderQuantity || 20
    });
    setCreateModalOpen(true);
  };

  const onEditSubmit = async (data) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to update product.');
      }
      
      setCreateModalOpen(false);
      fetchProductDetails();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate this product? It will be hidden from new POS sales.')) return;
    try {
      const res = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/products');
      } else {
        const json = await res.json();
        throw new Error(json.error?.message || 'Failed to deactivate.');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Image search trigger calling backend proxy API
  const handleImageSearch = async () => {
    if (!imageSearchQuery.trim()) return;
    setImageSearchLoading(true);
    setImageSearchErr(null);
    setImageSuggestions([]);
    
    try {
      const res = await fetch('/api/images/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: imageSearchQuery })
      });
      const json = await res.json();
      
      if (json.success && json.data?.results?.length > 0) {
        setImageSuggestions(json.data.results);
      } else {
        setImageSearchErr(json.error?.message || 'No packaging images found.');
      }
    } catch (err) {
      setImageSearchErr('Failed to retrieve search results.');
    } finally {
      setImageSearchLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <span className="text-sm font-semibold">Retrieving product logs...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-600 mb-2" />
        <h3 className="font-bold text-lg">Failed to Retrieve Details</h3>
        <p className="text-sm mt-1">{error || 'Product not found.'}</p>
        <div className="mt-4 flex justify-center gap-2">
          <Link href="/products" className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-sm">
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const quantity = product.inventory?.quantity || 0;
  const threshold = product.inventory?.lowStockThreshold || 10;
  const isLow = quantity > 0 && quantity <= threshold;
  const isOut = quantity <= 0;

  // Margin calculation
  const marginValue = product.sellingPrice - product.purchasePrice;
  const marginPercentage = product.sellingPrice > 0 ? (marginValue / product.sellingPrice) * 100 : 0;

  return (
    <div className="space-y-6">
      
      {/* Back button and title */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/products" className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Product Ledger Audit</span>
            <h2 className="text-xl font-extrabold text-slate-900">{product.name}</h2>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDeactivate}
            disabled={!product.isActive}
            className="flex items-center gap-1 px-3 py-2 border border-red-200 bg-white hover:bg-red-50 text-red-600 rounded-lg text-sm font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} /> Deactivate
          </button>
          <button
            onClick={handleOpenEdit}
            className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-sm"
          >
            <Edit2 size={16} /> Edit Product
          </button>
        </div>
      </div>

      {/* Main Grid: Info card and Details card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left column: Visual Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="h-44 w-44 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
            {product.imageUrl ? (
              <img src={product.imageUrl} className="h-full w-full object-cover" alt="" />
            ) : (
              <ImageIcon className="text-slate-300" size={48} />
            )}
          </div>
          
          <div className="space-y-1">
            <h3 className="font-extrabold text-lg text-slate-900 leading-tight">{product.name}</h3>
            <p className="text-sm font-bold text-slate-500">{product.brand || 'No Brand'}</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
              {product.category.name}
            </span>
          </div>

          <div className="w-full pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-left">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
              {product.isActive ? (
                isOut ? (
                  <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 uppercase">Out of stock</span>
                ) : isLow ? (
                  <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">Low stock</span>
                ) : (
                  <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">In stock</span>
                )
              ) : (
                <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 uppercase">Inactive</span>
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sale Unit</span>
              <span className="text-sm font-bold text-slate-700 mt-1 block capitalize">{product.unit}</span>
            </div>
          </div>
        </div>

        {/* Right column: Audit Grid (Pricing, Inventory and IDs) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Stats sections grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            
            {/* Identification block */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b border-slate-100 pb-2">Identification</h4>
              
              <div className="space-y-3 text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-slate-400" />
                  <div>
                    <span className="text-xxs font-bold text-slate-400 block uppercase">SKU Code</span>
                    <span className="text-slate-700 font-mono text-xs">{product.sku || '—'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Barcode size={16} className="text-slate-400" />
                  <div>
                    <span className="text-xxs font-bold text-slate-400 block uppercase">Barcode</span>
                    <span className="text-slate-700 font-mono text-xs">{product.barcode || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing block */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b border-slate-100 pb-2">Pricing (INR)</h4>
              
              <div className="space-y-3 text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-slate-400" />
                  <div>
                    <span className="text-xxs font-bold text-slate-400 block uppercase">Purchase Price</span>
                    <span className="text-slate-700">{formatCurrency(product.purchasePrice)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-slate-400" />
                  <div>
                    <span className="text-xxs font-bold text-slate-400 block uppercase">Selling MRP</span>
                    <span className="text-indigo-600 font-bold">{formatCurrency(product.sellingPrice)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-400">%</div>
                  <div>
                    <span className="text-xxs font-bold text-slate-400 block uppercase">Gross Margin</span>
                    <span className="text-slate-700">₹{marginValue.toFixed(2)} ({marginPercentage.toFixed(0)}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory block */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider border-b border-slate-100 pb-2">Inventory Levels</h4>
              
              <div className="space-y-3 text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Boxes size={16} className="text-slate-400" />
                  <div>
                    <span className="text-xxs font-bold text-slate-400 block uppercase">Current Stock</span>
                    <span className={`font-extrabold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {quantity} {product.unit}s
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-slate-400" />
                  <div>
                    <span className="text-xxs font-bold text-slate-400 block uppercase">Low Stock Threshold</span>
                    <span className="text-slate-700">{threshold} units</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-400">R</div>
                  <div>
                    <span className="text-xxs font-bold text-slate-400 block uppercase">Reorder Quantity</span>
                    <span className="text-slate-700">+{product.inventory?.reorderQuantity || 20} units</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Product description (if any) */}
          {product.description && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-sm font-semibold">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Product Description</h4>
              <p className="text-slate-700 leading-relaxed font-medium">{product.description}</p>
            </div>
          )}

        </div>
      </div>

      {/* Product-level Stock Audit Trail (ledger transactions) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-base">Product Stock Audit Trail</h3>
        
        <div className="flow-root">
          <ul className="-mb-8">
            {product.inventoryTransactions.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-sm font-semibold">No stock ledger logs registered.</div>
            ) : (
              product.inventoryTransactions.map((tx, txIdx) => {
                const isAddition = tx.quantity > 0;
                
                return (
                  <li key={tx.id}>
                    <div className="relative pb-8">
                      {txIdx !== product.inventoryTransactions.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                      ) : null}
                      
                      <div className="relative flex space-x-3 text-sm font-semibold">
                        
                        {/* Circle Indicator */}
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                            isAddition ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {isAddition ? '+' : '—'}
                          </span>
                        </div>

                        {/* Audit Details */}
                        <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-slate-800">
                              <span className="font-extrabold">{isAddition ? `+${tx.quantity}` : tx.quantity}</span> {product.unit}s{' '}
                              <span className="text-slate-500 font-bold">({tx.type})</span>
                              {tx.note && <span className="text-slate-400 font-medium block text-xs mt-0.5">Note: "{tx.note}"</span>}
                            </p>
                          </div>
                          
                          <div className="text-right text-xs text-slate-500 font-medium shrink-0 space-y-1">
                            <time className="flex items-center gap-1 justify-end">
                              <Calendar size={12} className="text-slate-400" />
                              {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </time>
                            <div className="flex items-center gap-1 justify-end">
                              <User size={12} className="text-slate-400" />
                              {tx.user?.name || 'Ramesh'}
                            </div>
                          </div>

                        </div>

                      </div>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>

      {/* EDIT PRODUCT MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setCreateModalOpen(false)} />
          
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-lg">Edit Catalog Item Details</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onEditSubmit)} className="overflow-y-auto p-6 space-y-6 flex-1 text-sm font-semibold">
              
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Basic Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Product Name *</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      {...register('name')}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-600 font-bold">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Brand Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      {...register('brand')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Category *</label>
                    <select
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      {...register('categoryId')}
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    {errors.categoryId && <p className="mt-1 text-xs text-red-600 font-bold">{errors.categoryId.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">SKU Code</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      {...register('sku')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Barcode (EAN/UPC)</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      {...register('barcode')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Sale Unit</label>
                    <select
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      {...register('unit')}
                    >
                      <option value="piece">piece</option>
                      <option value="packet">packet</option>
                      <option value="box">box</option>
                      <option value="bottle">bottle</option>
                      <option value="jar">jar</option>
                      <option value="kg">kg</option>
                      <option value="liter">liter</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Description</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      {...register('description')}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Catalog Active Status</label>
                  <select
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    {...register('isActive', { setValueAs: v => v === 'true' })}
                  >
                    <option value="true">Active (Visible in POS)</option>
                    <option value="false">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Pricing section with margin calculation */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Pricing Configuration</h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Purchase Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      {...register('purchasePrice')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Selling Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      {...register('sellingPrice')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">GST Tax Rate</label>
                    <select
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      {...register('taxRate')}
                    >
                      <option value="0">0% GST</option>
                      <option value="5">5% GST</option>
                      <option value="12">12% GST</option>
                      <option value="18">18% GST</option>
                      <option value="28">28% GST</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimated Margin</div>
                      <div className="text-sm font-extrabold text-slate-800 mt-0.5">
                        ₹{marginVal.toFixed(2)} ({marginPct.toFixed(0)}%)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Alerts limits */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Stock Levels Thresholds</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Low Stock Alert Threshold</label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      {...register('lowStockThreshold')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Reorder Quantity</label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      {...register('reorderQuantity')}
                    />
                  </div>
                </div>
              </div>

              {/* Image Search within Edit form */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Product Thumbnail</h4>
                
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Product image URL..."
                    {...register('imageUrl')}
                  />

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">Search packaging photos:</span>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          className="px-2.5 py-1 border border-slate-300 rounded bg-white text-xs font-semibold placeholder-slate-300"
                          value={imageSearchQuery}
                          onChange={e => setImageSearchQuery(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={handleImageSearch}
                          disabled={imageSearchLoading}
                          className="flex items-center gap-1 px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold disabled:opacity-50"
                        >
                          {imageSearchLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Search
                        </button>
                      </div>
                    </div>

                    {imageSearchErr && (
                      <div className="text-xs text-amber-600 font-bold bg-amber-50 p-2 border border-amber-200 rounded">
                        {imageSearchErr}
                      </div>
                    )}

                    {imageSuggestions.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {imageSuggestions.map((img, idx) => (
                          <div 
                            key={idx}
                            onClick={() => setValue('imageUrl', img.imageUrl)}
                            className={`aspect-square rounded border cursor-pointer overflow-hidden relative flex items-center justify-center ${
                              watchImageUrl === img.imageUrl ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-200'
                            }`}
                          >
                            <img src={img.thumbnailUrl} className="h-full w-full object-cover" alt="" />
                            {watchImageUrl === img.imageUrl && (
                              <span className="absolute top-1 right-1 bg-indigo-600 text-white p-0.5 rounded-full">
                                <Check size={8} />
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  Update Product details
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
