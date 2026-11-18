import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Download,
  HardDrive,
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  OFFLINE_DISTRICTS,
  getPlacesForDistrict,
  loadSavedOfflinePackages,
  removeOfflineDistrictPackage,
  saveOfflineDistrictPackage,
  type OfflineDistrictConfig,
  type SavedOfflinePackage,
} from '../lib/offlineStorage';
import type { PlaceWithReports } from '../types/database';
import { PWAInstallButton } from './PWAInstallButton';

interface OfflineScreenProps {
  places: PlaceWithReports[];
  isOnline: boolean;
}

function formatDownloadedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return 'сохранено';
  }
}

export function OfflineScreen({ places, isOnline }: OfflineScreenProps) {
  const [savedPackages, setSavedPackages] = useState<Record<string, SavedOfflinePackage>>(() =>
    loadSavedOfflinePackages()
  );
  const [progressByDistrict, setProgressByDistrict] = useState<Record<string, number>>({});

  useEffect(() => {
    setSavedPackages(loadSavedOfflinePackages());
  }, []);

  const handleDownloadDistrict = (district: OfflineDistrictConfig) => {
    if (progressByDistrict[district.id] !== undefined) return;

    setProgressByDistrict((prev) => ({ ...prev, [district.id]: 12 }));

    const steps = [38, 67, 89, 100];
    steps.forEach((pct, index) => {
      window.setTimeout(() => {
        setProgressByDistrict((prev) => ({ ...prev, [district.id]: pct }));
        if (pct === 100) {
          const pkg = saveOfflineDistrictPackage(district, places);
          setSavedPackages((prev) => ({ ...prev, [district.id]: pkg }));
          window.setTimeout(() => {
            setProgressByDistrict((prev) => {
              const next = { ...prev };
              delete next[district.id];
              return next;
            });
          }, 250);
        }
      }, (index + 1) * 180);
    });
  };

  const handleRemovePackage = (districtId: string) => {
    const updated = removeOfflineDistrictPackage(districtId);
    setSavedPackages({ ...updated });
  };

  const downloadedList = Object.values(savedPackages);
  const totalSavedMb = downloadedList.reduce((sum, item) => sum + item.sizeMb, 0);
  const totalSavedSpots = downloadedList.reduce((sum, item) => sum + item.places.length, 0);

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 space-y-8">
      {/* Header & PWA Install Row */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">
            Автономная работа в тайге и на побережье
          </p>
          <h1 className="font-[var(--font-display)] text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#11161A] leading-tight">
            Офлайн-пакеты районов
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl">
            Скачайте карточки локаций, координаты и свежие статусы дорог заранее, чтобы пользоваться
            маршрутами в Хасанском, Шкотовском или Ольгинском районах без сотовой связи.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <PWAInstallButton />
        </div>
      </div>

      {/* Summary Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>Состояние подключения</span>
          </div>
          <div className="text-lg font-semibold text-[#11161A] mt-1">
            {isOnline ? 'В сети — доступна синхронизация' : 'Офлайн — работа из кэша'}
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0D5C63]" />
            <span>Скачано районов</span>
          </div>
          <div className="text-lg font-semibold text-[#11161A] tabular-nums mt-1">
            {downloadedList.length} из {OFFLINE_DISTRICTS.length} ({totalSavedSpots} точек)
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-[#0D5C63]" />
            <span>Объём на устройстве</span>
          </div>
          <div className="text-lg font-semibold text-[#11161A] tabular-nums mt-1">
            {totalSavedMb.toFixed(1)} МБ
          </div>
        </div>
      </div>

      {/* Districts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {OFFLINE_DISTRICTS.map((district) => {
          const districtPlaces = getPlacesForDistrict(places, district);
          const savedPkg = savedPackages[district.id];
          const progress = progressByDistrict[district.id];
          const isDownloading = progress !== undefined;

          return (
            <article
              key={district.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-500 tabular-nums">
                      {districtPlaces.length} точек <span aria-hidden="true">·</span> ~
                      {district.estimatedSizeMb.toFixed(1)} МБ
                    </div>
                    <h2 className="font-[var(--font-display)] text-2xl font-semibold text-[#11161A] mt-1">
                      {district.title}
                    </h2>
                  </div>

                  {savedPkg && !isDownloading && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 shrink-0 pt-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Доступно без сети</span>
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">{district.subtitle}</p>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                {isDownloading && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-600 tabular-nums">
                      <span>Сохранение карточек и статусов дорог...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-[#0D5C63] transition-all duration-150"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {savedPkg && !isDownloading ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-slate-500 tabular-nums">
                      Обновлено: {formatDownloadedAt(savedPkg.downloadedAt)}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadDistrict(district)}
                        disabled={!isOnline}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Обновить</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePackage(district.id)}
                        aria-label={`Удалить офлайн-пакет ${district.title}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Удалить</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isDownloading}
                    onClick={() => handleDownloadDistrict(district)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0D5C63] hover:bg-[#094348] disabled:opacity-65 rounded-xl transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {isDownloading
                        ? `Загрузка (${progress}%)...`
                        : 'Скачать пакет для офлайна'}
                    </span>
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
