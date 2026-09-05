'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RedirectPrintPage({ params }) {
  const resolvedParams = use(params);
  const saleId = resolvedParams?.id || 'latest';
  const router = useRouter();

  useEffect(() => {
    const search = window.location.search || '';
    router.replace(`/print/${saleId}${search}`);
  }, [saleId, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-2 text-slate-500 font-bold text-xs">
      <Loader2 className="animate-spin text-indigo-600" size={24} />
      <span>Redirecting to clean thermal print layout...</span>
    </div>
  );
}
