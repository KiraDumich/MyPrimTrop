import { Download } from 'lucide-react';
import {
  MapNavIcon,
  PinLocationIcon,
  PrimTropLogo,
  RouteTrailIcon,
} from './PrimTropIcons';

export type AppTab = 'map' | 'route' | 'offline' | 'catalog';

interface HeaderProps {
  activeTab: AppTab;
  savedCount: number;
  onSelectTab: (tab: AppTab, anchor?: string) => void;
  onOpenItinerary: () => void;
}

const NAV_ITEMS: { id: AppTab; label: string; anchor?: string }[] = [
  { id: 'map', label: 'Карта' },
  { id: 'route', label: 'Маршрут' },
  { id: 'offline', label: 'Офлайн' },
  { id: 'catalog', label: 'Места', anchor: '#places' },
];

function NavTabIcon({ id, className }: { id: AppTab; className?: string }) {
  if (id === 'map') return <MapNavIcon className={className} />;
  if (id === 'route') return <RouteTrailIcon className={className} />;
  if (id === 'offline') return <Download className={className} />;
  return <PinLocationIcon className={className} />;
}

export function Header({
  activeTab,
  savedCount,
  onSelectTab,
  onOpenItinerary,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#F8F9FA]/95 backdrop-blur-sm border-b border-slate-200/80 shrink-0">
      {/* Row 1: Brand, Desktop Nav & My Route CTA */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onSelectTab('map')}
          className="inline-flex items-center gap-2 sm:gap-2.5 font-[var(--font-display)] text-xl sm:text-2xl font-bold tracking-tight text-[#11161A] whitespace-nowrap shrink-0 cursor-pointer active:scale-[0.98] transition-transform"
        >
          <PrimTropLogo size="sm" className="md:w-10 md:h-10" />
          <span>ПримТроп</span>
        </button>

        {/* Desktop & Tablet Navigation */}
        <nav
          aria-label="Основная навигация"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id, item.anchor)}
                className={`inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1.5 border-b-2 active:opacity-80 ${
                  isActive
                    ? 'text-[#0D5C63] border-[#0D5C63] font-semibold'
                    : 'border-transparent hover:text-[#11161A]'
                }`}
              >
                <NavTabIcon id={item.id} className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenItinerary}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 min-h-[38px] text-xs sm:text-sm font-medium text-white bg-[#0D5C63] rounded-xl md:rounded-lg hover:bg-[#094348] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5C63] transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RouteTrailIcon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">
              Мой маршрут{savedCount > 0 ? ` (${savedCount})` : ''}
            </span>
            <span className="sm:hidden tabular-nums">
              Маршрут{savedCount > 0 ? ` (${savedCount})` : ''}
            </span>
          </button>
        </div>
      </div>

      {/* Row 2 (Mobile only): Full 4-tab navigation strip in one clear header */}
      <nav
        aria-label="Мобильное меню разделов"
        className="md:hidden grid grid-cols-4 border-t border-slate-200/70 bg-white/95"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id, item.anchor)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex items-center justify-center gap-1.5 py-2.5 px-1 text-xs transition-colors cursor-pointer active:bg-slate-100/80 ${
                isActive
                  ? 'text-[#0D5C63] font-semibold bg-[#0D5C63]/[0.04]'
                  : 'text-slate-600 font-medium hover:text-[#11161A]'
              }`}
            >
              <NavTabIcon id={item.id} className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#0D5C63]"
                />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
