import { Compass } from 'lucide-react';

export type AppTab = 'map' | 'route' | 'offline' | 'catalog';

interface HeaderProps {
  activeTab: AppTab;
  savedCount: number;
  onSelectTab: (tab: AppTab, anchor?: string) => void;
  onOpenItinerary: () => void;
}

export function Header({
  activeTab,
  savedCount,
  onSelectTab,
  onOpenItinerary,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#F8F9FA]/95 backdrop-blur-sm border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        <button
          type="button"
          onClick={() => onSelectTab('map')}
          className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-[#11161A] whitespace-nowrap shrink-0 cursor-pointer"
        >
          PrimTrop
        </button>

        <nav className="flex items-center gap-3.5 sm:gap-7 text-xs sm:text-sm font-medium text-slate-600 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => onSelectTab('map')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b-2 ${
              activeTab === 'map'
                ? 'text-[#0D5C63] border-[#0D5C63] font-semibold'
                : 'border-transparent hover:text-[#11161A]'
            }`}
          >
            Карта
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('route')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b-2 ${
              activeTab === 'route'
                ? 'text-[#0D5C63] border-[#0D5C63] font-semibold'
                : 'border-transparent hover:text-[#11161A]'
            }`}
          >
            Маршрут
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('offline')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b-2 ${
              activeTab === 'offline'
                ? 'text-[#0D5C63] border-[#0D5C63] font-semibold'
                : 'border-transparent hover:text-[#11161A]'
            }`}
          >
            Офлайн
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('catalog', '#places')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 border-b-2 ${
              activeTab === 'catalog'
                ? 'text-[#0D5C63] border-[#0D5C63] font-semibold'
                : 'border-transparent hover:text-[#11161A]'
            }`}
          >
            Каталог
          </button>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenItinerary}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-[#0D5C63] rounded-lg hover:bg-[#094348] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5C63] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">Мой маршрут{savedCount > 0 ? ` (${savedCount})` : ''}</span>
            <span className="sm:hidden">План{savedCount > 0 ? ` (${savedCount})` : ''}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
