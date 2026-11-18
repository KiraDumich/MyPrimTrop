import { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#0D5C63] hover:bg-[#094348] rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        <Download className="w-4 h-4" />
        <span>Установить на экран</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-[#0D5C63] border border-[#0D5C63]/30 bg-white hover:bg-[#0D5C63]/5 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Smartphone className="w-4 h-4" />
          <span>Установить на iPhone</span>
        </button>

        {showGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
            onClick={() => setShowGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-[#11161A]">
                  Установка «ПримТроп» на iOS
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  aria-label="Закрыть инструкцию"
                  className="p-1 text-slate-400 hover:text-[#11161A] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                <li>
                  Нажмите кнопку <strong>Поделиться</strong> на панели Safari.
                </li>
                <li>
                  Выберите пункт <strong>На экран «Домой»</strong>.
                </li>
                <li>Подтвердите добавление — приложение запустится как нативное.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-full py-2.5 text-sm font-medium text-white bg-[#0D5C63] rounded-xl hover:bg-[#094348] transition-colors cursor-pointer"
              >
                Понятно
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-[#0D5C63] border border-[#0D5C63]/30 bg-white hover:bg-[#0D5C63]/5 rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        <Smartphone className="w-4 h-4" />
        <span>Установить как PWA</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-[#11161A]">
                Установка PWA «ПримТроп»
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Закрыть инструкцию"
                className="p-1 text-slate-400 hover:text-[#11161A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Откройте сайт в Chrome, Edge или Safari на смартфоне и нажмите{' '}
              <strong>«Установить приложение»</strong> в меню браузера — иконка «ПримТроп»
              появится на главном экране в режиме <code>standalone</code>.
            </p>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 text-sm font-medium text-white bg-[#0D5C63] rounded-xl hover:bg-[#094348] transition-colors cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}
