import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Car,
  Check,
  CheckCircle2,
  Clock,
  HelpCircle,
  Navigation,
  ShieldCheck,
  Umbrella,
} from 'lucide-react';
import {
  MapNavIcon,
  PinLocationIcon,
  RouteTrailIcon,
} from './PrimTropIcons';
import { CAR_TYPE_LABELS, CATEGORY_LABELS, ROAD_STATUS_LABELS } from '../data/mockPlaces';
import {
  START_LOCATIONS,
  generateDayRoute,
  type GeneratedRoute,
} from '../lib/routeGenerator';
import type {
  CarTypeEnum,
  PlaceCategoryEnum,
  PlaceWithReports,
  RoadStatusEnum,
} from '../types/database';

interface RoutePlannerScreenProps {
  places: PlaceWithReports[];
  onShowOnMap: (route: GeneratedRoute) => void;
  onOpenPlaceDetails: (place: PlaceWithReports) => void;
}

const CAR_OPTIONS: { value: CarTypeEnum; label: string; shortLabel: string }[] = [
  { value: 'sedan', label: 'Седан', shortLabel: 'Седан' },
  { value: 'crossover', label: 'Кроссовер', shortLabel: 'Кроссовер' },
  { value: 'suv_4x4', label: 'Внедорожник 4x4', shortLabel: '4x4' },
];

const DURATION_OPTIONS: (6 | 9 | 12)[] = [6, 9, 12];

const INTEREST_OPTIONS: { value: PlaceCategoryEnum; label: string }[] = [
  { value: 'beach', label: 'Бухты' },
  { value: 'waterfall', label: 'Водопады' },
  { value: 'viewpoint', label: 'Видовые площадки' },
  { value: 'history', label: 'История' },
];

