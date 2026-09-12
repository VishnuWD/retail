import { Store } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex h-full min-h-[70vh] w-full flex-col items-center justify-center p-6 select-none animate-fade-in-up">
      {/* Branded Pulse Loader */}
      <div className="relative flex items-center justify-center">
        {/* Outer ambient glow ring */}
        <div className="absolute h-24 w-24 rounded-3xl bg-indigo-500/10 animate-ping duration-1000" />
        
        {/* Middle soft halo */}
        <div className="absolute h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 animate-pulse" />
        
        {/* Inner Brand Logo Box */}
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-xl shadow-indigo-500/30 ring-4 ring-white">
          <Store size={28} className="animate-float" />
        </div>
      </div>

      {/* Loading typography */}
      <div className="mt-6 flex flex-col items-center text-center">
        <span className="text-sm font-black text-slate-900 tracking-tight">pixelcode.in</span>
        <span className="text-xs font-semibold text-slate-400 mt-0.5 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-glow" />
          Loading retail workspace...
        </span>
      </div>

      {/* Skeleton cards loader bar */}
      <div className="mt-8 w-full max-w-sm space-y-2">
        <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full w-1/2 animate-[shimmer_1.5s_infinite]" />
        </div>
      </div>
    </div>
  );
}
