import { useEffect, useState } from 'react';
import { Check, Copy, Trash2, X } from 'lucide-react';
import { CAR_TYPE_LABELS, CATEGORY_LABELS } from '../data/mockPlaces';
import type { CarTypeEnum, PlaceWithReports } from '../types/database';

interface ItineraryPanelProps {
  isOpen: boolean;
  savedPlaces: PlaceWithReports[];
  onClose: () => void;
  onSelectPlace: (place: PlaceWithReports) => void;
  onRemovePlace: (id: string) => void;
  onClearAll: () => void;
}

const CAR_RANK: Record<CarTypeEnum, number> = {
  sedan: 1,
  crossover: 2,
  suv_4x4: 3,
};

export function ItineraryPanel({
  isOpen,
  savedPlaces,
  onClose,
  onSelectPlace,
  onRemovePlace,
  onClearAll,
}: ItineraryPanelProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalMinutes = savedPlaces.reduce((sum, item) => sum + item.visit_duration_min, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const requiredCar: CarTypeEnum = savedPlaces.reduce<CarTypeEnum>((acc, item) => {
    return CAR_RANK[item.min_car_type] > CAR_RANK[acc] ? item.min_car_type : acc;
  }, 'sedan');

  const handleCopySummary = async () => {
    if (savedPlaces.length === 0) return;
    const lines = [
      'Мой план поездки по Приморью (ПримТроп):',
      ...savedPlaces.map(
        (p, idx) =>
          `${idx + 1}. ${p.title} (${p.district}) — ${CAR_TYPE_LABELS[p.min_car_type]} [${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}]`
      ),
      `Рекомендуемый авто: ${CAR_TYPE_LABELS[requiredCar]} | Время на точках: ~${totalHours} ч`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/55"
      role="dialog"
      aria-modal="true"
      aria-labelledby="itinerary-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 id="itinerary-title" className="text-lg font-semibold text-[#11161A]">
              Мой маршрут по Приморью
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Сохранённые точки, расчёт времени и требования к авто
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть панель маршрута"
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#11161A] hover:border-slate-300 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-slate-500">Точек</div>
            <div className="text-base font-semibold text-[#11161A] tabular-nums mt-0.5">
              {savedPlaces.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">На месте</div>
            <div className="text-base font-semibold text-[#11161A] tabular-nums mt-0.5">
              {totalHours} ч
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Авто от</div>
            <div className="text-sm font-semibold text-[#11161A] mt-0.5 truncate">
              {savedPlaces.length > 0 ? CAR_TYPE_LABELS[requiredCar] : '—'}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {savedPlaces.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-medium text-[#11161A]">Список маршрута пока пуст</p>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Отметьте бухты, водопады и видовые площадки, чтобы собрать план поездки.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedPlaces.map((place, index) => (
                <div
                  key={place.id}
                  className="pb-4 border-b border-slate-200 last:border-b-0 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500 tabular-nums">
                      {String(index + 1).padStart(2, '0')} <span aria-hidden="true">·</span>{' '}
                      {CATEGORY_LABELS[place.category]} <span aria-hidden="true">·</span>{' '}
                      {place.district}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectPlace(place);
                      }}
                      className="text-sm font-semibold text-[#11161A] hover:text-[#0D5C63] transition-colors text-left mt-1 cursor-pointer"
                    >
                      {place.title}
                    </button>
                    <div className="text-xs text-slate-600 tabular-nums mt-1">
                      {CAR_TYPE_LABELS[place.min_car_type]} <span aria-hidden="true">·</span>{' '}
                      {place.visit_duration_min} мин <span aria-hidden="true">·</span>{' '}
                      {place.seasonality}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemovePlace(place.id)}
                    aria-label={`Удалить ${place.title} из маршрута`}
                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
          {savedPlaces.length > 0 ? (
            <>
              <button
                type="button"
                onClick={onClearAll}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-[#11161A] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Очистить
              </button>
              <button
                type="button"
                onClick={handleCopySummary}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0D5C63] rounded-lg hover:bg-[#094348] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Скопировано' : 'Скопировать план'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-[#0D5C63] rounded-lg hover:bg-[#094348] transition-colors cursor-pointer"
            >
              Перейти к локациям
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