function formatDurationHm(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

function roadStatusBadge(status: RoadStatusEnum | 'none'): {
  text: string;
  colorClass: string;
  dotClass: string;
} {
  if (status === 'passable') {
    return {
      text: `Статус дороги: зелёный (${ROAD_STATUS_LABELS.passable})`,
      colorClass: 'text-emerald-700',
      dotClass: 'bg-emerald-500',
    };
  }
  if (status === 'hard') {
    return {
      text: `Статус дороги: жёлтый (${ROAD_STATUS_LABELS.hard})`,
      colorClass: 'text-amber-700',
      dotClass: 'bg-amber-500',
    };
  }
  if (status === 'blocked') {
    return {
      text: `Статус дороги: красный (${ROAD_STATUS_LABELS.blocked})`,
      colorClass: 'text-rose-700',
      dotClass: 'bg-rose-500',
    };
  }
  return {
    text: 'Статус дороги: серый (нет свежих отчётов)',
    colorClass: 'text-slate-600',
    dotClass: 'bg-slate-400',
  };
}

export function RoutePlannerScreen({
  places,
  onShowOnMap,
  onOpenPlaceDetails,
}: RoutePlannerScreenProps) {
  const [startLocationId, setStartLocationId] = useState<string>('vladivostok');
  const [carType, setCarType] = useState<CarTypeEnum>('crossover');
  const [durationHours, setDurationHours] = useState<6 | 9 | 12>(9);
  const [interests, setInterests] = useState<PlaceCategoryEnum[]>([]);

  const toggleInterest = (category: PlaceCategoryEnum) => {
    setInterests((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]
    );
  };

  const generatedRoute = useMemo(
    () =>
      generateDayRoute(places, {
        startLocationId,
        carType,
        durationHours,
        interests,
      }),
    [places, startLocationId, carType, durationHours, interests]
  );

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-[calc(2rem+env(safe-area-inset-bottom))] md:py-10">
      <div className="mb-6 sm:mb-8">
        <p className="text-xs font-medium text-slate-500 mb-1.5 sm:mb-2">
          Умный конструктор поездки на 1 день
        </p>
        <h1 className="font-[var(--font-display)] text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#11161A] leading-tight">
          Автоматический маршрут по Приморью
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl">
          Укажите точку старта, класс автомобиля, бюджет времени и интересы — алгоритм подберёт
          оптимальное кольцо из 2–4 точек с учётом актуальной проходимости дорог и подготовит
          запасной вариант на случай дождя.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Trip Parameters Form */}
        <section
          aria-label="Параметры поездки"
          className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-5 sm:space-y-6"
        >
          <div>
            <h2 className="text-base font-semibold text-[#11161A]">Параметры выезда</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Маршрут пересчитывается мгновенно при изменении любого параметра
            </p>
          </div>

          {/* Start Point Dropdown */}
          <div>
            <label
              htmlFor="route-start-select"
              className="block text-xs font-semibold text-slate-700 mb-2"
            >
              Точка старта
            </label>
            <div className="relative">
              <PinLocationIcon className="w-4 h-4 text-[#0D5C63] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="route-start-select"
                value={startLocationId}
                onChange={(e) => setStartLocationId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-base sm:text-sm font-medium bg-white border border-slate-300 rounded-xl text-[#11161A] focus-visible:outline-2 focus-visible:outline-[#0D5C63] cursor-pointer"
              >
                {START_LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Car Type Selection */}
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2">Тип автомобиля</div>
            <div className="grid grid-cols-3 gap-2">
              {CAR_OPTIONS.map((opt) => {
                const active = carType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCarType(opt.value)}
                    className={`px-2 sm:px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 transition-colors cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                      active
                        ? 'border-[#0D5C63] bg-[#0D5C63] text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5 shrink-0" />
                    <span className="sm:hidden">{opt.shortLabel}</span>
                    <span className="hidden sm:inline">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trip Duration Selection */}
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Длительность поездки (с возвращением)
            </div>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
              {DURATION_OPTIONS.map((hours) => {
                const active = durationHours === hours;
                return (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setDurationHours(hours)}
                    className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer tabular-nums whitespace-nowrap ${
                      active
                        ? 'bg-white text-[#11161A] shadow-sm'
                        : 'text-slate-600 hover:text-[#11161A]'
                    }`}
                  >
                    {hours} часов
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multi-select Interests */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-700">
                Интересы (можно несколько)
              </span>
              {interests.length > 0 && (
                <button
                  type="button"
                  onClick={() => setInterests([])}
                  className="text-xs text-[#0D5C63] hover:underline cursor-pointer"
                >
                  Сбросить
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {INTEREST_OPTIONS.map((opt) => {
                const selected = interests.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleInterest(opt.value)}
                    className={`px-3.5 py-2.5 rounded-xl border text-left text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                      selected
                        ? 'border-[#0D5C63] bg-[#0D5C63]/8 text-[#11161A]'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                        selected
                          ? 'bg-[#0D5C63] border-[#0D5C63] text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3" />}
                    </span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {interests.length === 0
                ? 'Не выбрано — учитываются все категории локаций.'
                : `Выбрано категорий: ${interests.length}`}
            </p>
          </div>
        </section>

        {/* Right Column: Result Metrics, Timeline & Weather Backup */}
        <section aria-label="Сгенерированный маршрут" className="lg:col-span-7 space-y-6">
          {/* Metrics & CTA Header Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="text-xs text-slate-500">
                  План на день · {CAR_TYPE_LABELS[generatedRoute.carType]} · лимит{' '}
                  {generatedRoute.durationHours} ч
                </div>
                <h2 className="font-[var(--font-display)] text-2xl sm:text-3xl font-semibold text-[#11161A] mt-0.5">
                  {generatedRoute.stops.length > 0
                    ? `${generatedRoute.stops.length} точки из ${generatedRoute.start.genitiveLabel}`
                    : 'Маршрут не сформирован'}
                </h2>
              </div>

              {generatedRoute.stops.length > 0 && (
                <button
                  type="button"
                  onClick={() => onShowOnMap(generatedRoute)}
                  className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0D5C63] hover:bg-[#094348] active:scale-[0.98] rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <MapNavIcon className="w-4 h-4" />
                  <span>Показать маршрут на карте</span>
                </button>
              )}
            </div>

            {/* 3 KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <RouteTrailIcon className="w-3.5 h-3.5 text-[#0D5C63]" />
                  <span>Общий километраж</span>
                </div>
                <div className="text-2xl font-semibold text-[#11161A] tabular-nums mt-1">
                  {generatedRoute.totalDistanceKm.toFixed(1)} км
                </div>
                <div className="text-xs text-slate-500 mt-0.5">По прямой (туда и обратно)</div>
              </div>

              <div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0D5C63]" />
                  <span>Время в пути и на местах</span>
                </div>
                <div className="text-2xl font-semibold text-[#11161A] tabular-nums mt-1">
                  {formatDurationHm(generatedRoute.totalTripMin)}
                </div>
                <div className="text-xs text-slate-500 tabular-nums mt-0.5">
                  Дорога: {formatDurationHm(generatedRoute.totalDriveMin)} · Осмотр:{' '}
                  {formatDurationHm(generatedRoute.totalVisitMin)}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0D5C63]" />
                  <span>Статус проходимости</span>
                </div>
                <div className="text-sm font-semibold text-[#11161A] mt-1.5 leading-snug">
                  {generatedRoute.passabilitySummary}
                </div>
              </div>
            </div>
          </div>

          {/* Vertical Timeline */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-[#11161A] mb-5">Тайм-лайн дня</h3>

            {generatedRoute.stops.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <p className="text-sm font-medium text-[#11161A]">
                  За {durationHours} часов не найдено точек по заданным фильтрам
                </p>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Попробуйте увеличить длительность поездки до 9 или 12 часов, выбрать другой
                  класс автомобиля или расширить интересы.
                </p>
              </div>
            ) : (
              <ol className="relative space-y-0">
                {generatedRoute.timeline.map((entry, idx) => {
                  const isLast = idx === generatedRoute.timeline.length - 1;
                  const badge =
                    entry.kind === 'stop' && entry.roadStatus
                      ? roadStatusBadge(entry.roadStatus)
                      : null;

                  return (
                    <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
                      {/* Vertical connector line */}
                      {!isLast && (
                        <span
                          aria-hidden="true"
                          className="absolute left-[4.35rem] top-6 bottom-0 w-px bg-slate-200"
                        />
                      )}

                      {/* Time column */}
                      <div className="w-12 pt-0.5 text-right font-[var(--font-mono)] text-sm font-semibold text-[#11161A] tabular-nums shrink-0">
                        {entry.time}
                      </div>

                      {/* Node indicator */}
                      <div className="pt-1.5 shrink-0 z-10">
                        {entry.kind === 'start' && (
                          <span className="w-3 h-3 rounded-full bg-[#0D5C63] ring-4 ring-[#0D5C63]/15 block" />
                        )}
                        {entry.kind === 'stop' && (
                          <span
                            className={`w-3 h-3 rounded-full ring-4 ring-white block ${
                              badge?.dotClass ?? 'bg-slate-400'
                            }`}
                          />
                        )}
                        {entry.kind === 'return' && (
                          <span className="w-3 h-3 rounded-full bg-slate-900 ring-4 ring-slate-200 block" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        {entry.kind === 'stop' && entry.place ? (
                          <div className="space-y-1">
                            <button
                              type="button"
                              onClick={() => onOpenPlaceDetails(entry.place!)}
                              className="text-left font-semibold text-base text-[#11161A] hover:text-[#0D5C63] transition-colors cursor-pointer"
                            >
                              {entry.title}
                            </button>
                            <div className="text-xs text-slate-600 tabular-nums">
                              Осмотр {entry.visitDurationMin} мин <span aria-hidden="true">·</span>{' '}
                              {entry.subtitle}
                            </div>
                            {badge && (
                              <div className={`text-xs font-medium flex items-center gap-1.5 ${badge.colorClass}`}>
                                {entry.roadStatus === 'passable' && (
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                )}
                                {entry.roadStatus === 'hard' && (
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                )}
                                {entry.roadStatus === 'none' && (
                                  <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                                )}
                                <span>{badge.text}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="text-sm font-semibold text-[#11161A]">
                              {entry.title}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">{entry.subtitle}</div>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {/* Backup Place Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0D5C63]/10 text-[#0D5C63] flex items-center justify-center shrink-0">
                  <Umbrella className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#0D5C63]">
                    Запасной вариант на случай непогоды
                  </div>
                  {generatedRoute.backupPlace ? (
                    <>
                      <h3 className="font-[var(--font-display)] text-2xl font-semibold text-[#11161A] mt-0.5">
                        {generatedRoute.backupPlace.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {CATEGORY_LABELS[generatedRoute.backupPlace.category]}{' '}
                        <span aria-hidden="true">·</span> {generatedRoute.backupPlace.district}{' '}
                        <span aria-hidden="true">·</span> Асфальтовый подъезд (седан){' '}
                        {generatedRoute.backupDistanceKm !== null && (
                          <>
                            <span aria-hidden="true">·</span>{' '}
                            <span className="tabular-nums">
                              {generatedRoute.backupDistanceKm.toFixed(1)} км от старта
                            </span>
                          </>
                        )}
                      </p>
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                        {generatedRoute.backupPlace.description}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-600 mt-1">
                      Все доступные точки с асфальтовым подъездом уже включены в основной маршрут.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {generatedRoute.backupPlace && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-emerald-700 inline-flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5" />
                  Проезжаемо даже в сильный дождь
                </span>
                <button
                  type="button"
                  onClick={() => onOpenPlaceDetails(generatedRoute.backupPlace!)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#0D5C63] border border-[#0D5C63]/30 rounded-lg hover:bg-[#0D5C63]/5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Подробнее о точке
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
