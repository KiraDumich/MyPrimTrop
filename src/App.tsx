import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Bookmark, Compass, Search, WifiOff } from 'lucide-react';
import { Header, type AppTab } from './components/Header';
import { MapScreen } from './components/MapScreen';
import { RoutePlannerScreen } from './components/RoutePlannerScreen';
import { OfflineScreen } from './components/OfflineScreen';
import { TrailImage } from './components/TrailImage';
import { TrailDetailModal } from './components/TrailDetailModal';
import { RoadReportModal } from './components/RoadReportModal';
import { ItineraryPanel } from './components/ItineraryPanel';
import {
  CAR_TYPE_LABELS,
  CATEGORY_LABELS,
  HERO_IMAGE,
  ROAD_STATUS_LABELS,
  getMockPlacesWithReports,
  resolvePlaceImage,
} from './data/mockPlaces';
import { SEASON_GUIDES, type SeasonKey } from './data/trails';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { savePlacesSnapshot } from './lib/offlineStorage';
import type { GeneratedRoute } from './lib/routeGenerator';
import {
  createRoadReport,
  fetchPlacesWithReports,
  upvoteRoadReport,
} from './services/placesService';
import type {
  CarTypeEnum,
  PlaceCategoryEnum,
  PlaceWithReports,
  RoadReportRow,
  RoadStatusEnum,
} from './types/database';

type CategoryFilter = 'all' | PlaceCategoryEnum;
type CarFilter = 'all' | CarTypeEnum;

const STORAGE_KEY = 'primtrop_saved_places_v1';

const CAR_RANK: Record<CarTypeEnum, number> = {
  sedan: 1,
  crossover: 2,
  suv_4x4: 3,
};

function latestReportStatus(place: PlaceWithReports): RoadStatusEnum | null {
  if (place.road_reports.length === 0) return null;
  return place.road_reports[0].status;
}

function statusLabelColor(status: RoadStatusEnum): string {
  if (status === 'passable') return 'text-emerald-700';
  if (status === 'hard') return 'text-amber-700';
  return 'text-rose-700';
}

