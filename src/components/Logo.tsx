import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
}

/**
 * Image 2: The standalone brand icon.
 * Features: Stylized "K" with deep blue & orange strokes, a chef hat on top, 
 * and spoon & fork aligned at the bottom inside an elegant orange boundary circle.
 */
export const LogoIcon: React.FC<LogoProps> = ({ className = '', size = 48 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`inline-block ${className}`}
      aria-label="KISSINE FLOW Icon"
    >
      {/* Outer broken circular ring - Orange (#F26522) */}
      <circle
        cx="100"
        cy="110"
        r="75"
        fill="none"
        stroke="#F26522"
        strokeWidth="6"
        strokeDasharray="400"
        strokeDashoffset="12"
        strokeLinecap="round"
      />

      {/* Stylized K character */}
      {/* 1. Left Vertical Stem - Midnight Blue (#0B1F3F) */}
      <path
        d="M 75 62 C 75 62, 92 56, 92 62 L 92 148 C 92 154, 75 148, 75 148 Z"
        fill="#0B1F3F"
      />
      {/* 2. Top Right Diagonal - Midnight Blue (#0B1F3F) */}
      <path
        d="M 92 104 L 146 58 C 146 58, 156 64, 142 78 L 105 115 Z"
        fill="#0B1F3F"
      />
      {/* 3. Bottom Right Diagonal - Accent Orange (#F26522) */}
      <path
        d="M 103 113 L 148 152 C 153 156, 142 162, 134 156 L 92 120 Z"
        fill="#F26522"
      />

      {/* Chef's Hat resting on the K stem - White fill with Midnight Blue strokes */}
      <g transform="translate(18, 0)">
        {/* Hat puffed crown */}
        <path
          d="M 50 56 
             C 40 50, 36 34, 48 26 
             C 46 12, 68 8, 72 18 
             C 78 6, 96 10, 94 24 
             C 104 30, 102 46, 92 56 Z"
          fill="#FFFFFF"
          stroke="#0B1F3F"
          strokeWidth="4.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Hat band */}
        <path
          d="M 50 56 L 92 56"
          stroke="#0B1F3F"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        {/* Hat band folds */}
        <path
          d="M 58 56 L 58 51 M 68 56 L 68 50 M 78 56 L 78 50 M 84 56 L 84 51"
          stroke="#0B1F3F"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>

      {/* Utensils at the bottom center */}
      {/* Fork (Left) - Midnight Blue (#0B1F3F) */}
      <g transform="translate(14, 18)">
        {/* Handle */}
        <path
          d="M 72 122 L 72 153"
          stroke="#0B1F3F"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        {/* Base of tines */}
        <path
          d="M 66 112 C 66 122, 78 122, 78 112 Z"
          fill="#0B1F3F"
        />
        {/* Fork Prongs */}
        <path
          d="M 66 104 L 66 112 
             M 70 104 L 70 112 
             M 74 104 L 74 112 
             M 78 104 L 78 112"
          stroke="#0B1F3F"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>

      {/* Spoon (Right) - Midnight Blue (#0B1F3F) */}
      <g transform="translate(14, 18)">
        {/* Handle */}
        <path
          d="M 88 122 L 88 153"
          stroke="#0B1F3F"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        {/* Bowl */}
        <ellipse
          cx="88"
          cy="111"
          rx="7"
          ry="11"
          fill="#0B1F3F"
        />
      </g>
    </svg>
  );
};

/**
 * Image 1: The complete horizontal brand logo.
 * Combines the brand icon with elegant letterforms for "KISSINE FLOW" 
 * and the slogan "GÉREZ. CONTRÔLEZ. DÉVELOPPEZ."
 */
export const LogoFull: React.FC<LogoProps & { showSlogan?: boolean; lightMode?: boolean }> = ({
  className = '',
  size = 50,
  showSlogan = true,
  lightMode = false,
}) => {
  const textColorKissine = lightMode ? '#FFFFFF' : '#0B1F3F';
  const textColorSlogan = lightMode ? '#A3B3C8' : '#475569';

  return (
    <div className={`flex items-center gap-3.5 select-none ${className}`}>
      {/* Brand icon representation */}
      <LogoIcon size={size} className="shrink-0" />

      {/* Typographic elements */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-baseline font-sans font-black tracking-tight" style={{ fontSize: '1.45rem' }}>
          <span style={{ color: textColorKissine, fontWeight: 900, letterSpacing: '-0.02em' }}>KISSINE</span>
          <span className="ml-1" style={{ color: '#F26522', fontWeight: 900 }}>FLOW</span>
          <span className="text-orange-500 text-[10px] ml-0.5 select-none align-super">™</span>
        </div>
        {showSlogan && (
          <span 
            className="text-[8.5px] font-bold uppercase tracking-[0.16em] mt-1" 
            style={{ color: textColorSlogan }}
          >
            Gérez. Contrôlez. Développez.
          </span>
        )}
      </div>
    </div>
  );
};
