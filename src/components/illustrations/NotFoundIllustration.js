'use client';

export default function NotFoundIllustration({ className = "w-64 h-52", ...props }) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        {/* Soft Background Radial Aura */}
        <radialGradient id="nfAura" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.18" />
          <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
        </radialGradient>

        {/* Cart Gradient */}
        <linearGradient id="cartMetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>

        {/* Magnifying Glass Rim */}
        <linearGradient id="lensRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* Glass reflection */}
        <linearGradient id="glassReflect" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.1" />
        </linearGradient>

        {/* Floor shadow */}
        <radialGradient id="floorShadow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient background aura */}
      <circle cx="200" cy="150" r="130" fill="url(#nfAura)" />

      {/* Floor cast shadow */}
      <ellipse cx="200" cy="255" rx="140" ry="14" fill="url(#floorShadow)" />

      {/* Large 404 Numerals in Background */}
      <g opacity="0.12">
        <text x="70" y="145" fontSize="110" fontWeight="900" fontFamily="sans-serif" fill="#4f46e5">4</text>
        <text x="160" y="145" fontSize="110" fontWeight="900" fontFamily="sans-serif" fill="#10b981">0</text>
        <text x="250" y="145" fontSize="110" fontWeight="900" fontFamily="sans-serif" fill="#4f46e5">4</text>
      </g>

      {/* Floating empty shelf / isle sign */}
      <g transform="translate(260, 45)">
        <rect x="0" y="0" width="85" height="28" rx="6" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5" />
        <circle cx="12" cy="14" r="4" fill="#f59e0b" />
        <text x="22" y="18" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="sans-serif">AISLE 404</text>
        <line x1="42" y1="28" x2="42" y2="46" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
      </g>

      {/* Shopping Cart Body */}
      <g id="shoppingCart">
        {/* Cart Basket */}
        <path
          d="M 120 120 L 140 195 L 245 195 L 265 130 L 120 120 Z"
          fill="#eef2ff"
          stroke="url(#cartMetal)"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Wire grid horizontal lines */}
        <line x1="126" y1="140" x2="260" y2="145" stroke="#818cf8" strokeWidth="2" />
        <line x1="131" y1="160" x2="253" y2="165" stroke="#818cf8" strokeWidth="2" />
        <line x1="136" y1="180" x2="248" y2="182" stroke="#818cf8" strokeWidth="2" />

        {/* Wire grid vertical lines */}
        <line x1="150" y1="123" x2="157" y2="195" stroke="#818cf8" strokeWidth="2" />
        <line x1="175" y1="124" x2="178" y2="195" stroke="#818cf8" strokeWidth="2" />
        <line x1="200" y1="126" x2="200" y2="195" stroke="#818cf8" strokeWidth="2" />
        <line x1="225" y1="127" x2="222" y2="195" stroke="#818cf8" strokeWidth="2" />
        <line x1="245" y1="129" x2="238" y2="195" stroke="#818cf8" strokeWidth="2" />

        {/* Cart Handle */}
        <path d="M 120 120 L 102 105 L 90 105" stroke="url(#cartMetal)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="85" y="100" width="16" height="10" rx="4" fill="#f43f5e" />

        {/* Cart Chassis Frame */}
        <path d="M 140 195 L 145 228 L 235 228 L 245 195" stroke="#4338ca" strokeWidth="3.5" fill="none" />
        <line x1="135" y1="228" x2="245" y2="228" stroke="#4338ca" strokeWidth="3.5" strokeLinecap="round" />

        {/* Wheels */}
        <circle cx="150" cy="242" r="11" fill="#1e1b4b" />
        <circle cx="150" cy="242" r="5" fill="#e0e7ff" />
        <line x1="145" y1="228" x2="150" y2="236" stroke="#4338ca" strokeWidth="3" />

        <circle cx="230" cy="242" r="11" fill="#1e1b4b" />
        <circle cx="230" cy="242" r="5" fill="#e0e7ff" />
        <line x1="235" y1="228" x2="230" y2="236" stroke="#4338ca" strokeWidth="3" />
      </g>

      {/* Floating Receipt fluttering out of cart with "Not Found" items */}
      <g transform="translate(145, 78) rotate(-12)">
        <path d="M 0 0 L 45 0 L 45 65 L 40 60 L 35 65 L 30 60 L 25 65 L 20 60 L 15 65 L 10 60 L 5 65 L 0 60 Z" 
              fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.06))" />
        <rect x="6" y="8" width="33" height="3" rx="1" fill="#4f46e5" />
        <line x1="6" y1="16" x2="38" y2="16" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="6" y1="22" x2="28" y2="22" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="6" y1="28" x2="35" y2="28" stroke="#94a3b8" strokeWidth="1.5" />
        <rect x="6" y="36" width="33" height="1" fill="#e2e8f0" />
        <text x="6" y="48" fill="#ef4444" fontSize="8" fontWeight="bold" fontFamily="sans-serif">MISSING</text>
        <text x="6" y="56" fill="#64748b" fontSize="6" fontFamily="sans-serif">₹0.00</text>
      </g>

      {/* Big Animated Magnifying Glass Searching the Empty Cart */}
      <g transform="translate(195, 120)">
        {/* Glass lens */}
        <circle cx="45" cy="45" r="38" fill="url(#glassReflect)" />
        <circle cx="45" cy="45" r="38" stroke="url(#lensRim)" strokeWidth="5" />
        
        {/* Question Mark inside magnifying glass */}
        <text x="35" y="60" fill="#d97706" fontSize="42" fontWeight="900" fontFamily="sans-serif">?</text>

        {/* Handle */}
        <path d="M 72 72 L 108 108" stroke="#78350f" strokeWidth="9" strokeLinecap="round" />
        <path d="M 78 78 L 105 105" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
        
        {/* Glare on glass */}
        <path d="M 22 30 Q 30 20 45 20" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.8" />
      </g>

      {/* Whimsical Floating Sparkles & Question Marks */}
      <path d="M 95 65 Q 95 72 88 72 Q 95 72 95 79 Q 95 72 102 72 Q 95 72 95 65 Z" fill="#f59e0b" />
      <path d="M 330 180 Q 330 186 324 186 Q 330 186 330 192 Q 330 186 336 186 Q 330 186 330 180 Z" fill="#6366f1" />
      <path d="M 75 190 Q 75 195 70 195 Q 75 195 75 200 Q 75 195 80 195 Q 75 195 75 190 Z" fill="#10b981" />
      
      <circle cx="115" cy="175" r="3" fill="#f43f5e" />
      <circle cx="310" cy="115" r="2.5" fill="#f59e0b" />
      <circle cx="280" cy="220" r="3" fill="#06b6d4" />
    </svg>
  );
}
