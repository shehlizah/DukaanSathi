import { Camera, MessageCircle, RefreshCw, Share2 } from 'lucide-react';
import type { ListingLanguage, ProductListing } from '../types';
import { buildWhatsappUrl } from '../utils/image';
import { CopyButton } from './CopyButton';

interface ListingResultsProps {
  listing: ProductListing;
  language: ListingLanguage;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export function ListingResults({
  listing,
  language,
  onRegenerate,
  isRegenerating = false,
}: ListingResultsProps) {
  const isUrdu = language === 'Urdu';
  const dir = isUrdu ? 'rtl' : 'ltr';
  const textClass = isUrdu ? 'font-urdu text-lg' : 'text-[15px] leading-relaxed';

  const sellingPointsText = listing.keySellingPoints.map((pt) => `• ${pt}`).join('\n');
  const socialFullText = `${listing.socialPost.caption}\n\n${listing.socialPost.hashtags.join(' ')}`;
  const feedbackFullText = [
    `Lighting: ${listing.photoFeedback.lighting}`,
    `Background: ${listing.photoFeedback.background}`,
    `Angle: ${listing.photoFeedback.angle}`,
  ].join('\n');

  const whatsappShareHref = buildWhatsappUrl(listing.whatsappMessage);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="flex-1 min-h-[48px] px-5 py-3 rounded-xl bg-white border border-[#E6DFD5] text-[#1F1915] font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-[#F3EDE4] active:scale-[0.99] transition-all whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B84A14]"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>Regenerate</span>
          </button>
        )}

        <a
          href={whatsappShareHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-h-[48px] px-5 py-3 rounded-xl bg-[#188F49] hover:bg-[#13763C] text-white font-semibold text-sm inline-flex items-center justify-center gap-2 active:scale-[0.99] transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#188F49] focus-visible:ring-offset-2"
        >
          <Share2 className="w-4 h-4" />
          <span>Share on WhatsApp</span>
        </a>
      </div>

      {/* 1. Product Title */}
      <article className="bg-white border border-[#E6DFD5] rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-[#F1ECE4]">
          <h3 className="text-sm font-bold text-[#1F1915]">Product Title</h3>
          <CopyButton text={listing.productTitle} label="Copy" />
        </div>
        <p
          dir={dir}
          className={
            isUrdu
              ? 'font-urdu text-xl font-bold text-[#1F1915]'
              : 'text-lg font-bold text-[#1F1915] leading-snug'
          }
        >
          {listing.productTitle}
        </p>
      </article>

      {/* 2. Product Description */}
      <article className="bg-white border border-[#E6DFD5] rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-[#F1ECE4]">
          <h3 className="text-sm font-bold text-[#1F1915]">Product Description</h3>
          <CopyButton text={listing.productDescription} label="Copy" />
        </div>
        <p dir={dir} className={`${textClass} text-[#2D251F] whitespace-pre-wrap`}>
          {listing.productDescription}
        </p>
      </article>

      {/* 3. 5 Key Selling Points */}
      <article className="bg-white border border-[#E6DFD5] rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-[#F1ECE4]">
          <h3 className="text-sm font-bold text-[#1F1915]">5 Key Selling Points</h3>
          <CopyButton text={sellingPointsText} label="Copy" />
        </div>
        <ul
          dir={dir}
          className={`space-y-2.5 list-disc ps-5 text-[#2D251F] ${textClass}`}
        >
          {listing.keySellingPoints.map((point, idx) => (
            <li key={idx} className="ps-1">
              {point}
            </li>
          ))}
        </ul>
      </article>

      {/* 4. Instagram / Facebook Caption + 8 Hashtags */}
      <article className="bg-white border border-[#E6DFD5] rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-[#F1ECE4]">
          <h3 className="text-sm font-bold text-[#1F1915]">Instagram &amp; Facebook Caption</h3>
          <CopyButton text={socialFullText} label="Copy" />
        </div>
        <p dir={dir} className={`${textClass} text-[#2D251F] whitespace-pre-wrap`}>
          {listing.socialPost.caption}
        </p>
        <div
          dir={dir}
          className="mt-4 pt-3 border-t border-[#F1ECE4] flex flex-wrap gap-x-3 gap-y-1.5 text-sm font-semibold text-[#9C3C0E]"
        >
          {listing.socialPost.hashtags.map((tag, idx) => (
            <span key={idx} dir="ltr" className="[unicode-bidi:isolate]">
              {tag}
            </span>
          ))}
        </div>
      </article>

      {/* 5. Ready-to-Send WhatsApp Message */}
      <article className="bg-[#F4FBF6] border border-[#CBEAD6] rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-[#DCF1E3]">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[#188F49]" />
            <h3 className="text-sm font-bold text-[#1F1915]">WhatsApp Customer Message</h3>
          </div>
          <CopyButton text={listing.whatsappMessage} label="Copy" />
        </div>
        <p dir={dir} className={`${textClass} text-[#1B2B21] whitespace-pre-wrap`}>
          {listing.whatsappMessage}
        </p>
      </article>

      {/* 6. Photo Feedback: 3 Quick Tips */}
      <article className="bg-white border border-[#E6DFD5] rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3 pb-3 mb-1 border-b border-[#F1ECE4]">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#B84A14]" />
            <h3 className="text-sm font-bold text-[#1F1915]">Photo Feedback</h3>
          </div>
          <CopyButton text={feedbackFullText} label="Copy" />
        </div>
        <div className="divide-y divide-[#F1ECE4]">
          <div className="py-3">
            <p className="text-xs font-bold tracking-wide text-[#9C3C0E] mb-1">Lighting</p>
            <p dir={dir} className={`${textClass} text-[#2D251F]`}>
              {listing.photoFeedback.lighting}
            </p>
          </div>
          <div className="py-3">
            <p className="text-xs font-bold tracking-wide text-[#9C3C0E] mb-1">Background</p>
            <p dir={dir} className={`${textClass} text-[#2D251F]`}>
              {listing.photoFeedback.background}
            </p>
          </div>
          <div className="pt-3">
            <p className="text-xs font-bold tracking-wide text-[#9C3C0E] mb-1">Angle</p>
            <p dir={dir} className={`${textClass} text-[#2D251F]`}>
              {listing.photoFeedback.angle}
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
