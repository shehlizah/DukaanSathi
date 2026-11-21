import { ArrowLeft, ChevronRight, ShoppingBag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { HistoryEntry } from '../types';
import { formatHistoryDate } from '../utils/storage';
import { ListingResults } from './ListingResults';

interface HistoryTabProps {
  entries: HistoryEntry[];
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
  onSwitchToCreate: () => void;
}

export function HistoryTab({
  entries,
  onDeleteEntry,
  onClearAll,
  onSwitchToCreate,
}: HistoryTabProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const selectedEntry = entries.find((item) => item.id === selectedId) || null;

  if (selectedEntry) {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-[#E6DFD5] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E6DFD5] text-sm font-semibold text-[#1F1915] inline-flex items-center gap-2 hover:bg-[#EFE8DE] cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to History</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-[#685D53] font-medium tabular-nums">
            <span>{selectedEntry.language}</span>
            <span aria-hidden="true">·</span>
            <span>{formatHistoryDate(selectedEntry.createdAt)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {selectedEntry.thumbnail && (
            <div className="lg:col-span-4 bg-white border border-[#E6DFD5] rounded-2xl p-4">
              <img
                src={selectedEntry.thumbnail}
                alt={selectedEntry.result.productTitle || 'Saved product'}
                referrerPolicy="no-referrer"
                className="w-full max-h-72 object-contain rounded-xl bg-[#FAF7F2]"
              />
              {selectedEntry.notes && (
                <p className="mt-3 text-xs text-[#685D53] leading-relaxed">
                  Seller note: {selectedEntry.notes}
                </p>
              )}
            </div>
          )}

          <div className={selectedEntry.thumbnail ? 'lg:col-span-8' : 'lg:col-span-12'}>
            <ListingResults
              listing={selectedEntry.result}
              language={selectedEntry.language}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E6DFD5] rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#F1ECE4]">
        <div>
          <h2 className="text-lg font-bold text-[#1F1915]">Saved Listings</h2>
          <p className="text-xs text-[#685D53] tabular-nums">
            Last {entries.length} of 10 listings saved on this device
          </p>
        </div>

        {entries.length > 0 && (
          <div className="flex items-center gap-2">
            {confirmClear ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setConfirmClear(false);
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#B83227] text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                >
                  Confirm Clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E6DFD5] text-xs font-semibold text-[#1F1915] cursor-pointer whitespace-nowrap shrink-0"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E6DFD5] text-xs font-semibold text-[#685D53] hover:text-[#1F1915] hover:bg-[#EFE8DE] cursor-pointer whitespace-nowrap shrink-0"
              >
                Clear History
              </button>
            )}
          </div>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="py-14 px-4 text-center max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#FDF1E8] text-[#B84A14] flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1F1915] mb-1.5">No saved listings yet</h3>
          <p className="text-sm text-[#685D53] mb-5 leading-relaxed">
            Upload a product photo and generate your first listing. Your last 10 listings will be stored here automatically.
          </p>
          <button
            type="button"
            onClick={onSwitchToCreate}
            className="min-h-[48px] px-6 py-3 rounded-xl bg-[#B84A14] hover:bg-[#9C3C0E] text-white text-sm font-semibold cursor-pointer whitespace-nowrap"
          >
            Create First Listing
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[#F1ECE4]">
          {entries.map((entry) => {
            const isUrdu = entry.language === 'Urdu';
            return (
              <div
                key={entry.id}
                className="py-3.5 flex items-center gap-3.5"
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(entry.id)}
                  className="flex-1 min-w-0 flex items-center gap-3.5 text-left cursor-pointer rounded-xl p-1.5 -m-1.5 hover:bg-[#FAF7F2] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B84A14]"
                >
                  {entry.thumbnail ? (
                    <img
                      src={entry.thumbnail}
                      alt={entry.result.productTitle}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover border border-[#E6DFD5] bg-[#FAF7F2] shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-[#E6DFD5] bg-[#FDF1E8] text-[#B84A14] flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3
                      dir={isUrdu ? 'rtl' : 'ltr'}
                      className={
                        isUrdu
                          ? 'font-urdu text-base font-bold text-[#1F1915] truncate'
                          : 'text-sm font-bold text-[#1F1915] truncate'
                      }
                    >
                      {entry.result.productTitle || 'Product Listing'}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[#685D53] tabular-nums">
                      <span>{entry.language}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatHistoryDate(entry.createdAt)}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-[#8B7E72] shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteEntry(entry.id)}
                  aria-label={`Delete ${entry.result.productTitle}`}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#8B7E72] hover:text-[#B83227] hover:bg-[#FDECEA] transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
