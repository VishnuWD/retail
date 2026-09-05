'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/validations';
import { Store, Loader2, AlertCircle, Zap, ShieldCheck, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { useStorage } from '@/lib/storage/StorageContext';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { setSession, storageMode } = useStorage();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const performLogin = async (email, password, role = 'OWNER', name = 'Ramesh Sharma') => {
    setLoading(true);
    setError(null);
    try {
      let loggedIn = false;
      
      // 1. Send Login Request to /api/auth/login
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role, name }),
        });
        
        const json = await res.json();
        
        if (res.ok && json.success && json.data) {
          const userObj = json.data.user;
          const tokenVal = json.data.token;
          
          setSession({
            userId: userObj.id,
            name: userObj.name,
            email: userObj.email,
            role: userObj.role,
            businessId: json.data.business?.id || 'biz_greenmart_001',
            token: tokenVal
          });

          if (tokenVal) {
            document.cookie = `token=${tokenVal}; path=/; max-age=604800; SameSite=Lax`;
          }
          
          loggedIn = true;
        } else if (!res.ok && json.error?.message) {
          setError(json.error.message);
          setLoading(false);
          return;
        }
      } catch (networkErr) {
        console.warn('Backend endpoint unreachable, using local session generator:', networkErr);
      }

      // 2. Offline / Local fallback if network failed
      if (!loggedIn) {
        const sessionPayload = {
          userId: `usr_${role.toLowerCase()}_001`,
          name,
          email,
          role,
          businessId: 'biz_greenmart_001'
        };

        const localToken = `local_${btoa(JSON.stringify(sessionPayload))}`;
        
        setSession({
          ...sessionPayload,
          token: localToken
        });

        document.cookie = `token=${localToken}; path=/; max-age=604800; SameSite=Lax`;
      }

      // 3. Navigate to Dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    await performLogin(data.email, data.password, 'OWNER', 'Store Manager');
  };

  const handleQuickLogin = async (role, name, email, pass) => {
    setValue('email', email);
    setValue('password', pass);
    await performLogin(email, pass, role, name);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-lg">
        
        {/* Logo & Headline */}
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
            <Store size={28} />
          </div>
          <h2 className="mt-4 text-center text-2xl font-black tracking-tight text-slate-900">
            pixelcode.in
          </h2>
          <p className="mt-1 text-center text-xs font-semibold text-slate-500">
            Next-Generation Point of Sale & Inventory Platform
          </p>
        </div>

        {/* Quick 1-Click Role Login */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Instant 1-Click Store Access
          </label>
          <div className="grid grid-cols-3 gap-2">
            
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('OWNER', 'Ramesh (Owner)', 'ramesh@greenmart.com', 'Password123!')}
              className="flex flex-col items-center p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100/70 hover:border-indigo-300 transition-all text-center group disabled:opacity-50"
            >
              <div className="h-7 w-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                👑
              </div>
              <span className="text-xs font-bold text-slate-900 leading-tight">Ramesh</span>
              <span className="text-[10px] font-semibold text-indigo-600 uppercase">Owner</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('MANAGER', 'Amit (Manager)', 'amit@greenmart.com', 'Password123!')}
              className="flex flex-col items-center p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100/70 hover:border-emerald-300 transition-all text-center group disabled:opacity-50"
            >
              <div className="h-7 w-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                💼
              </div>
              <span className="text-xs font-bold text-slate-900 leading-tight">Amit</span>
              <span className="text-[10px] font-semibold text-emerald-600 uppercase">Manager</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickLogin('CASHIER', 'Suresh (Cashier)', 'suresh@greenmart.com', 'Password123!')}
              className="flex flex-col items-center p-2.5 rounded-xl border border-sky-100 bg-sky-50/50 hover:bg-sky-100/70 hover:border-sky-300 transition-all text-center group disabled:opacity-50"
            >
              <div className="h-7 w-7 rounded-full bg-sky-600 text-white text-xs font-bold flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                🛒
              </div>
              <span className="text-xs font-bold text-slate-900 leading-tight">Suresh</span>
              <span className="text-[10px] font-semibold text-sky-600 uppercase">Cashier</span>
            </button>

          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
            or sign in with email
          </span>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-3 border border-red-200 text-xs text-red-600 flex gap-2 items-center">
            <AlertCircle size={16} className="shrink-0 text-red-500" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                disabled={loading}
                autoComplete="email"
                {...register('email')}
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold transition-all"
                placeholder="ramesh@greenmart.in"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 font-semibold">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Password
              </label>
              <input
                id="password"
                type="password"
                disabled={loading}
                autoComplete="current-password"
                {...register('password')}
                className="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-semibold transition-all"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 font-semibold">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Signing In...
                </>
              ) : (
                'Sign In to Store'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
