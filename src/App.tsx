import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Bookmark, Compass, Search } from 'lucide-react';
import { Header } from './components/Header';
import { TrailImage } from './components/TrailImage';
import { TrailDetailModal } from './components/TrailDetailModal';
import { ItineraryPanel } from './components/ItineraryPanel';
import {
  HERO_IMAGE,
  SEASON_GUIDES,
  TRAILS,
  type SeasonKey,
  type Trail,
  type TrailCategory,
  type TrailDifficulty,
} from './data/trails';

type CategoryFilter = 'Все' | TrailCategory;
type DifficultyFilter = 'Любая' | TrailDifficulty;

const STORAGE_KEY = 'primtrop_saved_trails_v1';

export function App() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('Все');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('Любая');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSeason, setActiveSeason] = useState<SeasonKey>('Осень');
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const [isItineraryOpen, setIsItineraryOpen] = useState(false);

  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return ['tokarevsky-lighthouse', 'pidan-livadiyskaya'];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : ['tokarevsky-lighthouse', 'pidan-livadiyskaya'];
    } catch {
      return ['tokarevsky-lighthouse', 'pidan-livadiyskaya'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [savedIds]);

  const toggleSaveTrail = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredTrails = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return TRAILS.filter((trail) => {
      if (categoryFilter !== 'Все' && trail.category !== categoryFilter) return false;
      if (difficultyFilter !== 'Любая' && trail.difficulty !== difficultyFilter) return false;
      if (!query) return true;
      return (
        trail.name.toLowerCase().includes(query) ||
        trail.district.toLowerCase().includes(query) ||
        trail.subtitle.toLowerCase().includes(query)
      );
    });
  }, [categoryFilter, difficultyFilter, searchQuery]);

  const savedTrails = useMemo(
    () => TRAILS.filter((trail) => savedIds.includes(trail.id)),
    [savedIds]
  );

  const activeSeasonGuide = useMemo(
    () => SEASON_GUIDES.find((g) => g.season === activeSeason) ?? SEASON_GUIDES[0],
    [activeSeason]
  );

  const handleQuickCategory = (cat: 'Все' | 'Сопки' | 'Маяки') => {
    setCategoryFilter(cat);
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#11161A]">
      <Header
        savedCount={savedIds.length}
        onOpenItinerary={() => setIsItineraryOpen(true)}
        onQuickCategory={handleQuickCategory}
      />

      <main className="flex-1">
        {/* Split-Screen Editorial Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between py-2">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-4">
                  Приморский край <span aria-hidden="true">·</span> Сихотэ-Алинь и Японское море
                </p>
                <h1 className="font-[var(--font-display)] text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#11161A] leading-[1.06] text-balance">
                  Вся дикая красота Приморья: от сопок до маяков
                </h1>
                <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                  Атлас проверенных троп Южного и Восточного Приморья — точные координаты точек
                  выхода, перепады высот, сезонные ориентиры и чеклист снаряжения для однодневных
                  маршрутов.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#routes"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[#0D5C63] rounded-lg hover:bg-[#094348] transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Выбрать маршрут</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsItineraryOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-[#11161A] bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Compass className="w-4 h-4 text-[#0D5C63]" />
                  <span>Открыть план поездки</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-72 sm:h-96 lg:h-full min-h-[360px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                <TrailImage
                  src={HERO_IMAGE}
                  alt="Скалистое побережье Приморья и сосны на утёсах Японского моря на закате"
                  title="Приморский край"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white flex items-end justify-between gap-4">
                  <div>
                    <div className="text-xs text-white/80">Остров Русский · Залив Петра Великого</div>
                    <div className="text-base font-medium mt-0.5">Базальтовые клифы у мыса Тобизина</div>
                  </div>
                  <span className="font-[var(--font-mono)] text-xs text-white/80 tabular-nums shrink-0">
                    42.94° N
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width 4-column metrics strip below hero */}
          <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="font-[var(--font-display)] text-3xl sm:text-4xl font-semibold text-[#11161A] tabular-nums">
                {TRAILS.length} маршрутов
              </div>
              <p className="text-xs text-slate-500 mt-1">
                От Владивостока до Лазовского заповедника
              </p>
            </div>
            <div>
              <div className="font-[var(--font-display)] text-3xl sm:text-4xl font-semibold text-[#11161A] tabular-nums">
                1 332 м
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Максимальная высота на вершине Пидана
              </p>
            </div>
            <div>
              <div className="font-[var(--font-display)] text-3xl sm:text-4xl font-semibold text-[#11161A] tabular-nums">
                59.4 км
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Суммарная протяжённость пеших троп
              </p>
            </div>
            <div>
              <div className="font-[var(--font-display)] text-3xl sm:text-4xl font-semibold text-[#11161A]">
                4 сезона
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Круглогодичные маяки и горные хребты
              </p>
            </div>
          </div>
        </section>

        {/* Trails Catalog Section */}
        <section id="routes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-semibold text-[#11161A]">
                Каталог маршрутов
              </h2>
              <p className="text-sm text-slate-600 mt-1.5">
                Нажмите на карточку для просмотра этапов подъёма, координат и списка снаряжения.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Category Segmented Filter */}
              <div
                className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg overflow-x-auto"
                role="tablist"
                aria-label="Категории маршрутов"
              >
                {(['Все', 'Сопки', 'Маяки', 'Мысы и бухты'] as CategoryFilter[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={categoryFilter === cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      categoryFilter === cat
                        ? 'bg-white text-[#11161A] shadow-sm'
                        : 'text-slate-600 hover:text-[#11161A]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Difficulty Selector */}
              <select
                aria-label="Фильтр по сложности"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as DifficultyFilter)}
                className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 focus-visible:outline-2 focus-visible:outline-[#0D5C63] cursor-pointer"
              >
                <option value="Любая">Сложность: любая</option>
                <option value="Лёгкий">Лёгкий маршрут</option>
                <option value="Средний">Средний маршрут</option>
                <option value="Сложный">Сложный маршрут</option>
              </select>

              {/* Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по названию или району"
                  aria-label="Поиск маршрутов"
                  className="w-full sm:w-56 pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-[#11161A] placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-[#0D5C63]"
                />
              </div>
            </div>
          </div>

          {filteredTrails.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <p className="text-base font-medium text-[#11161A]">
                По заданным фильтрам маршруты не найдены
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Попробуйте сбросить фильтр сложности или изменить поисковый запрос.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('Все');
                  setDifficultyFilter('Любая');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 text-xs font-medium text-white bg-[#0D5C63] rounded-lg hover:bg-[#094348] transition-colors cursor-pointer"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTrails.map((trail) => {
                const isSaved = savedIds.includes(trail.id);
                return (
                  <article
                    key={trail.id}
                    className="group bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col transition-colors hover:border-slate-300"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedTrail(trail)}
                      className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900 text-left cursor-pointer block"
                    >
                      <TrailImage
                        src={trail.image}
                        alt={trail.imageAlt}
                        title={trail.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                      <span className="absolute bottom-3 left-4 font-[var(--font-mono)] text-xs text-white/90 tabular-nums">
                        {trail.coordinates}
                      </span>
                    </button>

                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <p className="text-xs text-slate-500">
                          {trail.category} <span aria-hidden="true">·</span> {trail.district}{' '}
                          <span aria-hidden="true">·</span> {trail.difficulty}
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedTrail(trail)}
                          className="mt-1.5 text-left cursor-pointer block"
                        >
                          <h3 className="font-[var(--font-display)] text-2xl font-semibold text-[#11161A] group-hover:text-[#0D5C63] transition-colors leading-snug">
                            {trail.name}
                          </h3>
                        </button>
                        <p className="text-sm text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                          {trail.subtitle}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-600 tabular-nums">
                          <span className="font-medium text-[#11161A]">
                            {trail.distanceKm.toFixed(1)} км
                          </span>{' '}
                          <span aria-hidden="true">·</span> +{trail.elevationGainM} м{' '}
                          <span aria-hidden="true">·</span> {trail.durationHours}
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleSaveTrail(trail.id)}
                          aria-label={
                            isSaved
                              ? `Удалить ${trail.name} из маршрута`
                              : `Добавить ${trail.name} в маршрут`
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                            isSaved
                              ? 'bg-[#0D5C63] text-white hover:bg-[#094348]'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>{isSaved ? 'Сохранено' : 'В маршрут'}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Seasonality & Gear Preparation Section */}
        <section id="seasons" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-slate-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-5">
              <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-semibold text-[#11161A]">
                Погода и сборы в Приморье
              </h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Климат побережья и сопок Сихотэ-Алиня резко меняется в течение дня. Выберите сезон,
                чтобы проверить типичные условия и базовый набор экипировки.
              </p>

              <div className="mt-6 inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
                {SEASON_GUIDES.map((item) => (
                  <button
                    key={item.season}
                    type="button"
                    onClick={() => setActiveSeason(item.season)}
                    className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      activeSeason === item.season
                        ? 'bg-white text-[#11161A] shadow-sm'
                        : 'text-slate-600 hover:text-[#11161A]'
                    }`}
                  >
                    {item.season}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="text-xs text-slate-500">{activeSeasonGuide.months}</div>
                  <h3 className="font-[var(--font-display)] text-2xl font-semibold text-[#11161A] mt-0.5">
                    {activeSeasonGuide.season} на побережье и в горах
                  </h3>
                </div>
                <div className="font-[var(--font-mono)] text-sm font-medium text-[#0D5C63] tabular-nums">
                  {activeSeasonGuide.temperature}
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <p className="text-sm text-slate-700 leading-relaxed">
                  {activeSeasonGuide.conditions}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  <span className="font-semibold text-[#11161A]">На что обратить внимание: </span>
                  {activeSeasonGuide.advisory}
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="text-xs font-medium text-slate-500 mb-3">
                  Базовый список в рюкзак
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-[#11161A]">
                  {activeSeasonGuide.essentials.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="text-[#0D5C63]" aria-hidden="true">
                        —
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            PrimTrop <span aria-hidden="true">·</span> Вся дикая красота Приморья в одном приложении:
            от сопок до маяков
          </div>
          <button
            type="button"
            onClick={() => setIsItineraryOpen(true)}
            className="text-slate-700 hover:text-[#0D5C63] font-medium transition-colors cursor-pointer"
          >
            Открыть мой маршрут ({savedIds.length})
          </button>
        </div>
      </footer>

      <TrailDetailModal
        trail={selectedTrail}
        isSaved={selectedTrail ? savedIds.includes(selectedTrail.id) : false}
        onToggleSave={toggleSaveTrail}
        onClose={() => setSelectedTrail(null)}
      />

      <ItineraryPanel
        isOpen={isItineraryOpen}
        savedTrails={savedTrails}
        onClose={() => setIsItineraryOpen(false)}
        onSelectTrail={(trail) => setSelectedTrail(trail)}
        onRemoveTrail={(id) => setSavedIds((prev) => prev.filter((item) => item !== id))}
        onClearAll={() => setSavedIds([])}
      />
    </div>
  );
}

export default App;
