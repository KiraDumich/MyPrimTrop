import { useEffect, useState, type FormEvent } from 'react';
import { AlertTriangle, Car, CheckCircle2, X, XCircle } from 'lucide-react';
import type { CarTypeEnum, PlaceWithReports, RoadStatusEnum } from '../types/database';

interface RoadReportModalProps {
  place: PlaceWithReports | null;
  onClose: () => void;
  onSubmitReport: (
    placeId: string,
    payload: { status: RoadStatusEnum; car_used: CarTypeEnum; comment: string }
  ) => Promise<void>;
}

const STATUS_OPTIONS: {
  value: RoadStatusEnum;
  label: string;
  sublabel: string;
  activeClass: string;
}[] = [
  {
    value: 'passable',
    label: 'Проезжаемо',
    sublabel: 'Дорога сухая или ровная',
    activeClass: 'border-emerald-600 bg-emerald-50 text-emerald-900',
  },
  {
    value: 'hard',
    label: 'Сложно',
    sublabel: 'Ямы, лужи, колея',
    activeClass: 'border-amber-500 bg-amber-50 text-amber-900',
  },
  {
    value: 'blocked',
    label: 'Размыто',
    sublabel: 'Проезда нет / завал',
    activeClass: 'border-rose-600 bg-rose-50 text-rose-900',
  },
];

const CAR_OPTIONS: { value: CarTypeEnum; label: string }[] = [
  { value: 'sedan', label: 'Седан' },
  { value: 'crossover', label: 'Кроссовер' },
  { value: 'suv_4x4', label: '4x4' },
];

export function RoadReportModal({ place, onClose, onSubmitReport }: RoadReportModalProps) {
  const [status, setStatus] = useState<RoadStatusEnum>('passable');
  const [carUsed, setCarUsed] = useState<CarTypeEnum>('crossover');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!place) return;
    setStatus('passable');
    setCarUsed(place.min_car_type);
    setComment('');
    setError(null);
  }, [place?.id]);

  useEffect(() => {
    if (!place) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [place, onClose]);

  if (!place) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (comment.trim().length < 3) {
      setError('Напишите короткий комментарий о дороге (минимум 3 символа).');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmitReport(place.id, {
        status,
        car_used: carUsed,
        comment: comment.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить отчёт');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="road-report-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs text-slate-500">Обновление дорожной обстановки</div>
            <h2
              id="road-report-modal-title"
              className="text-lg font-semibold text-[#11161A] truncate"
            >
              {place.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть окно отчёта"
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#11161A] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 3 Large Status Buttons with Icons */}
          <div>
            <div className="text-xs font-medium text-slate-600 mb-2">
              1. Выберите состояние дороги
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {STATUS_OPTIONS.map((option) => {
                const isSelected = status === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value)}
                    className={`p-3.5 rounded-xl border-2 text-left transition-colors cursor-pointer flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 ${
                      isSelected
                        ? option.activeClass
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {option.value === 'passable' && (
                      <CheckCircle2
                        className={`w-6 h-6 shrink-0 ${
                          isSelected ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      />
                    )}
                    {option.value === 'hard' && (
                      <AlertTriangle
                        className={`w-6 h-6 shrink-0 ${
                          isSelected ? 'text-amber-600' : 'text-slate-400'
                        }`}
                      />
                    )}
                    {option.value === 'blocked' && (
                      <XCircle
                        className={`w-6 h-6 shrink-0 ${
                          isSelected ? 'text-rose-600' : 'text-slate-400'
                        }`}
                      />
                    )}
                    <div>
                      <div className="text-sm font-semibold leading-tight">{option.label}</div>
                      <div className="text-[11px] opacity-75 mt-0.5">{option.sublabel}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Car Used Selector */}
          <div>
            <div className="text-xs font-medium text-slate-600 mb-2">
              2. На каком автомобиле вы ехали
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {CAR_OPTIONS.map((option) => {
                const isSelected = carUsed === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCarUsed(option.value)}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'border-[#0D5C63] bg-[#0D5C63]/10 text-[#0D5C63]'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Car className="w-4 h-4 shrink-0" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment Textarea */}
          <div>
            <label htmlFor="road-report-comment" className="text-xs font-medium text-slate-600 block mb-2">
              3. Комментарий для водителей
            </label>
            <textarea
              id="road-report-comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="После дождя глубокая колея перед спуском"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-[#11161A] placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-[#0D5C63]"
            />
          </div>

          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-[#11161A] transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#D95D39] hover:bg-[#C04B28] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              {submitting ? 'Отправка...' : 'Отправить на карту'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
