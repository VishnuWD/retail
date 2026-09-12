'use client';

export default function EmptyStateIllustration({ className = "w-44 h-36", title = "No records found", ...props }) {
  return (
    <svg
      viewBox="0 0 320 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <radialGradient id="emptyAura" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="basketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0e7ff" />
          <stop offset="100%" stopColor="#c7d2fe" />
        </linearGradient>
      </defs>

      {/* Aura */}
      <circle cx="160" cy="120" r="100" fill="url(#emptyAura)" />

      {/* Floor Shadow */}
      <ellipse cx="160" cy="195" rx="90" ry="10" fill="#0f172a" opacity="0.06" />

      {/* Empty Produce / Shopping Basket */}
      <g transform="translate(90, 90)">
        {/* Handle */}
        <path d="M 25 45 Q 70 -5 115 45" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" fill="none" />
        <rect x="60" y="7" width="20" height="8" rx="4" fill="#6366f1" />

        {/* Basket Shell */}
        <path
          d="M 15 45 L 30 95 L 110 95 L 125 45 Z"
          fill="url(#basketGrad)"
          stroke="#4f46e5"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Weave slots */}
        <line x1="30" y1="60" x2="110" y2="60" stroke="#818cf8" strokeWidth="2.5" />
        <line x1="35" y1="75" x2="105" y2="75" stroke="#818cf8" strokeWidth="2.5" />
        <line x1="48" y1="48" x2="48" y2="92" stroke="#818cf8" strokeWidth="2.5" />
        <line x1="70" y1="48" x2="70" y2="92" stroke="#818cf8" strokeWidth="2.5" />
        <line x1="92" y1="48" x2="92" y2="92" stroke="#818cf8" strokeWidth="2.5" />
      </g>

      {/* Clean Sparkles */}
      <g>
        <path d="M 85 70 Q 85 75 80 75 Q 85 75 85 80 Q 85 75 90 75 Q 85 75 85 70 Z" fill="#10b981" />
        <path d="M 235 95 Q 235 100 230 100 Q 235 100 235 105 Q 235 100 240 100 Q 235 100 235 95 Z" fill="#f59e0b" />
        <circle cx="215" cy="65" r="3" fill="#6366f1" />
        <circle cx="105" cy="115" r="2.5" fill="#f43f5e" />
      </g>

      {/* Floating Tag */}
      <g transform="translate(195, 115) rotate(15)">
        <polygon points="0,0 26,0 34,14 26,28 0,28" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
        <circle cx="8" cy="14" r="3" fill="#6366f1" />
        <line x1="16" y1="10" x2="24" y2="10" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="16" y1="18" x2="22" y2="18" stroke="#94a3b8" strokeWidth="1.5" />
      </g>
    </svg>
  );
}
