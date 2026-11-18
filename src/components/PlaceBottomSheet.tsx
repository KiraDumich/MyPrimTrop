import { useState } from 'react';
import {
  AlertTriangle,
  Car,
  Check,
  CheckCircle2,
  Clock,
  HelpCircle,
  ShieldAlert,
  ThumbsUp,
  X,
  XCircle,
} from 'lucide-react';
import { CATEGORY_LABELS, ROAD_STATUS_LABELS } from '../data/mockPlaces';
import {
  BellAlertIcon,
  BookmarkRibbonIcon,
  CameraPlusIcon,
  ShareNodesIcon,
} from './PrimTropIcons';
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
  const [shared, setShared] = useState(false);

  if (!place) return null;

  const latestReport = place.road_reports[0] ?? null;
  const isUpvoted = latestReport ? Boolean(upvotedIds[latestReport.id]) : false;

  const handleSharePlace = async () => {
    const shareText = `${place.title} (${place.district}) — ${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `ПримТроп: ${place.title}`,
          text: shareText,
          url: window.location.href,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      }
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      // Пользователь отменил диалог
    }
  };

  return (
    <>
      {/* Mobile subtle backdrop to dismiss sheet */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="md:hidden fixed inset-0 z-30 bg-slate-950/30 backdrop-blur-[1px]"
      />

      <div className="fixed inset-x-0 bottom-0 z-40 p-0 md:absolute md:inset-x-0 md:bottom-0 md:z-20 md:p-5 pointer-events-none flex justify-center">
        <section
          aria-label={`Карточка места: ${place.title}`}
          className="w-full max-w-2xl bg-white border-t md:border border-slate-200 rounded-t-2xl md:rounded-2xl shadow-2xl pointer-events-auto overflow-hidden max-h-[82dvh] flex flex-col"
        >
          {/* Mobile sheet indicator */}
          <div className="md:hidden pt-2.5 pb-1 flex justify-center shrink-0">
            <span className="w-10 h-1 rounded-full bg-slate-300" aria-hidden="true" />
          </div>

          <div className="px-4 pt-2 pb-[calc(1rem+env(safe-area-inset-bottom))] md:p-5 space-y-3.5 md:space-y-4 overflow-y-auto">
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
                  onClick={handleSharePlace}
                  aria-label="Поделиться координатами места"
                  title={shared ? 'Скопировано' : 'Поделиться'}
                  className={`w-10 h-10 md:w-9 md:h-9 rounded-xl md:rounded-lg border flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
                    shared
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {shared ? <Check className="w-4 h-4" /> : <ShareNodesIcon className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => onToggleSave(place.id)}
                  aria-label={isSaved ? 'Убрать из маршрута' : 'Сохранить в маршрут'}
                  className={`w-10 h-10 md:w-9 md:h-9 rounded-xl md:rounded-lg border flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
                    isSaved
                      ? 'bg-[#0D5C63] border-[#0D5C63] text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <BookmarkRibbonIcon filled={isSaved} className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Закрыть карточку места"
                  className="w-10 h-10 md:w-9 md:h-9 rounded-xl md:rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-[#11161A] hover:border-slate-300 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Road Condition Block */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <BellAlertIcon className="w-3.5 h-3.5 text-[#0D5C63]" />
                  <span>Актуальное состояние дороги</span>
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
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium tabular-nums transition-colors ${
                        isUpvoted
                          ? 'border-[#0D5C63] bg-[#0D5C63]/10 text-[#0D5C63] cursor-default'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 active:scale-95 cursor-pointer'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Подтвердить (+1) · {latestReport.upvotes}</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
              <button
                type="button"
                onClick={() => onOpenDetails(place)}
                className="min-h-[44px] px-4 py-2.5 text-sm font-medium text-[#11161A] bg-white border border-slate-300 rounded-xl md:rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
              >
                Открыть подробнее
              </button>
              <button
                type="button"
                onClick={() => onOpenReportModal(place)}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#D95D39] hover:bg-[#C04B28] active:scale-[0.98] rounded-xl md:rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-sm"
              >
                <CameraPlusIcon className="w-4 h-4 shrink-0" />
                <span>Сообщить о дороге</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
