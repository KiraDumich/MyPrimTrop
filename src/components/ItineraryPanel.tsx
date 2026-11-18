import { useEffect, useState } from 'react';
import { Check, Copy, Trash2, X } from 'lucide-react';
import type { Trail } from '../data/trails';

interface ItineraryPanelProps {
  isOpen: boolean;
  savedTrails: Trail[];
  onClose: () => void;
  onSelectTrail: (trail: Trail) => void;
  onRemoveTrail: (id: string) => void;
  onClearAll: () => void;
}

export function ItineraryPanel({
  isOpen,
  savedTrails,
  onClose,
  onSelectTrail,
  onRemoveTrail,
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

  const totalDistance = savedTrails.reduce((sum, item) => sum + item.distanceKm, 0);
  const totalElevation = savedTrails.reduce((sum, item) => sum + item.elevationGainM, 0);

  const handleCopySummary = async () => {
    if (savedTrails.length === 0) return;
    const lines = [
      'Мой план поездки по Приморью (PrimTrop):',
      ...savedTrails.map(
        (t, idx) =>
          `${idx + 1}. ${t.name} (${t.district}) — ${t.distanceKm} км, +${t.elevationGainM} м [${t.coordinates}]`
      ),
      `Итого: ${totalDistance.toFixed(1)} км, суммарный набор +${totalElevation} м`,
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
              Сохранённые тропы, сопки и маяки для поездки
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
              {savedTrails.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Дистанция</div>
            <div className="text-base font-semibold text-[#11161A] tabular-nums mt-0.5">
              {totalDistance.toFixed(1)} км
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Набор</div>
            <div className="text-base font-semibold text-[#11161A] tabular-nums mt-0.5">
              +{totalElevation} м
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {savedTrails.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-medium text-[#11161A]">Список маршрута пока пуст</p>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Выберите сопку, маяк или мыс в каталоге, чтобы собрать персональный план выезда.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedTrails.map((trail, index) => (
                <div
                  key={trail.id}
                  className="pb-4 border-b border-slate-200 last:border-b-0 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500 tabular-nums">
                      0{index + 1} <span aria-hidden="true">·</span> {trail.category}{' '}
                      <span aria-hidden="true">·</span> {trail.district}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectTrail(trail);
                      }}
                      className="text-sm font-semibold text-[#11161A] hover:text-[#0D5C63] transition-colors text-left mt-1 cursor-pointer"
                    >
                      {trail.name}
                    </button>
                    <div className="text-xs text-slate-600 tabular-nums mt-1">
                      {trail.distanceKm.toFixed(1)} км <span aria-hidden="true">·</span> +
                      {trail.elevationGainM} м <span aria-hidden="true">·</span> {trail.durationHours}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveTrail(trail.id)}
                    aria-label={`Удалить ${trail.name} из маршрута`}
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
          {savedTrails.length > 0 ? (
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
              Перейти к маршрутам
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
