import {
  AlertTriangle,
  Bookmark,
  Car,
  CheckCircle2,
  Clock,
  HelpCircle,
  MessageSquarePlus,
  ShieldAlert,
  ThumbsUp,
  X,
  XCircle,
} from 'lucide-react';
import { CATEGORY_LABELS, ROAD_STATUS_LABELS } from '../data/mockPlaces';
import type {
  CarTypeEnum,
  PlaceWithReports,
  RoadReportRow,
  RoadStatusEnum,
} from '../types/database';

interface PlaceBottomSheetProps {
  place: PlaceWithReports | null;
  isSaved: boolean;
  upvotedIds: Record<string, boolean>;
  onClose: () => void;
  onOpenDetails: (place: PlaceWithReports) => void;
  onOpenReportModal: (place: PlaceWithReports) => void;
  onUpvoteReport: (placeId: string, report: RoadReportRow) => Promise<void>;
  onToggleSave: (placeId: string) => void;
}

const MIN_CAR_BADGE_TEXT: Record<CarTypeEnum, string> = {
  sedan: 'Проедет седан',
  crossover: 'Нужен кроссовер',
  suv_4x4: 'Нужен 4x4',
};

function formatHoursAgo(isoDate: string): string {
  const diffMs = Math.max(0, Date.now() - new Date(isoDate).getTime());
  const totalMinutes = Math.floor(diffMs / 60_000);
  if (totalMinutes < 60) {
    return totalMinutes <= 1 ? 'только что' : `${totalMinutes} мин назад`;
  }
  const hours = Math.floor(totalMinutes / 60);
  if (hours < 24) {
    return `${hours} ч назад`;
  }
  const days = Math.floor(hours / 24);
  return `${days} дн. назад`;
}

function StatusIcon({ status }: { status: RoadStatusEnum }) {
  if (status === 'passable') {
    return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
  }
  if (status === 'hard') {
    return <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />;
  }
  return <XCircle className="w-4 h-4 text-rose-600 shrink-0" />;
}

function statusAccentClass(status: RoadStatusEnum): string {
  if (status === 'passable') return 'text-emerald-700';
  if (status === 'hard') return 'text-amber-700';
  return 'text-rose-700';
}

export function PlaceBottomSheet({
  place,
  isSaved,
  upvotedIds,
  onClose,
  onOpenDetails,
  onOpenReportModal,
  onUpvoteReport,
  onToggleSave,
}: PlaceBottomSheetProps) {
  if (!place) return null;

  const latestReport = place.road_reports[0] ?? null;
  const isUpvoted = latestReport ? Boolean(upvotedIds[latestReport.id]) : false;

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 p-3 sm:p-5 pointer-events-none flex justify-center">
      <section
        aria-label={`Карточка места: ${place.title}`}
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
      >
        <div className="p-4 sm:p-5 space-y-4">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>{CATEGORY_LABELS[place.category]}</span>
                <span aria-hidden="true">·</span>
                <span>{place.district}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#0D5C63]">
                  <Car className="w-3.5 h-3.5" />
                  <span>{MIN_CAR_BADGE_TEXT[place.min_car_type]}</span>
                </span>
              </div>

              <h3 className="font-[var(--font-display)] text-2xl sm:text-3xl font-semibold text-[#11161A] leading-tight mt-1">
                {place.title}
              </h3>

              {place.is_border_zone && (
                <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>Погранзона (нужен пропуск)</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onToggleSave(place.id)}
                aria-label={isSaved ? 'Убрать из маршрута' : 'Сохранить в маршрут'}
                className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                  isSaved
                    ? 'bg-[#0D5C63] border-[#0D5C63] text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Bookmark className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть карточку места"
                className="w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-[#11161A] hover:border-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Road Condition Block */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-700">
                Актуальное состояние дороги
              </div>
              {latestReport && (
                <div className="inline-flex items-center gap-1 text-xs text-slate-500 tabular-nums">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatHoursAgo(latestReport.created_at)}</span>
                </div>
              )}
            </div>

            {latestReport ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 text-sm font-semibold">
                    <StatusIcon status={latestReport.status} />
                    <span className={statusAccentClass(latestReport.status)}>
                      {ROAD_STATUS_LABELS[latestReport.status]}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isUpvoted}
                    onClick={() => onUpvoteReport(place.id, latestReport)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium tabular-nums transition-colors ${
                      isUpvoted
                        ? 'border-[#0D5C63] bg-[#0D5C63]/10 text-[#0D5C63] cursor-default'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 cursor-pointer'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>
                      Подтвердить (+1) · {latestReport.upvotes}
                    </span>
                  </button>
                </div>

                <p className="text-sm text-slate-700 leading-snug">{latestReport.comment}</p>
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-0.5">
                <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Нет свежих данных за 72 часа — поделитесь обстановкой на подъезде.</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-0.5">
            <button
              type="button"
              onClick={() => onOpenDetails(place)}
              className="sm:flex-1 px-4 py-2.5 text-sm font-medium text-[#11161A] bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              Открыть подробнее
            </button>
            <button
              type="button"
              onClick={() => onOpenReportModal(place)}
              className="sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#D95D39] hover:bg-[#C04B28] rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-sm"
            >
              <MessageSquarePlus className="w-4 h-4 shrink-0" />
              <span>Сообщить о дороге</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
