import { ArrowLeft, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function PlaceholderModule({ name, description, plannedFeatures = [] }) {
  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <Link href="/dashboard" className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Planned Module</span>
          <h2 className="text-xl font-extrabold text-slate-900">{name}</h2>
        </div>
      </div>

      {/* Feature Coming Soon visual card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 max-w-2xl text-center space-y-6 mx-auto text-sm font-semibold">
        <div className="mx-auto h-16 w-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Clock size={32} className="animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-800">Coming in Phase 3 / Next Module</h3>
          <p className="text-slate-500 leading-relaxed font-medium max-w-md mx-auto">{description}</p>
        </div>

        {plannedFeatures.length > 0 && (
          <div className="text-left bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={14} /> Planned Specifications from Opportunity Analysis:
            </h4>
            <ul className="space-y-2 font-medium text-slate-700">
              {plannedFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-1">•</span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-2">
          <Link href="/dashboard" className="inline-flex justify-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
            Go back to Dashboard
          </Link>
        </div>
      </div>

    </div>
  );
}
