'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Check, 
  Loader2, 
  AlertCircle, 
  Calendar, 
  Sliders, 
  Tag, 
  TrendingDown, 
  X 
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

export default function ExpensesPage() {
  const { t } = useLanguage();
  
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add Expense modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Utilities');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const json = await apiClient.get('/api/expenses');
      if (json.success && json.data) {
        setExpenses(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const json = await apiClient.post('/api/expenses', {
        title: description || category,
        amount: Number(amount),
        category,
        note: description,
        date
      });

      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to save expense.');
      }

      setModalOpen(false);
      setAmount('');
      setCategory('Utilities');
      setDescription('');
      setDate(new Date().toISOString().substring(0, 10));
      fetchExpenses();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  // Group by categories
  const categoriesTotals = {
    Rent: 0,
    Utilities: 0,
    Wages: 0,
    Logistics: 0,
    Miscellaneous: 0
  };
  expenses.forEach(e => {
    if (categoriesTotals[e.category] !== undefined) {
      categoriesTotals[e.category] += e.amount;
    } else {
      categoriesTotals.Miscellaneous += e.amount;
    }
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Shop Expenses Tracker</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">Log Utilities, Rent, Wages, and Logistics overhead costs to view Net Profit metrics</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs shadow self-start sm:self-auto transition-all"
        >
          <Plus size={16} /> Log Expense
        </button>
      </div>

      {/* Expenses summary columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        
        <div className="lg:col-span-2 bg-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Period Overheads</span>
            <span className="text-2xl font-black block mt-1">{formatCurrency(totalExpenses)}</span>
          </div>
          <span className="text-xxs text-slate-400 mt-2 block font-semibold">Overheads directly subtract from gross sales margins</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Utilities</span>
          <span className="text-lg font-bold text-slate-800 block mt-1">{formatCurrency(categoriesTotals.Utilities)}</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Wages</span>
          <span className="text-lg font-bold text-slate-800 block mt-1">{formatCurrency(categoriesTotals.Wages)}</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Rent</span>
          <span className="text-lg font-bold text-slate-800 block mt-1">{formatCurrency(categoriesTotals.Rent)}</span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Logistics</span>
          <span className="text-lg font-bold text-slate-800 block mt-1">{formatCurrency(categoriesTotals.Logistics)}</span>
        </div>

      </div>

      {/* Expenses List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-white">
          <h3 className="font-bold text-slate-900 text-sm">Overhead Transaction Logs</h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={24} className="text-indigo-600 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 whitespace-nowrap text-slate-500 font-mono">{e.date}</td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        e.category === 'Rent' ? 'bg-amber-50 text-amber-600' :
                        e.category === 'Wages' ? 'bg-indigo-50 text-indigo-600' :
                        e.category === 'Utilities' ? 'bg-blue-50 text-blue-600' :
                        e.category === 'Logistics' ? 'bg-purple-50 text-purple-600' :
                        'bg-slate-50 text-slate-600'
                      }`}>
                        {e.category}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 max-w-xs truncate">{e.description || '-'}</td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-right font-bold text-slate-900">{formatCurrency(e.amount)}</td>
                  </tr>
                ))}

                {expenses.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-12 text-slate-400 font-medium italic">
                      No business overhead expenses logged for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LOG NEW EXPENSE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm border border-slate-200 p-6 space-y-4 z-50 text-sm font-semibold">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-800 text-base">Record Business Expense</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {submitError && (
              <div className="bg-red-50 text-red-600 border border-red-100 p-2.5 rounded-lg flex gap-2 items-center text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Expense Date *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Overhead Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Utilities">Utilities (Electricity, Water, Internet)</option>
                  <option value="Rent">Shop Rent</option>
                  <option value="Wages">Staff Wages / Labor</option>
                  <option value="Logistics">Logistics / Transport / Freight</option>
                  <option value="Miscellaneous">Miscellaneous Overhead</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Amount Spent *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-bold"
                  placeholder="₹ 0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Description / Notes</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Electricity bill for July"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1"
                >
                  {isSubmitting && <Loader2 size={12} className="animate-spin" />} Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
