'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { 
  Users, 
  Search, 
  Plus, 
  UserPlus, 
  Send, 
  Check, 
  CreditCard, 
  Loader2, 
  AlertCircle, 
  Phone, 
  MapPin, 
  DollarSign, 
  X,
  Share2
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

export default function CustomersPage() {
  const { t } = useLanguage();
  
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Create customer modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [createError, setCreateError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Collection modal state
  const [collectModalItem, setCollectModalItem] = useState(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectNote, setCollectNote] = useState('');
  const [collectError, setCollectError] = useState(null);
  const [isCollecting, setIsCollecting] = useState(false);

  // Reminder alert state
  const [reminderSentId, setReminderSentId] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const json = await apiClient.get(`/api/customers?search=${encodeURIComponent(search)}`);
      if (json.success && json.data) {
        setCustomers(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);

    try {
      const json = await apiClient.post('/api/customers', {
        name: newCustomerName,
        phone: newCustomerPhone,
        email: newCustomerEmail,
        address: newCustomerAddress
      });

      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to register customer.');
      }

      setCreateModalOpen(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
      setNewCustomerAddress('');
      fetchCustomers();
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCollectPayment = async (e) => {
    e.preventDefault();
    setCollectError(null);
    setIsCollecting(true);

    try {
      const json = await apiClient.post(`/api/customers/${collectModalItem.id}/payment`, {
        amount: Number(collectAmount),
        note: collectNote,
        paymentMethod: 'CASH'
      });

      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to register collection.');
      }

      setCollectModalItem(null);
      setCollectAmount('');
      setCollectNote('');
      fetchCustomers();
    } catch (err) {
      setCollectError(err.message);
    } finally {
      setIsCollecting(false);
    }
  };

  const triggerReminder = (customer) => {
    setReminderSentId(customer.id);
    const rawPhone = (customer.phone || '').replace(/\D/g, '');
    const msg = `Namaste ${customer.name}, your outstanding udhaar balance at Green Mart Kirana is ₹${(customer.outstandingCredit || 0).toFixed(2)}. Please pay at your earliest convenience via UPI: greenmart@upi. Thank you!`;
    const url = rawPhone 
      ? `https://wa.me/91${rawPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    
    window.open(url, '_blank');
    setTimeout(() => {
      setReminderSentId(null);
    }, 2500);
  };

  const totalOutstanding = customers.reduce((sum, c) => sum + parseFloat(c.outstandingCredit || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Customer Credit & Udhaar Ledger</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Track collections, manage customer details, and request outstanding dues</p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs shadow self-start sm:self-auto transition-all"
        >
          <Plus size={16} /> Register Customer
        </button>
      </div>

      {/* Credit Summary Card */}
      <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 text-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Total Outstanding Shop Credit</div>
          <div className="text-3xl font-black mt-1">{formatCurrency(totalOutstanding)}</div>
        </div>
        <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 text-xs">
          <span className="font-semibold block text-indigo-200">Active Accounts:</span>
          <span className="font-bold block text-lg mt-0.5">{customers.filter(c => parseFloat(c.outstandingCredit) > 0).length} customers</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers by name, business phone..."
          className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-3 text-sm bg-white text-slate-950 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Customers List Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={32} className="text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customers.map((c) => {
            const outstanding = parseFloat(c.outstandingCredit || 0);
            return (
              <div 
                key={c.id} 
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{c.name}</h4>
                      {c.phone && (
                        <div className="flex items-center gap-1 text-slate-400 text-xs mt-1 font-semibold">
                          <Phone size={12} /> {c.phone}
                        </div>
                      )}
                      {c.address && (
                        <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5 font-semibold">
                          <MapPin size={12} /> {c.address}
                        </div>
                      )}
                    </div>
                    
                    {outstanding > 0 ? (
                      <span className="bg-red-50 text-red-600 border border-red-100 rounded-lg px-2.5 py-1 text-xs font-extrabold">
                        ₹{outstanding.toFixed(2)} due
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg px-2.5 py-1 text-xs font-bold">
                        Clear
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Operations Footer */}
                {outstanding > 0 && (
                  <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setCollectModalItem(c)}
                      className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold py-2 rounded-lg transition-all flex justify-center items-center gap-1"
                    >
                      <CreditCard size={14} /> Log Collection
                    </button>
                    <button
                      onClick={() => triggerReminder(c)}
                      className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-600 text-xs font-bold py-2 rounded-lg transition-all flex justify-center items-center gap-1"
                    >
                      {reminderSentId === c.id ? (
                        <>
                          <Check size={14} /> Link Sent
                        </>
                      ) : (
                        <>
                          <Send size={14} /> Send Link
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          
          {customers.length === 0 && (
            <div className="md:col-span-2 text-center py-12 text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl">
              <Users size={32} className="mx-auto mb-2 text-slate-300" />
              No customer records found matching search.
            </div>
          )}
        </div>
      )}

      {/* REGISTER NEW CUSTOMER MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setCreateModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm border border-slate-200 p-6 space-y-4 z-50 text-sm font-semibold">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                <UserPlus size={18} className="text-indigo-600" /> Register Customer
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {createError && (
              <div className="bg-red-50 text-red-600 border border-red-100 p-2.5 rounded-lg flex gap-2 items-center text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Anand Sharma"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Phone Number</label>
                <input
                  type="tel"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. 9876543210"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. anand@gmail.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Address</label>
                <input
                  type="text"
                  value={newCustomerAddress}
                  onChange={(e) => setNewCustomerAddress(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Flat 301, Tower B"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1"
                >
                  {isCreating && <Loader2 size={12} className="animate-spin" />} Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COLLECT PAYMENT MODAL */}
      {collectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setCollectModalItem(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm border border-slate-200 p-6 space-y-4 z-50 text-sm font-semibold">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-base">Collect Store Credit</h3>
              <button onClick={() => setCollectModalItem(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
              <span className="text-slate-400 block font-bold uppercase text-[9px]">Outstanding Balance</span>
              <span className="text-slate-900 block font-bold mt-0.5">{collectModalItem.name}</span>
              <span className="text-red-600 font-extrabold text-sm block mt-1">₹{parseFloat(collectModalItem.outstandingCredit).toFixed(2)} due</span>
            </div>

            {collectError && (
              <div className="bg-red-50 text-red-600 border border-red-100 p-2.5 rounded-lg flex gap-2 items-center text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>{collectError}</span>
              </div>
            )}

            <form onSubmit={handleCollectPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Received Cash / UPI Amount *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  max={collectModalItem.outstandingCredit}
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Enter collected amount"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Collection Note</label>
                <input
                  type="text"
                  value={collectNote}
                  onChange={(e) => setCollectNote(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Paid cash at counter"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setCollectModalItem(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCollecting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1"
                >
                  {isCollecting && <Loader2 size={12} className="animate-spin" />} Save Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
