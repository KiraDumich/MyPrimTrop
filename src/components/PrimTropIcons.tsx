import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

interface PrimTropLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LOGO_SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

/**
 * Фирменный логотип «ПримТроп» — маяк и морские волны внутри буквы «П»/«P»,
 * переходящей в извилистую тропу.
 */
export function PrimTropLogo({ size = 'md', className = '' }: PrimTropLogoProps) {
  return (
    <span
      className={`relative inline-flex items-center justify-center overflow-hidden shrink-0 select-none ${LOGO_SIZE_CLASSES[size]} ${className}`}
      aria-hidden="true"
    >
      <img
        src="/assets/aistudio/_____270a8c03.png"
        alt=""
        className="w-full h-full object-contain scale-[2.05] translate-y-[5.5%] mix-blend-multiply pointer-events-none"
      />
    </span>
  );
}

/** Сложенная карта (вкладка «Карта») */
export function MapNavIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M3.5 6.5 9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5L3.5 20V6.5Z" />
      <path d="M9 4v13.5" />
      <path d="M15 6.5V20" />
    </svg>
  );
}

/** Метка локации (вкладка «Места» и координаты) */
export function PinLocationIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 1 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}

/** Извилистый маршрут с точками старта и финиша */
export function RouteTrailIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="18.2" cy="5.2" r="2" />
      <circle cx="5.8" cy="18.8" r="2" />
      <path d="M16.2 5.2H11C7.4 5.2 7.4 12 11.4 12h1.4C16.8 12 16.8 18.8 13.1 18.8H7.8" />
    </svg>
  );
}

/** Закладка («В маршрут» / «Сохранено») */
export function BookmarkRibbonIcon({
  filled = false,
  className = 'w-5 h-5',
  ...props
}: IconProps & { filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M6.5 4.8A1.8 1.8 0 0 1 8.3 3h7.4a1.8 1.8 0 0 1 1.8 1.8v15.9a.4.4 0 0 1-.66.3L12 16.6 7.16 21a.4.4 0 0 1-.66-.3V4.8Z" />
    </svg>
  );
}

/** Профиль путешественника / водителя */
export function TravelerIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="7.8" r="3.4" />
      <path d="M4.8 19.1c.45-3.2 3.3-5.1 7.2-5.1s6.75 1.9 7.2 5.1a1.2 1.2 0 0 1-1.2 1.4H6a1.2 1.2 0 0 1-1.2-1.4Z" />
    </svg>
  );
}

/** Лупа поиска */
export function SearchLoupeIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.3 15.3 5.2 5.2" />
    </svg>
  );
}

/** Воронка фильтра */
export function FilterFunnelIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M4.2 5.4A1 1 0 0 1 5 4h14a1 1 0 0 1 .78 1.62L14 12.8v5.5l-4 2v-7.5L4.22 5.62a1 1 0 0 1-.02-.22Z" />
    </svg>
  );
}

/** Фильтр с ползунками */
export function FilterSlidersIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M4.5 6h2.8" />
      <circle cx="9.2" cy="6" r="1.8" />
      <path d="M11 6h8.5" />
      <path d="M4.5 10.5h8.7" />
      <circle cx="15" cy="10.5" r="1.8" />
      <path d="M16.8 10.5h2.7l-5.3 5.4v4.1l-3.4 1.5v-5.6L5 10.5" />
    </svg>
  );
}

/** Поделиться маршрутом или точкой */
export function ShareNodesIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="17.5" cy="6" r="2.5" />
      <circle cx="17.5" cy="18" r="2.5" />
      <path d="m8.3 10.8 6.9-3.6" />
      <path d="m8.3 13.2 6.9 3.6" />
    </svg>
  );
}

/** Камера с плюсом (добавить дорожную отметку / фото) */
export function CameraPlusIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M14 18.8H5.5A2.5 2.5 0 0 1 3 16.3v-6.8A2.5 2.5 0 0 1 5.5 7h1.6l1.2-2h5.4l1.2 2h1.6A2.5 2.5 0 0 1 19 9.5v2.8" />
      <circle cx="11" cy="12.8" r="2.9" />
      <path d="M18.5 15.2v5.2" />
      <path d="M15.9 17.8h5.2" />
    </svg>
  );
}

/** Колокольчик оперативных дорожных сводок */
export function BellAlertIcon({ className = 'w-5 h-5', ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M10.5 4.3a1.5 1.5 0 0 1 3 0" />
      <path d="M6.5 11a5.5 5.5 0 0 1 11 0c0 3.5 1.4 5.1 2 5.7a.7.7 0 0 1-.52 1.17H5.02a.7.7 0 0 1-.52-1.17c.6-.6 2-2.2 2-5.7Z" />
      <path d="M9.8 18a2.2 2.2 0 0 0 4.4 0" />
    </svg>
  );
}
