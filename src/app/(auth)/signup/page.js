'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, ArrowRight, Check, Loader2, AlertCircle, Sparkles, MapPin, Tag, Percent, Users } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [accountData, setAccountData] = useState({ businessName: '', ownerName: '', email: '', password: '' });
  const [capabilities, setCapabilities] = useState({ profile: 'KIRANA', activeCapabilities: ['expiryTracking', 'batchTracking'] });
  const [location, setLocation] = useState({ address: '', city: '', state: '', phone: '' });
  const [firstProduct, setFirstProduct] = useState({ name: '', brand: '', purchasePrice: '', sellingPrice: '', taxRate: '18', sku: '' });
  const [taxData, setTaxData] = useState({ taxNumber: '' });
  const [staffData, setStaffData] = useState({ name: '', email: '', password: '', role: 'CASHIER' });

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Registration failed.');

      // Proceed to capabilities configuration
      setCurrentStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveOnboardingStep = async (stepName, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: stepName, data: payload }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to update onboarding progress.');

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleStepSubmit = async (e, stepName, payload, nextStep) => {
    e.preventDefault();
    const success = await saveOnboardingStep(stepName, payload);
    if (success) {
      setCurrentStep(nextStep);
    }
  };

  const handleSkip = (nextStep) => {
    setError(null);
    setCurrentStep(nextStep);
  };

  const finishOnboarding = () => {
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-slate-50 items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header Status Bar */}
        <div className="bg-slate-900 text-white px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Store size={20} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">KiranaOS</h1>
              <p className="text-slate-400 text-xs">Onboarding Wizard</p>
            </div>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div
                key={num}
                className={`h-2 w-8 rounded-full transition-all duration-300 ${
                  currentStep >= num ? 'bg-indigo-500' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-200 text-sm text-red-600 flex gap-3 items-center">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Account Creation */}
          {currentStep === 1 && (
            <form onSubmit={handleAccountSubmit} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="text-indigo-600" size={20} /> Create Your Owner Account
                </h2>
                <p className="text-slate-500 text-sm mt-1">Get started by creating your business workspace.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                  <input
                    type="text"
                    required
                    value={accountData.businessName}
                    onChange={(e) => setAccountData({ ...accountData, businessName: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                    placeholder="e.g. Laxmi Kirana & General Store"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Owner Full Name</label>
                  <input
                    type="text"
                    required
                    value={accountData.ownerName}
                    onChange={(e) => setAccountData({ ...accountData, ownerName: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={accountData.email}
                    onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                    placeholder="owner@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={accountData.password}
                    onChange={(e) => setAccountData({ ...accountData, password: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                    placeholder="Minimum 6 characters"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <Link href="/login" className="text-sm font-medium text-slate-500 hover:text-slate-800">
                  Already have an account? Sign in
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Create & Continue'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Capabilities / Profile */}
          {currentStep === 2 && (
            <form
              onSubmit={(e) => handleStepSubmit(e, 'capabilities', capabilities, 3)}
              className="space-y-6"
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="text-indigo-600" size={20} /> Business Capability Profile
                </h2>
                <p className="text-slate-500 text-sm mt-1">Select your store type to pre-configure appropriate checkout features.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { key: 'KIRANA', label: 'Kirana / Grocery', desc: 'Expiry & batches' },
                  { key: 'CLOTHING', label: 'Clothing / Apparel', desc: 'Sizes & colors' },
                  { key: 'ELECTRONICS', label: 'Electronics', desc: 'Serial numbers & warranty' },
                  { key: 'WHOLESALE', label: 'Wholesale B2B', desc: 'Quantity price tiers' },
                  { key: 'RESTAURANT', label: 'Restaurant / Food', desc: 'Tables & dynamic orders' },
                  { key: 'GENERAL_RETAIL', label: 'General Retail', desc: 'Standard billing' }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      let activeCaps = [];
                      if (item.key === 'KIRANA') activeCaps = ['expiryTracking', 'batchTracking'];
                      if (item.key === 'CLOTHING') activeCaps = ['variants'];
                      if (item.key === 'ELECTRONICS') activeCaps = ['serialTracking', 'warranty'];
                      if (item.key === 'WHOLESALE') activeCaps = ['bulkPricing', 'creditLimits'];
                      if (item.key === 'RESTAURANT') activeCaps = ['tableManagement'];
                      setCapabilities({ profile: item.key, activeCapabilities: activeCaps });
                    }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      capabilities.profile === item.key
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-sm text-slate-900">{item.label}</div>
                    <div className="text-xs text-slate-500 mt-1">{item.desc}</div>
                  </button>
                ))}
              </div>

              <div className="pt-4 flex justify-end border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Next: Address & Setup'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Location */}
          {currentStep === 3 && (
            <form
              onSubmit={(e) => handleStepSubmit(e, 'location', location, 4)}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="text-indigo-600" size={20} /> Store Location Details
                </h2>
                <p className="text-slate-500 text-sm mt-1">Provide your primary location for invoice receipts.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={location.address}
                    onChange={(e) => setLocation({ ...location, address: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                    placeholder="Shop No. 12, Main Market Road"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={location.city}
                      onChange={(e) => setLocation({ ...location, city: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                      placeholder="Mumbai"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={location.state}
                      onChange={(e) => setLocation({ ...location, state: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                      placeholder="Maharashtra"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Store Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={location.phone}
                    onChange={(e) => setLocation({ ...location, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleSkip(4)}
                  className="text-sm font-medium text-slate-500 hover:text-slate-800"
                >
                  Skip Location (Use Defaults)
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Next: Add Products'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: First Product */}
          {currentStep === 4 && (
            <form
              onSubmit={(e) => handleStepSubmit(e, 'product', firstProduct, 5)}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Tag className="text-indigo-600" size={20} /> Add Your First Product
                </h2>
                <p className="text-slate-500 text-sm mt-1">Get started by entering a single item. You can skip this and upload in bulk later.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={firstProduct.name}
                    onChange={(e) => setFirstProduct({ ...firstProduct, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                    placeholder="e.g. Amul Butter 100g"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={firstProduct.brand}
                    onChange={(e) => setFirstProduct({ ...firstProduct, brand: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                    placeholder="e.g. Amul"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Barcode / UPC</label>
                  <input
                    type="text"
                    value={firstProduct.barcode}
                    onChange={(e) => setFirstProduct({ ...firstProduct, barcode: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                    placeholder="e.g. 8901058002315"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Purchase Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={firstProduct.purchasePrice}
                    onChange={(e) => setFirstProduct({ ...firstProduct, purchasePrice: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                    placeholder="45.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={firstProduct.sellingPrice}
                    onChange={(e) => setFirstProduct({ ...firstProduct, sellingPrice: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                    placeholder="50.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tax Slab (GST %)</label>
                  <select
                    value={firstProduct.taxRate}
                    onChange={(e) => setFirstProduct({ ...firstProduct, taxRate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                  >
                    <option value="0">0% (Exempt)</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST</option>
                    <option value="28">28% GST</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleSkip(5)}
                  className="text-sm font-medium text-slate-500 hover:text-slate-800"
                >
                  Skip and import in bulk later
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Save & Continue'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 5: Tax Info */}
          {currentStep === 5 && (
            <form
              onSubmit={(e) => handleStepSubmit(e, 'tax', taxData, 6)}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Percent className="text-indigo-600" size={20} /> Tax & GST Identification
                </h2>
                <p className="text-slate-500 text-sm mt-1">Configure your business GSTIN/Tax identification number for print layouts.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">GSTIN / Tax Number</label>
                <input
                  type="text"
                  required
                  value={taxData.taxNumber}
                  onChange={(e) => setTaxData({ taxNumber: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                  placeholder="e.g. 27AAAAA1111A1Z1"
                />
              </div>

              <div className="pt-4 flex justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleSkip(6)}
                  className="text-sm font-medium text-slate-500 hover:text-slate-800"
                >
                  Skip Tax Number (Define Later)
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Save & Continue'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 6: Add Staff */}
          {currentStep === 6 && (
            <form
              onSubmit={(e) => handleStepSubmit(e, 'staff', staffData, 7)}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Users className="text-indigo-600" size={20} /> Invite Your First Staff Member
                </h2>
                <p className="text-slate-500 text-sm mt-1">Create separate credentials for cashiers or store managers.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Staff Member Name</label>
                  <input
                    type="text"
                    required
                    value={staffData.name}
                    onChange={(e) => setStaffData({ ...staffData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                    placeholder="e.g. Amit Patil"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Staff Email Login</label>
                  <input
                    type="email"
                    required
                    value={staffData.email}
                    onChange={(e) => setStaffData({ ...staffData, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                    placeholder="amit@store.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={staffData.password}
                    onChange={(e) => setStaffData({ ...staffData, password: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                    placeholder="Min 6 characters"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Staff Access Level / Role</label>
                  <select
                    value={staffData.role}
                    onChange={(e) => setStaffData({ ...staffData, role: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                  >
                    <option value="CASHIER">Cashier (POS Checkout only)</option>
                    <option value="INVENTORY">Inventory Assistant (Stock updates & PO reception)</option>
                    <option value="MANAGER">Store Manager (Full access except billing configs)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleSkip(7)}
                  className="text-sm font-medium text-slate-500 hover:text-slate-800"
                >
                  Skip Staff Invite (Add Later)
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Save Staff & Complete'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 7: Completed Onboarding */}
          {currentStep === 7 && (
            <div className="space-y-6 text-center py-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mb-4">
                <Check size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Your Store Is Ready!</h2>
                <p className="text-slate-500 text-sm mt-2 max-w-md mx-auto">
                  Onboarding complete. We've set up your capabilities profile, created your owner login, and populated initial parameters.
                </p>
              </div>

              <div className="pt-4 max-w-md mx-auto">
                <button
                  onClick={finishOnboarding}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-500 shadow-md transition-all"
                >
                  Go to Business Dashboard
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
