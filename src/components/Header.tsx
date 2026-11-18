import { Compass } from 'lucide-react';

interface HeaderProps {
  savedCount: number;
  onOpenItinerary: () => void;
  onQuickCategory: (category: 'Все' | 'Сопки' | 'Маяки') => void;
}

export function Header({ savedCount, onOpenItinerary, onQuickCategory }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#F8F9FA]/95 backdrop-blur-sm border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        <a
          href="#top"
          className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-[#11161A] whitespace-nowrap shrink-0"
        >
          PrimTrop
        </a>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <a
            href="#routes"
            onClick={() => onQuickCategory('Все')}
            className="hover:text-[#11161A] transition-colors whitespace-nowrap shrink-0"
          >
            Маршруты
          </a>
          <a
            href="#routes"
            onClick={() => onQuickCategory('Сопки')}
            className="hover:text-[#11161A] transition-colors whitespace-nowrap shrink-0"
          >
            Сопки
          </a>
          <a
            href="#routes"
            onClick={() => onQuickCategory('Маяки')}
            className="hover:text-[#11161A] transition-colors whitespace-nowrap shrink-0"
          >
            Маяки
          </a>
          <a
            href="#seasons"
            className="hover:text-[#11161A] transition-colors whitespace-nowrap shrink-0"
          >
            Сезонность
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenItinerary}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0D5C63] rounded-lg hover:bg-[#094348] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5C63] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Мой маршрут{savedCount > 0 ? ` (${savedCount})` : ''}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
