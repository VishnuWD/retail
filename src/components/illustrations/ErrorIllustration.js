'use client';

export default function ErrorIllustration({ className = "w-64 h-52", ...props }) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        {/* Background Aura */}
        <radialGradient id="errAura" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.18" />
          <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
        </radialGradient>

        {/* Terminal Body */}
        <linearGradient id="errTerm" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        {/* Error Screen Gradient */}
        <linearGradient id="errScreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff1f2" />
          <stop offset="100%" stopColor="#ffe4e6" />
        </linearGradient>

        {/* Floor shadow */}
        <radialGradient id="errFloor" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient background aura */}
      <circle cx="200" cy="150" r="130" fill="url(#errAura)" />

      {/* Cast Shadow */}
      <ellipse cx="200" cy="255" rx="130" ry="14" fill="url(#errFloor)" />

      {/* Modern POS Terminal with Warning Screen */}
      <g transform="translate(130, 95)">
        {/* Base / Stand */}
        <path d="M 50 145 L 90 145 L 95 155 L 45 155 Z" fill="#64748b" />
        <ellipse cx="70" cy="155" rx="35" ry="6" fill="#475569" />
        <rect x="65" y="125" width="10" height="22" fill="#94a3b8" />

        {/* Terminal Monitor Housing */}
        <rect x="10" y="20" width="120" height="105" rx="14" fill="url(#errTerm)" stroke="#334155" strokeWidth="3" />

        {/* Display Screen */}
        <rect x="18" y="28" width="104" height="89" rx="8" fill="url(#errScreen)" />

        {/* Exclamation Shield Badge on Screen */}
        <g transform="translate(52, 42)">
          <polygon points="18,5 34,14 34,32 18,44 2,32 2,14" fill="#f43f5e" />
          <text x="14" y="32" fill="#ffffff" fontSize="22" fontWeight="900" fontFamily="sans-serif">!</text>
        </g>

        {/* Error Terminal Log Lines on Screen */}
        <rect x="32" y="94" width="76" height="4" rx="2" fill="#f43f5e" opacity="0.6" />
        <rect x="42" y="102" width="56" height="4" rx="2" fill="#94a3b8" opacity="0.7" />
      </g>

      {/* Floating Rotating Gear / Recovery Cogwheel */}
      <g transform="translate(255, 75)">
        <circle cx="28" cy="28" r="22" fill="#f59e0b" opacity="0.15" />
        <circle cx="28" cy="28" r="18" stroke="#f59e0b" strokeWidth="4" fill="#ffffff" />
        <circle cx="28" cy="28" r="6" fill="#f59e0b" />
        
        {/* Gear Teeth */}
        <rect x="25" y="4" width="6" height="8" rx="2" fill="#f59e0b" />
        <rect x="25" y="44" width="6" height="8" rx="2" fill="#f59e0b" />
        <rect x="4" y="25" width="8" height="6" rx="2" fill="#f59e0b" />
        <rect x="44" y="25" width="8" height="6" rx="2" fill="#f59e0b" />
      </g>

      {/* Floating System Disconnected Cord / Lightning Pulse */}
      <g transform="translate(75, 110)">
        <circle cx="24" cy="24" r="22" fill="#6366f1" opacity="0.12" />
        <circle cx="24" cy="24" r="18" fill="#ffffff" stroke="#6366f1" strokeWidth="2.5" />
        {/* Lightning Bolt */}
        <path d="M 25 12 L 18 24 L 24 24 L 23 36 L 31 22 L 25 22 Z" fill="#6366f1" />
      </g>

      {/* Decorative Warning Sparkles and Floating Dots */}
      <path d="M 95 65 Q 95 72 88 72 Q 95 72 95 79 Q 95 72 102 72 Q 95 72 95 65 Z" fill="#f43f5e" />
      <path d="M 315 180 Q 315 186 309 186 Q 315 186 315 192 Q 315 186 321 186 Q 315 186 315 180 Z" fill="#f59e0b" />
      <circle cx="295" cy="140" r="3.5" fill="#f43f5e" />
      <circle cx="115" cy="190" r="2.5" fill="#f59e0b" />
      <circle cx="270" cy="230" r="3" fill="#6366f1" />
    </svg>
  );
}
