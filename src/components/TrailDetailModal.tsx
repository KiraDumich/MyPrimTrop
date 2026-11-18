import { useEffect, useState, type FormEvent } from 'react';
import { Bookmark, Car, Clock, MapPin, ShieldAlert, ThumbsUp, X } from 'lucide-react';
import {
  CAR_TYPE_LABELS,
  CATEGORY_LABELS,
  ROAD_STATUS_LABELS,
  resolvePlaceImage,
} from '../data/mockPlaces';
import type {
  CarTypeEnum,
  PlaceWithReports,
  RoadReportRow,
  RoadStatusEnum,
} from '../types/database';
import { TrailImage } from './TrailImage';

interface TrailDetailModalProps {
  place: PlaceWithReports | null;
  isSaved: boolean;
  upvotedIds: Record<string, boolean>;
  onToggleSave: (id: string) => void;
  onClose: () => void;
  onCreateReport: (
    placeId: string,
    payload: { status: RoadStatusEnum; car_used: CarTypeEnum; comment: string }
  ) => Promise<void>;
  onUpvoteReport: (placeId: string, report: RoadReportRow) => Promise<void>;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} мин`;
  if (mins === 0) return `${hours} ч`;
  return `${hours} ч ${mins} мин`;
}

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const hours = Math.max(0, Math.floor(diffMs / 3600_000));
  if (hours < 1) return 'только что';
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн. назад`;
}

function statusTextTone(status: RoadStatusEnum): string {
  if (status === 'passable') return 'text-emerald-700';
  if (status === 'hard') return 'text-amber-700';
  return 'text-rose-700';
}

