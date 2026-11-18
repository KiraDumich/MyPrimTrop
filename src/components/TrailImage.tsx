import { useState } from 'react';
import { Mountain } from 'lucide-react';

interface TrailImageProps {
  src: string;
  alt: string;
  title: string;
  className?: string;
}

export function TrailImage({ src, alt, title, className = '' }: TrailImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#1B2B34] to-[#0D5C63] text-white/90 p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Mountain className="w-8 h-8 mb-2 opacity-75" />
        <span className="text-sm font-medium">{title}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
