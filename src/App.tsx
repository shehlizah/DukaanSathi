import {
  AlertCircle,
  Camera,
  Clock,
  ImagePlus,
  RefreshCw,
  Sparkles,
  Store,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { HistoryTab } from './components/HistoryTab';
import { ListingResults } from './components/ListingResults';
import { ListingSkeleton } from './components/ListingSkeleton';
import type { HistoryEntry, ListingLanguage, ProductListing } from './types';
import {
  type ProcessedImage,
  processImageFile,
  processImageFromUrl,
} from './utils/image';
import {
  addHistoryEntry,
  clearHistoryEntries,
  deleteHistoryEntry,
  loadHistory,
} from './utils/storage';

const SAMPLE_IMAGE_URL = '/src/assets/images/sample_leather_wallet_1795257880183.jpg';

const SAMPLE_PROMPTS = [
  'handmade leather wallet, Rs 1500',
  '3-piece embroidered lawn suit, Rs 3800, unstitched',
  'homemade mango achar 500g glass jar, Rs 650',
];

const LANGUAGES: { value: ListingLanguage; label: string; hint: string; isUrdu?: boolean }[] = [
  { value: 'English', label: 'English', hint: 'Clear & modern' },
  { value: 'Urdu', label: 'اردو', hint: 'Urdu script', isUrdu: true },
  { value: 'Roman Urdu', label: 'Roman Urdu', hint: 'WhatsApp style' },
];

type ActiveTab = 'create' | 'history';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('create');
  const [image, setImage] = useState<ProcessedImage | null>(null);
  const [notes, setNotes] = useState('');
  const [language, setLanguage] = useState<ListingLanguage>('English');
  const [listing, setListing] = useState<ProductListing | null>(null);
  const [resultLanguage, setResultLanguage] = useState<ListingLanguage>('English');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());

  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const resultsAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  async function handleFileSelected(file: File | undefined) {
    if (!file) return;
    setErrorMessage('');

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please choose an image file (JPG, PNG, or WebP).');
      return;
    }

    try {
      const processed = await processImageFile(file);
      setImage(processed);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Could not read that photo. Please try another image.'
      );
    }
  }

  async function handleUseSamplePhoto() {
    setErrorMessage('');
    try {
      const processed = await processImageFromUrl(SAMPLE_IMAGE_URL);
      setImage(processed);
      if (!notes.trim()) {
        setNotes('handmade leather wallet, Rs 1500');
      }
    } catch {
      setErrorMessage('Could not load the sample photo. Please upload your own product photo.');
    }
  }

  function handleTakePhotoClick() {
    setErrorMessage('');
    const isTouchDevice =
      typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
    if (isTouchDevice) {
      nativeCameraInputRef.current?.click();
    } else {
      setIsCameraOpen(true);
    }
  }

  function handleClearPhoto() {
    setImage(null);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (nativeCameraInputRef.current) nativeCameraInputRef.current.value = '';
  }

  function handleResetWorkspace() {
    setActiveTab('create');
    handleClearPhoto();
    setNotes('');
    setListing(null);
    setErrorMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleGenerate(isRegenerate = false) {
    setErrorMessage('');

    if (!image) {
      setErrorMessage('Please upload or take a product photo first so Dukaan Saathi can see it.');
      return;
    }

    setIsLoading(true);
    if (window.innerWidth < 1024) {
      window.setTimeout(() => {
        resultsAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
    }

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(35000),
        body: JSON.stringify({
          imageBase64: image.base64,
          mimeType: image.mimeType,
          notes: notes.trim(),
          language,
          isRegenerate,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        listing?: ProductListing;
        error?: string;
      };

      if (!response.ok || !payload.listing) {
        throw new Error(
          payload.error || 'Could not generate your listing right now. Please try again.'
        );
      }

      setListing(payload.listing);
      setResultLanguage(language);

      const updated = addHistoryEntry({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        language,
        notes: notes.trim(),
        thumbnail: image.thumbnailUrl || image.dataUrl,
        result: payload.listing,
      });
      setHistory(updated);
    } catch (err) {
      if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        setErrorMessage('The request took too long to respond. Please tap Try Again.');
      } else {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Unable to reach Dukaan Saathi right now. Please check your connection and try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleDeleteHistory(id: string) {
    setHistory(deleteHistoryEntry(id));
  }

  function handleClearHistory() {
    setHistory(clearHistoryEntries());
  }

  function scrollToAbout() {
    const aboutEl = document.getElementById('about-section');
    aboutEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F1915] flex flex-col pb-20 md:pb-10">
      {/* Top Navigation Bar */}
      <header className="md:sticky md:top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E6DFD5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('create');
            }}
            className="text-lg font-extrabold tracking-tight text-[#1F1915] whitespace-nowrap shrink-0"
          >
            Dukaan Saathi
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`min-h-[40px] px-1 whitespace-nowrap shrink-0 cursor-pointer border-b-2 transition-colors ${
                activeTab === 'create'
                  ? 'border-[#B84A14] text-[#1F1915] font-semibold'
                  : 'border-transparent text-[#685D53] hover:text-[#1F1915]'
              }`}
            >
              Create Listing
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`min-h-[40px] px-1 whitespace-nowrap shrink-0 cursor-pointer border-b-2 transition-colors tabular-nums ${
                activeTab === 'history'
                  ? 'border-[#B84A14] text-[#1F1915] font-semibold'
                  : 'border-transparent text-[#685D53] hover:text-[#1F1915]'
              }`}
            >
              History ({history.length})
            </button>
            <button
              type="button"
              onClick={scrollToAbout}
              className="min-h-[40px] px-1 whitespace-nowrap shrink-0 cursor-pointer border-b-2 border-transparent text-[#685D53] hover:text-[#1F1915] transition-colors"
            >
              About
            </button>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={handleResetWorkspace}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#B84A14] hover:bg-[#9C3C0E] text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              New Listing
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="top" className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-10">
        {activeTab === 'create' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: Product Studio Input */}
            <section className="lg:col-span-5 space-y-5">
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F1915] text-balance leading-tight">
                  Turn a product photo into ready-to-sell copy
                </h1>
                <p className="text-sm text-[#685D53] leading-relaxed">
                  Built for Pakistani shop owners and home businesses. Upload an item photo and get listings in seconds.
                </p>
              </div>

              <div className="bg-white border border-[#E6DFD5] rounded-2xl p-5 space-y-6">
                {/* Step 1: Product Photo */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h2 className="text-sm font-bold text-[#1F1915]">1. Product Photo</h2>
                    {!image && (
                      <button
                        type="button"
                        onClick={handleUseSamplePhoto}
                        className="min-h-[36px] text-xs font-semibold text-[#B84A14] hover:text-[#9C3C0E] underline underline-offset-4 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Try sample photo
                      </button>
                    )}
                  </div>

                  {!image ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        void handleFileSelected(e.dataTransfer.files?.[0]);
                      }}
                      className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
                        isDragging
                          ? 'border-[#B84A14] bg-[#FDF1E8]'
                          : 'border-[#D9CFC2] bg-[#FAF7F2]'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-[#FDF1E8] text-[#B84A14] flex items-center justify-center mx-auto mb-3">
                        <ImagePlus className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-[#1F1915] mb-1">
                        Show us your product
                      </p>
                      <p className="text-xs text-[#685D53] mb-4">
                        Snap a quick photo or upload from gallery
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={handleTakePhotoClick}
                          className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#B84A14] hover:bg-[#9C3C0E] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Take Photo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="min-h-[48px] px-4 py-2.5 rounded-xl bg-white border border-[#E6DFD5] hover:bg-[#F3EDE4] text-[#1F1915] text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload Photo</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#E6DFD5] overflow-hidden bg-[#FAF7F2]">
                      <img
                        src={image.dataUrl}
                        alt="Selected product preview"
                        className="w-full max-h-64 object-contain bg-[#FAF7F2]"
                      />
                      <div className="px-3.5 py-2.5 bg-white border-t border-[#E6DFD5] flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#126B46]">Photo ready</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => galleryInputRef.current?.click()}
                            className="min-h-[44px] px-3 rounded-lg bg-[#FAF7F2] border border-[#E6DFD5] text-xs font-semibold text-[#1F1915] hover:bg-[#EFE8DE] cursor-pointer whitespace-nowrap"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={handleClearPhoto}
                            aria-label="Remove product photo"
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-[#FAF7F2] border border-[#E6DFD5] text-[#685D53] hover:text-[#B83227] cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void handleFileSelected(e.target.files?.[0])}
                  />
                  <input
                    ref={nativeCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => void handleFileSelected(e.target.files?.[0])}
                  />
                </div>

                {/* Step 2: Optional Notes */}
                <div className="pt-5 border-t border-[#F1ECE4]">
                  <label htmlFor="seller-notes" className="block text-sm font-bold text-[#1F1915] mb-2">
                    2. Add Details (Optional)
                  </label>
                  <textarea
                    id="seller-notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. handmade leather wallet, Rs 1500, pure cowhide, delivery available across Pakistan"
                    className="w-full rounded-xl border border-[#D9CFC2] bg-white px-3.5 py-3 text-sm text-[#1F1915] placeholder:text-[#8E8276] focus:outline-none focus:border-[#B84A14] focus:ring-2 focus:ring-[#B84A14]/15 resize-y"
                  />
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {SAMPLE_PROMPTS.map((sample) => (
                      <button
                        key={sample}
                        type="button"
                        onClick={() => setNotes(sample)}
                        className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#E6DFD5] text-xs font-medium text-[#685D53] hover:text-[#1F1915] hover:bg-[#EFE8DE] cursor-pointer transition-colors text-left"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 3: Language Selection */}
                <div className="pt-5 border-t border-[#F1ECE4]">
                  <span className="block text-sm font-bold text-[#1F1915] mb-2.5">
                    3. Choose Language
                  </span>
                  <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Listing language">
                    {LANGUAGES.map((lang) => {
                      const active = language === lang.value;
                      return (
                        <button
                          key={lang.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setLanguage(lang.value)}
                          className={`min-h-[56px] px-2 py-2 rounded-xl border text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${
                            active
                              ? 'border-[#B84A14] bg-[#FDF1E8] text-[#9C3C0E] ring-1 ring-[#B84A14]'
                              : 'border-[#E6DFD5] bg-white text-[#1F1915] hover:bg-[#FAF7F2]'
                          }`}
                        >
                          <span
                            className={`text-sm font-bold whitespace-nowrap ${
                              lang.isUrdu ? 'font-urdu text-base leading-normal' : ''
                            }`}
                          >
                            {lang.label}
                          </span>
                          <span className="text-[11px] text-[#685D53] whitespace-nowrap">
                            {lang.hint}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Generate CTA */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => void handleGenerate(false)}
                    disabled={isLoading}
                    className="w-full min-h-[52px] px-6 py-3.5 rounded-xl bg-[#B84A14] hover:bg-[#9C3C0E] active:scale-[0.99] text-white font-bold text-base inline-flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B84A14] focus-visible:ring-offset-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>{isLoading ? 'Creating Listing...' : 'Create Product Listing'}</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Right Column: Results, Loading, Error, or Guidance */}
            <section ref={resultsAnchorRef} className="lg:col-span-7 space-y-4">
              {errorMessage && (
                <div
                  role="alert"
                  className="bg-[#FDECEA] border border-[#F3C1BC] rounded-2xl p-4 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#B83227] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-[#94241B]">Could not complete listing</p>
                      <p className="text-sm text-[#7A2018] mt-0.5">{errorMessage}</p>
                    </div>
                  </div>
                  {image && (
                    <button
                      type="button"
                      onClick={() => void handleGenerate(false)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#F3C1BC] text-xs font-semibold text-[#94241B] hover:bg-[#FFF5F4] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Try Again</span>
                    </button>
                  )}
                </div>
              )}

              {isLoading ? (
                <ListingSkeleton />
              ) : listing ? (
                <ListingResults
                  listing={listing}
                  language={resultLanguage}
                  onRegenerate={() => void handleGenerate(true)}
                  isRegenerating={isLoading}
                />
              ) : (
                <div className="bg-white border border-[#E6DFD5] rounded-2xl p-6 sm:p-8 space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-[#1F1915] mb-1.5">
                      What you get from one photo
                    </h2>
                    <p className="text-sm text-[#685D53] leading-relaxed">
                      Upload a clear product photo and Dukaan Saathi writes every piece of copy you need to sell online in English, Urdu, or Roman Urdu.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 pt-2 border-t border-[#F1ECE4]">
                    <div>
                      <h3 className="text-sm font-bold text-[#1F1915]">SEO Product Title</h3>
                      <p className="text-xs text-[#685D53] mt-1 leading-relaxed">
                        Search-friendly headline tailored for Pakistani online shoppers.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1F1915]">Persuasive Description</h3>
                      <p className="text-xs text-[#685D53] mt-1 leading-relaxed">
                        Short, warm product story highlighting material and craftsmanship.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1F1915]">5 Key Selling Points</h3>
                      <p className="text-xs text-[#685D53] mt-1 leading-relaxed">
                        Scannable bullets buyers check before placing an order.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1F1915]">Instagram &amp; Facebook Post</h3>
                      <p className="text-xs text-[#685D53] mt-1 leading-relaxed">
                        Engaging caption with emojis and 8 local shopping hashtags.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1F1915]">WhatsApp Customer Message</h3>
                      <p className="text-xs text-[#685D53] mt-1 leading-relaxed">
                        Polite message ready to forward directly via Share on WhatsApp.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1F1915]">3 Photo Improvement Tips</h3>
                      <p className="text-xs text-[#685D53] mt-1 leading-relaxed">
                        Actionable lighting, background, and angle tips for your exact photo.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        ) : (
          <HistoryTab
            entries={history}
            onDeleteEntry={handleDeleteHistory}
            onClearAll={handleClearHistory}
            onSwitchToCreate={() => setActiveTab('create')}
          />
        )}

        {/* About Section */}
        <section
          id="about-section"
          className="bg-white border border-[#E6DFD5] rounded-2xl p-6 sm:p-8"
        >
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-[#B84A14]">
              <Store className="w-5 h-5" />
              <h2 className="text-base font-bold text-[#1F1915]">About Dukaan Saathi</h2>
            </div>
            <p className="text-base sm:text-lg font-semibold text-[#1F1915] leading-snug">
              Helping small businesses in Pakistan compete online with AI, in their own language.
            </p>
            <p className="text-sm text-[#685D53] leading-relaxed">
              Designed for home-based bakers, boutique tailors, leather artisans, and local shopkeepers selling on WhatsApp, Instagram, and Facebook—no account or complicated setup required.
            </p>
          </div>
        </section>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/95 backdrop-blur-md border-t border-[#E6DFD5] grid grid-cols-2"
      >
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer whitespace-nowrap ${
            activeTab === 'create' ? 'text-[#B84A14]' : 'text-[#685D53]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Create Listing</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer whitespace-nowrap tabular-nums ${
            activeTab === 'history' ? 'text-[#B84A14]' : 'text-[#685D53]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>History ({history.length})</span>
        </button>
      </nav>

      {/* Live Camera Capture Modal (Desktop / Camera API) */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(processed) => setImage(processed)}
        onFallbackToFile={() => galleryInputRef.current?.click()}
      />
    </div>
  );
}