export function App() {
  const isOnline = useOnlineStatus();
  const [activeTab, setActiveTab] = useState<AppTab>('map');
  const [places, setPlaces] = useState<PlaceWithReports[]>(() => getMockPlacesWithReports());
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [carFilter, setCarFilter] = useState<CarFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSeason, setActiveSeason] = useState<SeasonKey>('Осень');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [reportTargetPlaceId, setReportTargetPlaceId] = useState<string | null>(null);
  const [isItineraryOpen, setIsItineraryOpen] = useState(false);
  const [upvotedIds, setUpvotedIds] = useState<Record<string, boolean>>({});
  const [activeRoute, setActiveRoute] = useState<GeneratedRoute | null>(null);

  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [
          '11111111-1111-4111-8111-111111111101',
          '11111111-1111-4111-8111-111111111107',
        ];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let active = true;
    fetchPlacesWithReports().then((res) => {
      if (!active) return;
      setPlaces(res.places);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [isOnline]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [savedIds]);

  const toggleSavePlace = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateReport = async (
    placeId: string,
    payload: { status: RoadStatusEnum; car_used: CarTypeEnum; comment: string }
  ) => {
    const { report } = await createRoadReport({
      place_id: placeId,
      status: payload.status,
      car_used: payload.car_used,
      comment: payload.comment,
    });

    setPlaces((prev) => {
      const updated = prev.map((place) =>
        place.id === placeId
          ? { ...place, road_reports: [report, ...place.road_reports] }
          : place
      );
      savePlacesSnapshot(updated);
      return updated;
    });
  };

  const handleUpvoteReport = async (placeId: string, report: RoadReportRow) => {
    if (upvotedIds[report.id]) return;
    setUpvotedIds((prev) => ({ ...prev, [report.id]: true }));
    try {
      const { upvotes } = await upvoteRoadReport(report.id, report.upvotes);
      setPlaces((prev) => {
        const updated = prev.map((place) =>
          place.id === placeId
            ? {
                ...place,
                road_reports: place.road_reports.map((r) =>
                  r.id === report.id ? { ...r, upvotes } : r
                ),
              }
            : place
        );
        savePlacesSnapshot(updated);
        return updated;
      });
    } catch {
      setUpvotedIds((prev) => ({ ...prev, [report.id]: false }));
    }
  };

  const handleSelectTab = (tab: AppTab, anchor?: string) => {
    setActiveTab(tab);
    if (anchor && tab === 'catalog') {
      requestAnimationFrame(() => {
        const el = document.querySelector(anchor);
        el?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  };

  const handleShowGeneratedRouteOnMap = (route: GeneratedRoute) => {
    setActiveRoute(route);
    setActiveTab('map');
  };

  const filteredPlaces = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return places.filter((place) => {
      if (categoryFilter !== 'all' && place.category !== categoryFilter) return false;
      if (carFilter !== 'all' && CAR_RANK[place.min_car_type] > CAR_RANK[carFilter]) {
        return false;
      }
      if (!query) return true;
      return (
        place.title.toLowerCase().includes(query) ||
        place.district.toLowerCase().includes(query) ||
        place.description.toLowerCase().includes(query)
      );
    });
  }, [places, categoryFilter, carFilter, searchQuery]);

  const selectedPlace = useMemo(
    () => places.find((p) => p.id === selectedPlaceId) ?? null,
    [places, selectedPlaceId]
  );

  const reportTargetPlace = useMemo(
    () => places.find((p) => p.id === reportTargetPlaceId) ?? null,
    [places, reportTargetPlaceId]
  );

  const savedPlaces = useMemo(
    () => places.filter((p) => savedIds.includes(p.id)),
    [places, savedIds]
  );

  const activeSeasonGuide = useMemo(
    () => SEASON_GUIDES.find((g) => g.season === activeSeason) ?? SEASON_GUIDES[0],
    [activeSeason]
  );

  const totalReportsCount = useMemo(
    () => places.reduce((sum, p) => sum + p.road_reports.length, 0),
    [places]
  );

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#11161A]">
      {!isOnline && (
        <div
          role="status"
          className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs font-medium text-amber-900 flex items-center justify-center gap-2"
        >
          <WifiOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>Офлайн-режим: показаны сохранённые данные</span>
        </div>
      )}

      <Header
        activeTab={activeTab}
        savedCount={savedIds.length}
        onSelectTab={handleSelectTab}
        onOpenItinerary={() => setIsItineraryOpen(true)}
      />

      {activeTab === 'map' && (
        <main className="flex-1">
          <MapScreen
            places={places}
            savedIds={savedIds}
            upvotedIds={upvotedIds}
            activeRoute={activeRoute}
            onClearRoute={() => setActiveRoute(null)}
            onOpenDetails={(place) => setSelectedPlaceId(place.id)}
            onOpenReportModal={(place) => setReportTargetPlaceId(place.id)}
            onUpvoteReport={handleUpvoteReport}
            onToggleSave={toggleSavePlace}
          />
        </main>
      )}

      {activeTab === 'route' && (
        <RoutePlannerScreen
          places={places}
          onShowOnMap={handleShowGeneratedRouteOnMap}
          onOpenPlaceDetails={(place) => setSelectedPlaceId(place.id)}
        />
      )}

      {activeTab === 'offline' && (
        <OfflineScreen places={places} isOnline={isOnline} />
      )}

      {activeTab === 'catalog' && (
        <>
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
                      Атлас популярных локаций Приморского края с фильтрацией по типу автомобиля,
                      точными координатами и живыми дорожными отметками путешественников за
                      последние 72 часа.
                    </p>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab('map')}
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[#0D5C63] rounded-lg hover:bg-[#094348] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Открыть карту дорог</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('route')}
                      className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium text-[#11161A] bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Compass className="w-4 h-4 text-[#0D5C63]" />
                      <span>Собрать маршрут на день</span>
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
                        <div className="text-xs text-white/80">
                          о. Русский · Залив Петра Великого
                        </div>
                        <div className="text-base font-medium mt-0.5">
                          Базальтовые клифы у мыса Тобизина
                        </div>
                      </div>
                      <span className="font-[var(--font-mono)] text-xs text-white/80 tabular-nums shrink-0">
                        42.9489° N
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full-width 4-column metrics strip below hero */}
              <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <div className="font-[var(--font-display)] text-3xl sm:text-4xl font-semibold text-[#11161A] tabular-nums">
                    {places.length} локаций
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    От Русского острова до Ольгинского района
                  </p>
                </div>
                <div>
                  <div className="font-[var(--font-display)] text-3xl sm:text-4xl font-semibold text-[#11161A] tabular-nums">
                    {totalReportsCount} сводок
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Актуальные дорожные отметки за 72 часа
                  </p>
                </div>
                <div>
                  <div className="font-[var(--font-display)] text-3xl sm:text-4xl font-semibold text-[#11161A]">
                    3 класса авто
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Подбор маршрута от седана до 4x4
                  </p>
                </div>
                <div>
                  <div className="font-[var(--font-display)] text-3xl sm:text-4xl font-semibold text-[#11161A]">
                    4 сезона
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Сезонные подсказки и сборы в тайгу
                  </p>
                </div>
              </div>
            </section>

            {/* Places Catalog Section */}
            <section
              id="places"
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
                <div>
                  <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-semibold text-[#11161A]">
                    Каталог локаций Приморья
                  </h2>
                  <p className="text-sm text-slate-600 mt-1.5">
                    Выберите тип автомобиля и откройте любую точку, чтобы посмотреть дорожную
                    обстановку или оставить свою отметку.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div
                    className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg overflow-x-auto"
                    role="tablist"
                    aria-label="Категории локаций"
                  >
                    {(
                      [
                        { id: 'all', label: 'Все' },
                        { id: 'beach', label: 'Бухты' },
                        { id: 'viewpoint', label: 'Видовые' },
                        { id: 'waterfall', label: 'Водопады' },
                        { id: 'history', label: 'История' },
                      ] as { id: CategoryFilter; label: string }[]
                    ).map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        role="tab"
                        aria-selected={categoryFilter === cat.id}
                        onClick={() => setCategoryFilter(cat.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          categoryFilter === cat.id
                            ? 'bg-white text-[#11161A] shadow-sm'
                            : 'text-slate-600 hover:text-[#11161A]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <select
                    aria-label="Фильтр по проходимости автомобиля"
                    value={carFilter}
                    onChange={(e) => setCarFilter(e.target.value as CarFilter)}
                    className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 focus-visible:outline-2 focus-visible:outline-[#0D5C63] cursor-pointer"
                  >
                    <option value="all">Любой автомобиль</option>
                    <option value="sedan">Доступно для седана</option>
                    <option value="crossover">Доступно для кроссовера</option>
                    <option value="suv_4x4">Внедорожник 4x4</option>
                  </select>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск по названию или району"
                      aria-label="Поиск локаций"
                      className="w-full sm:w-56 pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-[#11161A] placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-[#0D5C63]"
                    />
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse"
                    >
                      <div className="aspect-[4/3] bg-slate-200" />
                      <div className="p-5 space-y-3">
                        <div className="h-3 w-2/3 bg-slate-200 rounded" />
                        <div className="h-6 w-3/4 bg-slate-200 rounded" />
                        <div className="h-4 w-full bg-slate-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredPlaces.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                  <p className="text-base font-medium text-[#11161A]">
                    По заданным фильтрам локации не найдены
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Попробуйте выбрать более проходимый класс авто или сбросить поиск.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter('all');
                      setCarFilter('all');
                      setSearchQuery('');
                    }}
                    className="mt-4 px-4 py-2 text-xs font-medium text-white bg-[#0D5C63] rounded-lg hover:bg-[#094348] transition-colors cursor-pointer"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPlaces.map((place) => {
                    const isSaved = savedIds.includes(place.id);
                    const roadStatus = latestReportStatus(place);

                    return (
                      <article
                        key={place.id}
                        className="group bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col transition-colors hover:border-slate-300"
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedPlaceId(place.id)}
                          className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900 text-left cursor-pointer block"
                        >
                          <TrailImage
                            src={resolvePlaceImage(place)}
                            alt={place.title}
                            title={place.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                          <span className="absolute bottom-3 left-4 font-[var(--font-mono)] text-xs text-white/90 tabular-nums">
                            {place.lat.toFixed(4)}° N, {place.lng.toFixed(4)}° E
                          </span>
                        </button>

                        <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                          <div>
                            <p className="text-xs text-slate-500">
                              {CATEGORY_LABELS[place.category]} <span aria-hidden="true">·</span>{' '}
                              {place.district} <span aria-hidden="true">·</span>{' '}
                              <span className="tabular-nums">{place.rating.toFixed(1)}</span>
                            </p>
                            <button
                              type="button"
                              onClick={() => setSelectedPlaceId(place.id)}
                              className="mt-1.5 text-left cursor-pointer block"
                            >
                              <h3 className="font-[var(--font-display)] text-2xl font-semibold text-[#11161A] group-hover:text-[#0D5C63] transition-colors leading-snug">
                                {place.title}
                              </h3>
                            </button>
                            <p className="text-sm text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                              {place.description}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                            <div className="text-xs text-slate-600 min-w-0">
                              <span className="font-medium text-[#11161A]">
                                {CAR_TYPE_LABELS[place.min_car_type]}
                              </span>
                              {roadStatus ? (
                                <>
                                  {' '}
                                  <span aria-hidden="true">·</span>{' '}
                                  <span className={`font-medium ${statusLabelColor(roadStatus)}`}>
                                    {ROAD_STATUS_LABELS[roadStatus]}
                                  </span>
                                </>
                              ) : (
                                <>
                                  {' '}
                                  <span aria-hidden="true">·</span>{' '}
                                  <span className="tabular-nums">
                                    {place.visit_duration_min} мин
                                  </span>
                                </>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleSavePlace(place.id)}
                              aria-label={
                                isSaved
                                  ? `Удалить ${place.title} из маршрута`
                                  : `Добавить ${place.title} в маршрут`
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
            <section
              id="seasons"
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-slate-200"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                <div className="lg:col-span-5">
                  <h2 className="font-[var(--font-display)] text-3xl sm:text-4xl font-semibold text-[#11161A]">
                    Погода и сборы в Приморье
                  </h2>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Климат побережья и сопок Сихотэ-Алиня резко меняется в течение дня. Выберите
                    сезон, чтобы проверить типичные условия и базовый набор экипировки.
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
                      <span className="font-semibold text-[#11161A]">
                        На что обратить внимание:{' '}
                      </span>
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
                PrimTrop <span aria-hidden="true">·</span> Вся дикая красота Приморья в одном
                приложении: от сопок до маяков
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
        </>
      )}

      <TrailDetailModal
        place={selectedPlace}
        isSaved={selectedPlace ? savedIds.includes(selectedPlace.id) : false}
        upvotedIds={upvotedIds}
        onToggleSave={toggleSavePlace}
        onClose={() => setSelectedPlaceId(null)}
        onCreateReport={handleCreateReport}
        onUpvoteReport={handleUpvoteReport}
      />

      <RoadReportModal
        place={reportTargetPlace}
        onClose={() => setReportTargetPlaceId(null)}
        onSubmitReport={handleCreateReport}
      />

      <ItineraryPanel
        isOpen={isItineraryOpen}
        savedPlaces={savedPlaces}
        onClose={() => setIsItineraryOpen(false)}
        onSelectPlace={(place) => setSelectedPlaceId(place.id)}
        onRemovePlace={(id) => setSavedIds((prev) => prev.filter((item) => item !== id))}
        onClearAll={() => setSavedIds([])}
      />
    </div>
  );
}

export default App;
