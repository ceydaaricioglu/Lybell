'use client';

import React from 'react';
import { getIconSetEntry } from '@cursor-deneme/shared';

/** İkon ID'leri – proje/liste eklerken seçilebilir. Eski emoji değerleri geriye dönük uyumluluk için string olarak kalır. */
export const CATEGORY_ICON_IDS = [
  'folder',
  'briefcase',
  'book',
  'target',
  'heart',
  'home',
  'laptop',
  'palette',
  'music',
  'coffee',
  'lightbulb',
  'star',
  'phone',
  'code',
  'plane',
  'wrench',
  'leaf',
  'clipboard',
] as const;

export type CategoryIconId = (typeof CATEGORY_ICON_IDS)[number];

const isIconId = (s: string): s is CategoryIconId =>
  (CATEGORY_ICON_IDS as readonly string[]).includes(s);

/** 24x24 outline SVG ikonları – tutarlı çizgi kalınlığı ve yuvarlak uçlar */
const ICON_PATHS: Record<CategoryIconId, React.ReactNode> = {
  folder: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  ),
  briefcase: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  ),
  book: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} fill="none" />
      <circle cx="12" cy="12" r="5" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} fill="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </>
  ),
  heart: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  ),
  home: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  ),
  laptop: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  ),
  palette: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
  ),
  music: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
  ),
  coffee: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 8v12m0-12l4 4m-4-4l4-4M6 20h12a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
  ),
  lightbulb: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  ),
  star: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  ),
  phone: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  ),
  code: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  ),
  plane: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  ),
  wrench: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
  ),
  leaf: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4c0 1.5 1 3 3 3h2v9a1 1 0 001 1h2a1 1 0 001-1v-9h2c2 0 3-1.5 3-3V3a2 2 0 00-2-2H7a2 2 0 00-2 2z" />
  ),
  clipboard: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  ),
};

const DEFAULT_ICON_ID: CategoryIconId = 'folder';

interface CategoryIconSvgProps {
  iconId: CategoryIconId;
  className?: string;
  size?: number;
}

/** Tek bir kategori ikonunu SVG olarak çizer. */
export function CategoryIconSvg({ iconId, className = '', size = 24 }: CategoryIconSvgProps) {
  const path = ICON_PATHS[iconId];
  if (!path) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className={className}
      width={size}
      height={size}
    >
      {path}
    </svg>
  );
}

interface CategoryIconProps {
  /** Kategori icon alanı – ikon id (folder, briefcase, …) veya eski emoji. */
  icon: string;
  className?: string;
  size?: number;
}

/**
 * Kategori ikonunu gösterir. Önce Material Symbol seti (iconSet), sonra SVG seti (folder, book…), sonra emoji.
 */
export function CategoryIcon({ icon, className = '', size = 24 }: CategoryIconProps) {
  const materialEntry = getIconSetEntry(icon);
  if (materialEntry) {
    return (
      <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size }} aria-hidden>
        {icon}
      </span>
    );
  }
  if (isIconId(icon)) {
    return <CategoryIconSvg iconId={icon} className={className} size={size} />;
  }
  return <span className={className} style={{ fontSize: size }} role="img" aria-hidden>{icon}</span>;
}

/** Varsayılan ikon id (yeni listeler için). */
export function getDefaultCategoryIconId(): CategoryIconId {
  return DEFAULT_ICON_ID;
}

/** Geçerli bir ikon id mi yoksa emoji mi kontrol eder; geçersizse varsayılan id döner. */
export function normalizeCategoryIcon(icon: string | undefined | null): string {
  if (!icon) return DEFAULT_ICON_ID;
  return isIconId(icon) ? icon : icon;
}
