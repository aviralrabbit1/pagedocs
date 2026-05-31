import { Injectable } from '@angular/core';

export interface RecentDoc {
  id: string;
  title: string;
  openedAt: string; // ISO timestamp
}

const KEY = 'pd_recent';
const MAX = 8;

// Tracks recently opened documents in localStorage (per browser/device).
@Injectable({ providedIn: 'root' })
export class RecentService {
  list(): RecentDoc[] {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as RecentDoc[]) : [];
    } catch {
      return [];
    }
  }

  /** Record an open (most-recent-first, de-duplicated, capped). */
  record(id: string, title: string, openedAt: string): void {
    const entry: RecentDoc = { id, title: title || 'Untitled document', openedAt };
    const next = [entry, ...this.list().filter((d) => d.id !== id)].slice(0, MAX);
    this.save(next);
  }

  /** Update the stored title for a doc if it is in the list. */
  updateTitle(id: string, title: string): void {
    const list = this.list();
    const item = list.find((d) => d.id === id);
    if (item) {
      item.title = title || 'Untitled document';
      this.save(list);
    }
  }

  remove(id: string): void {
    this.save(this.list().filter((d) => d.id !== id));
  }

  private save(list: RecentDoc[]): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch {
      // ignore quota / disabled storage
    }
  }
}
