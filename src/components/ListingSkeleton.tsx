import { useEffect, useState } from 'react';

const STATUS_MESSAGES = [
  'Inspecting your product photo...',
  'Writing an SEO title & persuasive description...',
  'Crafting Instagram caption, hashtags & WhatsApp message...',
  'Preparing lighting, background & angle photo tips...',
];

export function ListingSkeleton() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStepIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 1700);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="space-y-4" aria-live="polite" aria-busy="true">
      <div className="bg-white border border-[#E6DFD5] rounded-2xl px-5 py-4 flex items-center gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-[#B84A14] border-t-transparent animate-spin shrink-0" />
        <p className="text-sm font-semibold text-[#9C3C0E]">
          {STATUS_MESSAGES[stepIndex]}
        </p>
      </div>

      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="bg-white border border-[#E6DFD5] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#F1ECE4]">
            <div className="h-4 w-40 rounded-md shimmer-bar" />
            <div className="h-9 w-20 rounded-xl shimmer-bar" />
          </div>
          <div className="h-4 w-full rounded-md shimmer-bar" />
          <div className="h-4 w-11/12 rounded-md shimmer-bar" />
          {item % 2 === 0 && <div className="h-4 w-3/4 rounded-md shimmer-bar" />}
        </div>
      ))}
    </div>
  );
}
