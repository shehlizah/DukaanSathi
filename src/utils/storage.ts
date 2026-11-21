import type { HistoryEntry } from '../types';

const STORAGE_KEY = 'dukaan_saathi_history_v1';
const MAX_HISTORY_ITEMS = 10;

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistHistory(entries: HistoryEntry[]): void {
  const bounded = entries.slice(0, MAX_HISTORY_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bounded));
  } catch {
    // If browser localStorage quota is tight, drop thumbnails from older entries first
    const trimmed = bounded.map((entry, index) =>
      index > 2 ? { ...entry, thumbnail: '' } : entry
    );
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Ignore quota errors silently
    }
  }
}

export function addHistoryEntry(entry: HistoryEntry): HistoryEntry[] {
  const current = loadHistory();
  const next = [entry, ...current].slice(0, MAX_HISTORY_ITEMS);
  persistHistory(next);
  return next;
}

export function deleteHistoryEntry(id: string): HistoryEntry[] {
  const next = loadHistory().filter((item) => item.id !== id);
  persistHistory(next);
  return next;
}

export function clearHistoryEntries(): HistoryEntry[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage error
  }
  return [];
}

export function formatHistoryDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
