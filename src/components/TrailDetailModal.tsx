import { useEffect, useState } from 'react';
import { Bookmark, Check, MapPin, X } from 'lucide-react';
import type { Trail } from '../data/trails';
import { TrailImage } from './TrailImage';

interface TrailDetailModalProps {
  trail: Trail | null;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  onClose: () => void;
}

export function TrailDetailModal({
  trail,
  isSaved,
  onToggleSave,
  onClose,
}: TrailDetailModalProps) {
  const [checkedGear, setCheckedGear] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCheckedGear({});
  }, [trail?.id]);

  useEffect(() => {
    if (!trail) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [trail, onClose]);

  if (!trail) return null;

  const toggleGear = (item: string) => {
    setCheckedGear((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trail-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-64 sm:h-80 shrink-0 bg-slate-900">
          <TrailImage
            src={trail.image}
            alt={trail.imageAlt}
            title={trail.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть карточку маршрута"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-5 left-6 right-6 text-white">
            <p className="text-xs font-medium text-white/80 mb-1.5">
              {trail.category} <span aria-hidden="true">·</span> {trail.district}{' '}
              <span aria-hidden="true">·</span> {trail.difficulty}
            </p>
            <h2
              id="trail-modal-title"
              className="font-[var(--font-display)] text-3xl sm:text-4xl font-semibold leading-tight"
            >
              {trail.name}
            </h2>
            <p className="text-sm text-white/85 mt-1">{trail.subtitle}</p>
          </div>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="text-xs text-slate-500">Протяжённость</div>
              <div className="text-lg font-semibold text-[#11161A] tabular-nums mt-0.5">
                {trail.distanceKm.toFixed(1)} км
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Набор высоты</div>
              <div className="text-lg font-semibold text-[#11161A] tabular-nums mt-0.5">
                +{trail.elevationGainM} м
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Время в пути</div>
              <div className="text-lg font-semibold text-[#11161A] tabular-nums mt-0.5">
                {trail.durationHours}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Сезон</div>
              <div className="text-lg font-semibold text-[#11161A] mt-0.5">
                {trail.seasonLabel}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[15px] leading-relaxed text-slate-700">{trail.summary}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 pt-1">
              <span className="inline-flex items-center gap-1.5 font-[var(--font-mono)] tabular-nums">
                <MapPin className="w-3.5 h-3.5 text-[#0D5C63]" />
                {trail.coordinates}
              </span>
              <span>Подъезд: {trail.accessNote}</span>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-[#11161A] mb-4">
              Ключевые этапы маршрута
            </h3>
            <div className="space-y-4">
              {trail.stages.map((stage) => (
                <div
                  key={stage.step}
                  className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0"
                >
                  <span className="font-[var(--font-mono)] text-xs font-medium text-[#0D5C63] pt-0.5 tabular-nums shrink-0">
                    {stage.step}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-[#11161A]">{stage.title}</div>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{stage.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-[#11161A] mb-3">
              Рекомендуемое снаряжение
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {trail.gear.map((item) => {
                const isChecked = Boolean(checkedGear[item]);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleGear(item)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-left text-sm transition-colors cursor-pointer ${
                      isChecked
                        ? 'border-[#0D5C63] bg-[#0D5C63]/5 text-[#11161A]'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                        isChecked
                          ? 'bg-[#0D5C63] border-[#0D5C63] text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3" />}
                    </span>
                    <span className={isChecked ? 'line-through text-slate-500' : ''}>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-slate-500">
            Макс. высота точки: <span className="font-medium text-slate-700 tabular-nums">{trail.maxAltitudeM} м</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-[#11161A] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Закрыть
            </button>
            <button
              type="button"
              onClick={() => onToggleSave(trail.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isSaved
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-[#0D5C63] text-white hover:bg-[#094348]'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>{isSaved ? 'В маршруте' : 'Добавить в маршрут'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