export function TrailDetailModal({
  place,
  isSaved,
  upvotedIds,
  onToggleSave,
  onClose,
  onCreateReport,
  onUpvoteReport,
}: TrailDetailModalProps) {
  const [status, setStatus] = useState<RoadStatusEnum>('passable');
  const [carUsed, setCarUsed] = useState<CarTypeEnum>('crossover');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setFormError(null);
    setComment('');
    if (place) {
      setCarUsed(place.min_car_type);
    }
  }, [place?.id]);

  useEffect(() => {
    if (!place) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [place, onClose]);

  if (!place) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (comment.trim().length < 3) {
      setFormError('Опишите состояние дороги (минимум 3 символа).');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await onCreateReport(place.id, { status, car_used: carUsed, comment: comment.trim() });
      setComment('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Не удалось сохранить отчёт');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (report: RoadReportRow) => {
    if (upvotedIds[report.id]) return;
    await onUpvoteReport(place.id, report);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="place-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-64 sm:h-76 shrink-0 bg-slate-900">
          <TrailImage
            src={resolvePlaceImage(place)}
            alt={place.title}
            title={place.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть карточку локации"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-5 left-6 right-6 text-white">
            <p className="text-xs font-medium text-white/80 mb-1.5">
              {CATEGORY_LABELS[place.category]} <span aria-hidden="true">·</span> {place.district}{' '}
              <span aria-hidden="true">·</span> Рейтинг {place.rating.toFixed(1)}
            </p>
            <h2
              id="place-modal-title"
              className="font-[var(--font-display)] text-3xl sm:text-4xl font-semibold leading-tight"
            >
              {place.title}
            </h2>
          </div>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="text-xs text-slate-500">Мин. транспорт</div>
              <div className="text-base font-semibold text-[#11161A] mt-0.5 flex items-center gap-1.5">
                <Car className="w-4 h-4 text-[#0D5C63] shrink-0" />
                <span>{CAR_TYPE_LABELS[place.min_car_type]}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Время на месте</div>
              <div className="text-base font-semibold text-[#11161A] tabular-nums mt-0.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#0D5C63] shrink-0" />
                <span>{formatDuration(place.visit_duration_min)}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Сезонность</div>
              <div className="text-base font-semibold text-[#11161A] mt-0.5">
                {place.seasonality}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Режим доступа</div>
              <div className="text-base font-semibold text-[#11161A] mt-0.5">
                {place.is_border_zone ? 'Погранзона' : 'Свободный'}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[15px] leading-relaxed text-slate-700">{place.description}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 pt-1">
              <span className="inline-flex items-center gap-1.5 font-[var(--font-mono)] tabular-nums">
                <MapPin className="w-3.5 h-3.5 text-[#0D5C63]" />
                {place.lat.toFixed(4)}° N, {place.lng.toFixed(4)}° E
              </span>
              {place.is_border_zone && (
                <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Требуется паспорт или пропуск в пограничную зону
                </span>
              )}
            </div>
          </div>

          {/* Road Reports Section */}
          <div className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-base font-semibold text-[#11161A]">
                Оперативные сводки по дороге ({place.road_reports.length})
              </h3>
              <span className="text-xs text-slate-500">Отчёты активны 72 часа</span>
            </div>

            {place.road_reports.length === 0 ? (
              <p className="text-sm text-slate-500 py-3 border-y border-slate-100">
                Свежих отметок о проезде за последние 72 часа пока нет. Будьте первым — оставьте
                отчёт ниже.
              </p>
            ) : (
              <div className="space-y-3">
                {place.road_reports.map((report) => {
                  const alreadyUpvoted = Boolean(upvotedIds[report.id]);
                  return (
                    <div
                      key={report.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${statusTextTone(report.status)}`}>
                            {ROAD_STATUS_LABELS[report.status]}
                          </span>
                          <span className="text-slate-400" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-slate-600">
                            Авто: {CAR_TYPE_LABELS[report.car_used]}
                          </span>
                          <span className="text-slate-400" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-slate-500 tabular-nums">
                            {formatRelativeTime(report.created_at)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUpvote(report)}
                          disabled={alreadyUpvoted}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium tabular-nums transition-colors ${
                            alreadyUpvoted
                              ? 'border-[#0D5C63] bg-[#0D5C63]/10 text-[#0D5C63] cursor-default'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 cursor-pointer'
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>Подтвердить ({report.upvotes})</span>
                        </button>
                      </div>

                      <p className="text-sm text-slate-700 leading-relaxed">{report.comment}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Road Report Form */}
            <form
              onSubmit={handleSubmit}
              className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white space-y-3"
            >
              <div className="text-sm font-semibold text-[#11161A]">
                Добавить отметку о состоянии подъезда
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-slate-500 block mb-1">Состояние дороги</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as RoadStatusEnum)}
                    className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-[#11161A] focus-visible:outline-2 focus-visible:outline-[#0D5C63]"
                  >
                    <option value="passable">Проезжаемо</option>
                    <option value="hard">Сложно / ямы / лужи</option>
                    <option value="blocked">Размыто / проезда нет</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs text-slate-500 block mb-1">Ваш автомобиль</span>
                  <select
                    value={carUsed}
                    onChange={(e) => setCarUsed(e.target.value as CarTypeEnum)}
                    className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-[#11161A] focus-visible:outline-2 focus-visible:outline-[#0D5C63]"
                  >
                    <option value="sedan">Седан</option>
                    <option value="crossover">Кроссовер</option>
                    <option value="suv_4x4">Внедорожник 4x4</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="text-xs text-slate-500 block mb-1">Комментарий по проезду</span>
                <textarea
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Например: после дождя глубокая колея перед перевалом, клиренс обязателен..."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-[#11161A] placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-[#0D5C63]"
                />
              </label>

              {formError && <p className="text-xs text-rose-600">{formError}</p>}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-[#0D5C63] rounded-lg hover:bg-[#094348] disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submitting ? 'Сохранение...' : 'Опубликовать отметку'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="text-xs text-slate-500 tabular-nums">
            Координаты: {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
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
              onClick={() => onToggleSave(place.id)}
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
