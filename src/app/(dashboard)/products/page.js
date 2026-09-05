'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema } from '@/lib/validations';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download, 
  Upload, 
  Image as ImageIcon,
  Check, 
  X, 
  Loader2, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Camera
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { apiClient } from '@/lib/api-client';

export default function ProductsPage() {
  const router = useRouter();
  const { t, tp, tc, tu, tb, ts } = useLanguage();

  // Catalog products state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [error, setError] = useState(null);

  // Filters and queries state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedSort, setSelectedSort] = useState('name');
  const [selectedOrder, setSelectedOrder] = useState('asc');
  const [page, setPage] = useState(1);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  
  // Image search within Create Product modal
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [imageSuggestions, setImageSuggestions] = useState([]);
  const [imageSearchLoading, setImageSearchLoading] = useState(false);
  const [imageSearchErr, setImageSearchErr] = useState(null);

  // CSV Import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importErr, setImportErr] = useState(null);

  // Fetch product list
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        search,
        categoryId: selectedCategory,
        status: selectedStatus,
        brand: selectedBrand,
        sort: selectedSort,
        order: selectedOrder,
        page: String(page),
        limit: '10'
      });
      const json = await apiClient.get(`/api/products?${q.toString()}`);
      if (json.success && json.data) {
        setProducts(json.data.products || []);
        setMeta(json.data.meta || { page: 1, pages: 1, total: (json.data.products || []).length });
      } else {
        throw new Error(json.error?.message || 'Failed to fetch products.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const json = await apiClient.get('/api/categories');
      if (json.success && json.data) {
        setCategories(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, selectedStatus, selectedBrand, selectedSort, selectedOrder, page]);

  // Form for creating product
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      brand: '',
      categoryId: '',
      description: '',
      sku: '',
      barcode: '',
      unit: 'piece',
      imageUrl: '',
      purchasePrice: 0,
      sellingPrice: 0,
      taxRate: 0,
      openingStock: 0,
      lowStockThreshold: 10,
      reorderQuantity: 20
    }
  });

  const watchPurchase = watch('purchasePrice') || 0;
  const watchSelling = watch('sellingPrice') || 0;
  const watchImageUrl = watch('imageUrl');

  // Compute margins in real-time
  const marginVal = watchSelling - watchPurchase;
  const marginPct = watchSelling > 0 ? (marginVal / watchSelling) * 100 : 0;

  // Handle product create submit
  const onCreateSubmit = async (data, force = false) => {
    try {
      const payload = { ...data };
      if (force) {
        payload.forceCreate = true;
      }
      
      const json = await apiClient.post('/api/products', payload);
      
      if (!json.success) {
        if (json.error?.code === 'DUPLICATE_WARNING') {
          // Trigger duplicate warnings prompt
          setDuplicateWarning({
            message: json.error.message,
            existingProduct: json.error.existingProduct,
            data
          });
          return;
        }
        throw new Error(json.error?.message || 'Failed to register product.');
      }
      
      // Reset
      reset();
      setCreateModalOpen(false);
      setDuplicateWarning(null);
      setImageSuggestions([]);
      fetchProducts();
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
      const json = await apiClient.post('/api/images/search', { query: imageSearchQuery });
      
      if (json.success && json.data?.results?.length > 0) {
        setImageSuggestions(json.data.results);
      } else {
        setImageSearchErr(json.error?.message || 'No packaging images found. Try a different search term.');
      }
    } catch (err) {
      setImageSearchErr('Failed to retrieve search results.');
    } finally {
      setImageSearchLoading(false);
    }
  };

  // Safe manual CSV parser (handles quotes and commas correctly)
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const results = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      let row = [];
      let inQuotes = false;
      let val = '';
      
      for (let char of line) {
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(val.trim());
          val = '';
        } else {
          val += char;
        }
      }
      row.push(val.trim());
      
      if (row.length === headers.length) {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index]?.replace(/^["']|["']$/g, '') || '';
        });
        results.push(obj);
      }
    }
    return results;
  };

  // Handle CSV file selection and run backend validation preview
  const handleCsvChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);
    setImportErr(null);
    setImportLoading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target.result;
          const productsData = parseCSV(text);
          
          if (productsData.length === 0) {
            throw new Error('CSV file is empty or headers are missing.');
          }
          
          // Send to API with preview: true to validate
          const json = await apiClient.post('/api/products/import', { products: productsData, preview: true });
          
          if (json.success && json.data) {
            setImportPreview(json.data);
          } else {
            throw new Error(json.error?.message || 'CSV validation failed.');
          }
        } catch (err) {
          setImportErr(err.message);
          setImportPreview(null);
        } finally {
          setImportLoading(false);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setImportErr('Failed to read file.');
      setImportLoading(false);
    }
  };

  // Confirm and execute bulk imports
  const executeImport = async () => {
    if (!importPreview || importPreview.validCount === 0) return;
    setImportLoading(true);
    try {
      const productsData = importPreview.validItems.map(item => item.data);
      const json = await apiClient.post('/api/products/import', { products: productsData, preview: false });
      
      if (json.success && json.data) {
        alert(`Successfully imported ${json.data.importedCount} products!`);
        setImportModalOpen(false);
        setCsvFile(null);
        setImportPreview(null);
        fetchProducts();
      } else {
        throw new Error(json.error?.message || 'Bulk import failed.');
      }
    } catch (err) {
      setImportErr(err.message);
    } finally {
      setImportLoading(false);
    }
  };

  // Export current list to CSV
  const handleExport = async () => {
    try {
      const q = new URLSearchParams({
        search,
        categoryId: selectedCategory,
        status: selectedStatus,
        brand: selectedBrand
      });
      const json = await apiClient.get(`/api/products/export?${q.toString()}`);
      
      if (!json.success || !json.data) throw new Error(json.error?.message || 'Failed to export.');
      
      const headers = ['name', 'brand', 'category', 'sku', 'barcode', 'purchasePrice', 'sellingPrice', 'taxRate', 'unit', 'stock'];
      const csvRows = [headers.join(',')];
      
      json.data.forEach(p => {
        const row = [
          `"${p.name.replace(/"/g, '""')}"`,
          `"${(p.brand || '').replace(/"/g, '""')}"`,
          `"${p.category.name.replace(/"/g, '""')}"`,
          `"${p.sku || ''}"`,
          `"${p.barcode || ''}"`,
          p.purchasePrice,
          p.sellingPrice,
          p.taxRate,
          p.unit,
          p.inventory?.quantity || 0
        ];
        csvRows.push(row.join(','));
      });
      
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('href', url);
      a.setAttribute('download', `Kirana_Products_Export_${new Date().toISOString().slice(0,10)}.csv`);
      a.click();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Buttons and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        
        {/* Search Input Box */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-semibold shadow-sm"
            placeholder={t('products.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Action buttons (Import, Export, Add) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold shadow-sm"
          >
            <Upload size={16} /> {t('common.import')}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold shadow-sm"
          >
            <Download size={16} /> {t('common.export')}
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-sm"
          >
            <Plus size={16} /> {t('products.addProduct')}
          </button>
        </div>

      </div>

      {/* Filter and Sorting bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        
        {/* Category filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider">{t('common.category')}</label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">{t('products.allCategories')}</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{tc(c.name)}</option>
            ))}
          </select>
        </div>

        {/* Stock status filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider">{t('common.status')}</label>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">{t('products.allStatuses')}</option>
            <option value="IN_STOCK">{ts('IN_STOCK')}</option>
            <option value="LOW_STOCK">{ts('LOW_STOCK')}</option>
            <option value="OUT_OF_STOCK">{ts('OUT_OF_STOCK')}</option>
            <option value="INACTIVE">{ts('INACTIVE')}</option>
          </select>
        </div>

        {/* Brand filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider">{t('common.brand')}</label>
          <input
            type="text"
            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-300"
            placeholder="e.g. Amul"
            value={selectedBrand}
            onChange={(e) => {
              setSelectedBrand(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Sort column selection */}
        <div className="flex flex-col gap-1">
          <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Sort By</label>
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="name">Product Name</option>
            <option value="sellingPrice">Selling Price</option>
            <option value="purchasePrice">Purchase Price</option>
            <option value="stock">Stock Count</option>
            <option value="updatedAt">Recently Updated</option>
          </select>
        </div>

        {/* Sort order toggle */}
        <div className="flex flex-col gap-1">
          <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Order</label>
          <select
            value={selectedOrder}
            onChange={(e) => setSelectedOrder(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

      </div>

      {/* Main product catalog display */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {loading ? (
          <div className="p-12 flex justify-center items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="animate-spin" size={18} /> Loading product list...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 space-y-3">
            <AlertCircle size={32} className="mx-auto text-red-500" />
            <h3 className="font-bold text-base">Failed to fetch products</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <AlertCircle size={32} className="mx-auto text-slate-400" />
            <h3 className="font-bold text-base text-slate-800">No products found</h3>
            <p className="text-sm text-slate-400">Try modifying your search or reset filter selections.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left">
                <thead className="bg-slate-50 text-xxs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-3 w-16">{t('common.details')}</th>
                    <th scope="col" className="px-6 py-3">{t('products.productName')}</th>
                    <th scope="col" className="px-6 py-3">{t('common.brand')}</th>
                    <th scope="col" className="px-6 py-3">{t('common.category')}</th>
                    <th scope="col" className="px-6 py-3">{t('products.sku')}</th>
                    <th scope="col" className="px-6 py-3">{t('products.barcode')}</th>
                    <th scope="col" className="px-6 py-3 text-right">{t('products.purchasePrice')}</th>
                    <th scope="col" className="px-6 py-3 text-right">{t('products.sellingPrice')}</th>
                    <th scope="col" className="px-6 py-3 text-right">{t('products.stock')}</th>
                    <th scope="col" className="px-6 py-3 text-center">{t('common.status')}</th>
                    <th scope="col" className="px-6 py-3 text-center">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 text-sm font-semibold text-slate-700">
                  {products.map((prod) => {
                    const quantity = prod.inventory?.quantity || 0;
                    const threshold = prod.inventory?.lowStockThreshold || 10;
                    const isLow = quantity > 0 && quantity <= threshold;
                    const isOut = quantity <= 0;

                    return (
                      <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                            {prod.imageUrl ? (
                              <img src={prod.imageUrl} className="h-full w-full object-cover" alt="" />
                            ) : (
                              <ImageIcon className="text-slate-300" size={16} />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 line-clamp-1">{tp(prod.name)}</div>
                          <div className="text-xxs text-slate-400 font-medium mt-0.5">{tu(prod.unit)}</div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-500">{tb(prod.brand) || '—'}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                            {tc(prod.category?.name)}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">{prod.sku || '—'}</td>
                        <td className="px-6 py-4 font-mono text-xs">{prod.barcode || '—'}</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(prod.purchasePrice)}</td>
                        <td className="px-6 py-4 text-right text-indigo-600 font-bold">{formatCurrency(prod.sellingPrice)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={isOut ? 'text-red-600 font-extrabold' : isLow ? 'text-amber-600 font-bold' : 'text-slate-800'}>
                            {quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isOut ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xxs font-bold bg-red-100 text-red-800 uppercase">{ts('OUT_OF_STOCK')}</span>
                          ) : isLow ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xxs font-bold bg-amber-100 text-amber-800 uppercase">{ts('LOW_STOCK')}</span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xxs font-bold bg-emerald-100 text-emerald-800 uppercase">{ts('IN_STOCK')}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link
                            href={`/products/${prod.id}`}
                            className="text-indigo-600 hover:text-indigo-500 font-bold text-xs"
                          >
                            {t('common.view')}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block sm:hidden divide-y divide-slate-100">
              {products.map((prod) => {
                const quantity = prod.inventory?.quantity || 0;
                const threshold = prod.inventory?.lowStockThreshold || 10;
                const isLow = quantity > 0 && quantity <= threshold;
                const isOut = quantity <= 0;

                return (
                  <div key={prod.id} className="p-4 flex gap-3 hover:bg-slate-50 transition-colors">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                      {prod.imageUrl ? (
                        <img src={prod.imageUrl} className="h-full w-full object-cover" alt="" />
                      ) : (
                        <ImageIcon className="text-slate-300" size={18} />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-900 truncate leading-tight">{tp(prod.name)}</h4>
                        <span className="text-sm font-extrabold text-indigo-600 shrink-0 ml-2">
                          {formatCurrency(prod.sellingPrice)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-semibold">
                        <span>{tb(prod.brand) || '—'}</span>
                        <span>•</span>
                        <span>{tc(prod.category?.name)}</span>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          {isOut ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 uppercase">{ts('OUT_OF_STOCK')}</span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">{ts('LOW_STOCK')}</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">{ts('IN_STOCK')} ({quantity})</span>
                          )}
                        </div>

                        <Link
                          href={`/products/${prod.id}`}
                          className="text-indigo-600 hover:text-indigo-500 font-bold text-xs"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination navigation bar */}
        {meta.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-slate-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-bold rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= meta.pages}
                onClick={() => setPage(p => Math.min(meta.pages, p + 1))}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-bold rounded-lg bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">
                  Showing page <span className="font-bold text-slate-900">{meta.page}</span> of{' '}
                  <span className="font-bold text-slate-900">{meta.pages}</span> (
                  <span className="font-bold text-slate-900">{meta.total}</span> total products)
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(1)}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  >
                    First
                  </button>
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="relative inline-flex items-center px-2.5 py-2 border border-slate-300 bg-white text-sm font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={page >= meta.pages}
                    onClick={() => setPage(p => Math.min(meta.pages, p + 1))}
                    className="relative inline-flex items-center px-2.5 py-2 border border-slate-300 bg-white text-sm font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    disabled={page >= meta.pages}
                    onClick={() => setPage(meta.pages)}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Last
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADD PRODUCT MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setCreateModalOpen(false)} />
          
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-lg">Add New Product to Catalog</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(d => onCreateSubmit(d))} className="overflow-y-auto p-6 space-y-6 flex-1 text-sm font-semibold">
              
              {/* Basic Fields */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Basic Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Product Name *</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="e.g. Amul Taaza Milk 1L"
                      {...register('name')}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-600 font-bold">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Brand Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="e.g. Amul"
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
                      placeholder="e.g. AMUL-TZ-1L"
                      {...register('sku')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Barcode (EAN/UPC)</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Scan barcode..."
                        {...register('barcode')}
                      />
                      <button
                        type="button"
                        onClick={() => alert('Barcode camera scanner UI integration placeholder (Part 3)')}
                        className="px-3 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-500"
                        title="Scan barcode with camera"
                      >
                        <Camera size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <option value="gram">gram</option>
                      <option value="liter">liter</option>
                      <option value="ml">ml</option>
                      <option value="meter">meter</option>
                      <option value="dozen">dozen</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Description</label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Short product brief..."
                      {...register('description')}
                    />
                  </div>
                </div>
              </div>

              {/* Pricing section with margin calculation */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Pricing Configuration</h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Purchase Price (Cost) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="₹ 0.00"
                      {...register('purchasePrice')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Selling Price (MRP) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="₹ 0.00"
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

                  {/* Markup Profit Margin indicator */}
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

              {/* Initial Stock details */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Stock & Replenishment Limits</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Opening Stock Quantity</label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="e.g. 50"
                      {...register('openingStock')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Low Stock Alert Threshold</label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="e.g. 10"
                      {...register('lowStockThreshold')}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Reorder Quantity</label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="e.g. 30"
                      {...register('reorderQuantity')}
                    />
                  </div>
                </div>
              </div>

              {/* Image systems */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Product Thumbnail</h4>
                
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="block flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Product image URL (search or upload)..."
                      {...register('imageUrl')}
                    />
                    <input
                      type="text"
                      className="hidden"
                      value={imageSearchQuery}
                      onChange={e => setImageSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Packaging Photo Search bar */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">Search packaging photos:</span>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          className="px-2.5 py-1 border border-slate-300 rounded bg-white text-xs font-semibold placeholder-slate-400"
                          placeholder="e.g. Amul Milk Pack..."
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

              {/* Duplicate Detected modal popup inside Create Form */}
              {duplicateWarning && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                  <div className="flex gap-2 text-amber-800">
                    <AlertCircle size={18} className="shrink-0" />
                    <div>
                      <h5 className="font-bold">Possible duplicate item detected!</h5>
                      <p className="text-xs mt-0.5">{duplicateWarning.message}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Link
                      href={`/products/${duplicateWarning.existingProduct.id}`}
                      target="_blank"
                      className="px-3 py-1 border border-amber-300 text-amber-800 rounded text-xs font-bold hover:bg-amber-100"
                    >
                      View Existing product
                    </Link>
                    <button
                      type="button"
                      onClick={() => onCreateSubmit(duplicateWarning.data, true)}
                      className="px-3 py-1 bg-amber-600 text-white rounded text-xs font-bold hover:bg-amber-700"
                    >
                      Create Anyway
                    </button>
                  </div>
                </div>
              )}

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
                  Save Product Record
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setImportModalOpen(false)} />
          
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 text-sm font-semibold">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-lg">Bulk Import Products (CSV)</h3>
              <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              {/* File input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Upload CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  disabled={importLoading}
                  onChange={handleCsvChange}
                  className="block w-full border border-slate-300 rounded-lg bg-slate-50 px-3 py-2 focus:outline-none"
                />
                <p className="text-xxs text-slate-400 font-medium">
                  Expected columns: name, brand, category, sku, barcode, purchasePrice, sellingPrice, mrp, taxRate, unit, openingStock, lowStockThreshold, reorderQuantity
                </p>
              </div>

              {importLoading && (
                <div className="flex justify-center items-center gap-2 py-6 text-slate-500 font-medium">
                  <Loader2 className="animate-spin" size={18} /> Processing files and running integrity validations...
                </div>
              )}

              {importErr && (
                <div className="rounded-lg bg-red-50 p-4 border border-red-200 text-red-600 flex gap-2 items-center">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{importErr}</span>
                </div>
              )}

              {/* Import Preview results */}
              {importPreview && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Validation Report Preview</h4>
                  
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-bold">Total detected</div>
                      <div className="text-lg font-extrabold text-slate-800">{importPreview.totalRows} rows</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <div className="text-[10px] text-emerald-500 font-bold">Valid entries</div>
                      <div className="text-lg font-extrabold text-emerald-600">{importPreview.validCount} valid</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <div className="text-[10px] text-red-500 font-bold">Invalid / Errors</div>
                      <div className="text-lg font-extrabold text-red-600">{importPreview.invalidCount} errors</div>
                    </div>
                  </div>

                  {importPreview.invalidCount > 0 && (
                    <div className="max-h-36 overflow-y-auto space-y-2">
                      <div className="text-xxs font-bold text-slate-400 uppercase tracking-wider">Validation errors list:</div>
                      {importPreview.invalidItems.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="bg-white p-2 rounded border border-red-100 text-xs text-red-700 flex flex-col">
                          <span className="font-bold">Row {item.row}: {item.data.name || 'Unnamed Product'}</span>
                          <span className="text-xxs text-red-500 mt-0.5">{item.errors.join(', ')}</span>
                        </div>
                      ))}
                      {importPreview.invalidCount > 5 && (
                        <div className="text-xxs text-slate-400 text-center">... and {importPreview.invalidCount - 5} more error lines</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeImport}
                  disabled={importLoading || !importPreview || importPreview.validCount === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  Import {importPreview?.validCount || 0} Valid Products
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
