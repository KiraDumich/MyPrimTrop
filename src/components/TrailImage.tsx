import { useEffect, useState } from 'react';
import { Droplets, Landmark, Mountain, Waves } from 'lucide-react';
import { CATEGORY_LABELS } from '../data/mockPlaces';
import type { PlaceCategoryEnum } from '../types/database';

interface TrailImageProps {
  src: string;
  alt: string;
  title: string;
  category?: PlaceCategoryEnum;
  className?: string;
}

function categoryGradient(category: PlaceCategoryEnum): string {
  if (category === 'beach') {
    return 'from-[#0D5C63] via-[#177E89] to-[#1E3A5F]';
  }
  if (category === 'waterfall') {
    return 'from-[#134E4A] via-[#0F766E] to-[#1E293B]';
  }
  if (category === 'history') {
    return 'from-[#334155] via-[#1E293B] to-[#0F172A]';
  }
  return 'from-[#1B2B34] via-[#0D5C63] to-[#2C4A52]';
}

function CategoryFallbackIcon({ category }: { category: PlaceCategoryEnum }) {
  if (category === 'beach') return <Waves className="w-9 h-9 opacity-85" />;
  if (category === 'waterfall') return <Droplets className="w-9 h-9 opacity-85" />;
  if (category === 'history') return <Landmark className="w-9 h-9 opacity-85" />;
  return <Mountain className="w-9 h-9 opacity-85" />;
}

export function TrailImage({
  src,
  alt,
  title,
  category = 'viewpoint',
  className = '',
}: TrailImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Градиентная заглушка с иконкой категории на время загрузки или при недоступности фото */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br ${categoryGradient(
          category
        )} text-white/90 p-6 text-center transition-opacity duration-300 ${
          isLoaded && !hasError ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        aria-hidden={isLoaded && !hasError}
      >
        <CategoryFallbackIcon category={category} />
        <span className="mt-2.5 text-xs font-medium text-white/80">
          {CATEGORY_LABELS[category]}
        </span>
        <span className="mt-0.5 text-sm font-semibold text-white line-clamp-1 max-w-[90%]">
          {title}
        </span>
      </div>

      {!hasError && (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`relative z-10 transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
        />
      )}
    </div>
  );
}
