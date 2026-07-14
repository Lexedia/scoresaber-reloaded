import React from 'react'

type ArcViewerLogoProps = {
  size?: number;
  className?: string;
}

export default function ArcViewerLogo({ size = 32, className }: ArcViewerLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 28 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 6h4 M0 10h6 M2 14h4" strokeWidth="1.5" opacity="0.6" />
      <rect x="8" y="2" width="18" height="18" rx="4" ry="4" />
      <polygon points="15,7 21,11 15,15" />
    </svg>
  )
}
