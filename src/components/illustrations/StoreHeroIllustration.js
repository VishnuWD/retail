'use client';

export default function StoreHeroIllustration({ className = "w-48 h-36", ...props }) {
  return (
    <svg
      viewBox="0 0 400 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        {/* Background Aura */}
        <radialGradient id="heroAura" cx="0.5" cy="0.5" r="0.5" fx="0.5" fy="0.5">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
          <stop offset="60%" stopColor="#10b981" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>

        {/* Counter Gradient */}
        <linearGradient id="counterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#312e81" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>

        {/* Canopy / Awning Gradients */}
        <linearGradient id="awningIndigo" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>
        <linearGradient id="awningEmerald" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Screen Glow */}
        <linearGradient id="screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>

        {/* Produce crate */}
        <linearGradient id="crateWood" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {/* Ambient background glow circle */}
      <circle cx="200" cy="140" r="130" fill="url(#heroAura)" />

      {/* Modern Awning / Shop Canopy */}
      <path d="M 60 70 Q 200 45 340 70 L 325 105 Q 200 85 75 105 Z" fill="#ffffff" opacity="0.15" />
      
      {/* Awning Stripes */}
      <path d="M 60 70 L 95 66 L 105 102 L 75 105 Z" fill="url(#awningIndigo)" />
      <path d="M 95 66 L 135 63 L 142 100 L 105 102 Z" fill="url(#awningEmerald)" />
      <path d="M 135 63 L 180 61 L 182 98 L 142 100 Z" fill="url(#awningIndigo)" />
      <path d="M 180 61 L 220 61 L 218 98 L 182 98 Z" fill="url(#awningEmerald)" />
      <path d="M 220 61 L 265 63 L 258 100 L 218 98 Z" fill="url(#awningIndigo)" />
      <path d="M 265 63 L 305 66 L 295 102 L 258 100 Z" fill="url(#awningEmerald)" />
      <path d="M 305 66 L 340 70 L 325 105 L 295 102 Z" fill="url(#awningIndigo)" />

      {/* Scalloped Awning Fringe */}
      <path d="M 75 105 Q 90 115 105 102 Q 123 115 142 100 Q 162 115 182 98 Q 200 115 218 98 Q 238 115 258 100 Q 276 115 295 102 Q 310 115 325 105" 
            stroke="#ffffff" strokeWidth="2.5" fill="none" opacity="0.6" />

      {/* Shelves on Background Wall */}
      <rect x="80" y="115" width="240" height="6" rx="3" fill="#cbd5e1" />
      {/* Products on Shelf */}
      <rect x="92" y="96" width="14" height="19" rx="3" fill="#f43f5e" />
      <rect x="110" y="92" width="16" height="23" rx="3" fill="#10b981" />
      <rect x="130" y="95" width="12" height="20" rx="3" fill="#f59e0b" />
      <rect x="250" y="93" width="18" height="22" rx="4" fill="#6366f1" />
      <rect x="272" y="96" width="15" height="19" rx="3" fill="#06b6d4" />
      <rect x="291" y="91" width="16" height="24" rx="3" fill="#ec4899" />

      {/* Main Retail POS Counter */}
      <rect x="70" y="165" width="260" height="95" rx="16" fill="url(#counterGrad)" />
      {/* Countertop Trim */}
      <rect x="65" y="160" width="270" height="12" rx="6" fill="#e0e7ff" />
      <rect x="80" y="180" width="240" height="2" fill="#4338ca" opacity="0.5" />

      {/* Touch POS Terminal Display */}
      <rect x="175" y="125" width="60" height="42" rx="6" fill="url(#screenGrad)" stroke="#6366f1" strokeWidth="2" />
      {/* Terminal Stand */}
      <path d="M 198 167 L 212 167 L 208 174 L 202 174 Z" fill="#94a3b8" />
      <ellipse cx="205" cy="174" rx="12" ry="3" fill="#64748b" />
      
      {/* POS Screen UI Elements */}
      <rect x="180" y="130" width="28" height="4" rx="2" fill="#10b981" />
      <rect x="180" y="137" width="40" height="3" rx="1.5" fill="#94a3b8" opacity="0.6" />
      <rect x="180" y="143" width="34" height="3" rx="1.5" fill="#94a3b8" opacity="0.6" />
      <rect x="180" y="149" width="48" height="3" rx="1.5" fill="#94a3b8" opacity="0.6" />
      <rect x="180" y="157" width="20" height="5" rx="2" fill="#4f46e5" />
      <rect x="212" y="157" width="18" height="5" rx="2" fill="#10b981" />

      {/* Thermal Receipt Printer */}
      <rect x="245" y="142" width="34" height="26" rx="5" fill="#334155" />
      <rect x="250" y="146" width="24" height="3" rx="1.5" fill="#0f172a" />
      {/* Printed Bill Zigzag paper coming out */}
      <path d="M 252 146 L 252 133 L 255 131 L 259 133 L 263 131 L 267 133 L 270 131 L 270 146 Z" fill="#f8fafc" />
      <line x1="254" y1="136" x2="267" y2="136" stroke="#94a3b8" strokeWidth="1" />
      <line x1="254" y1="139" x2="264" y2="139" stroke="#94a3b8" strokeWidth="1" />
      <line x1="254" y1="142" x2="266" y2="142" stroke="#10b981" strokeWidth="1" />

      {/* Barcode Scanner Gun on Stand */}
      <path d="M 148 140 Q 155 135 158 142 L 152 158 Q 146 160 142 154 Z" fill="#6366f1" />
      <rect x="138" y="137" width="10" height="7" rx="2" fill="#e0e7ff" />
      <line x1="144" y1="158" x2="148" y2="172" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="148" cy="172" rx="7" ry="2.5" fill="#475569" />

      {/* Fresh Produce Wooden Crate (Kirana Essential) */}
      <g transform="translate(85, 175)">
        <rect x="0" y="8" width="46" height="24" rx="4" fill="url(#crateWood)" />
        <line x1="0" y1="16" x2="46" y2="16" stroke="#b45309" strokeWidth="1.5" />
        <line x1="0" y1="24" x2="46" y2="24" stroke="#b45309" strokeWidth="1.5" />
        
        {/* Apples / Fresh Tomatoes in Crate */}
        <circle cx="8" cy="7" r="6" fill="#ef4444" />
        <circle cx="18" cy="6" r="6.5" fill="#dc2626" />
        <circle cx="28" cy="7" r="6" fill="#ef4444" />
        <circle cx="38" cy="6" r="6.5" fill="#dc2626" />
        <circle cx="13" cy="2" r="5.5" fill="#ef4444" />
        <circle cx="23" cy="1" r="6" fill="#b91c1c" />
        <circle cx="33" cy="2" r="5.5" fill="#ef4444" />
      </g>

      {/* Shubh Labh / Digital UPI QR Code Stand */}
      <g transform="translate(288, 172)">
        <rect x="0" y="0" width="22" height="28" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
        <rect x="4" y="4" width="14" height="14" fill="#0f172a" />
        {/* QR Pattern Mimic */}
        <rect x="6" y="6" width="3" height="3" fill="#ffffff" />
        <rect x="13" y="6" width="3" height="3" fill="#ffffff" />
        <rect x="6" y="13" width="3" height="3" fill="#ffffff" />
        <rect x="11" y="11" width="2" height="2" fill="#ffffff" />
        {/* UPI Soundbox / Stand */}
        <rect x="3" y="21" width="16" height="4" rx="1" fill="#4f46e5" />
        <path d="M 8 28 L 14 28 L 15 32 L 7 32 Z" fill="#94a3b8" />
        <ellipse cx="11" cy="32" rx="7" ry="2" fill="#64748b" />
      </g>

      {/* Floating Sparkles and Prosperity / Cloud Sync Badges */}
      <g>
        {/* Cloud Sync Icon Pill */}
        <rect x="290" y="32" width="62" height="22" rx="11" fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.08))" />
        <circle cx="302" cy="43" r="4" fill="#10b981" />
        <text x="312" y="47" fill="#0f172a" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Sync Live</text>

        {/* Speed / Fast Billing Pill */}
        <rect x="52" y="32" width="58" height="22" rx="11" fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.08))" />
        <path d="M 64 39 L 60 45 L 65 45 L 62 50 L 68 43 L 64 43 Z" fill="#f59e0b" />
        <text x="71" y="47" fill="#0f172a" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Quick POS</text>
      </g>

      {/* Decorative Sparkles */}
      <path d="M 120 40 Q 120 48 112 48 Q 120 48 120 56 Q 120 48 128 48 Q 120 48 120 40 Z" fill="#f59e0b" />
      <path d="M 270 36 Q 270 42 264 42 Q 270 42 270 48 Q 270 42 276 42 Q 270 42 270 36 Z" fill="#6366f1" />
      <circle cx="160" cy="42" r="2" fill="#10b981" />
      <circle cx="240" cy="52" r="2" fill="#ec4899" />
    </svg>
  );
}
