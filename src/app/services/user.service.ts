import { Injectable, signal, computed } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

export interface UserIdentity {
  userId: string;
  userName: string;
}

const STORAGE_KEY = 'sprint_casino_user';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly _identity = signal<UserIdentity | null>(this._loadFromStorage());

  readonly identity = this._identity.asReadonly();
  readonly hasIdentity = computed(() => this._identity() !== null);
  readonly userName = computed(() => this._identity()?.userName ?? null);
  readonly userId = computed(() => this._identity()?.userId ?? null);

  setUserName(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;

    const existing = this._identity();
    const identity: UserIdentity = {
      userId: existing?.userId ?? uuidv4(),
      userName: trimmed,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
    this._identity.set(identity);
  }

  private _loadFromStorage(): UserIdentity | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (
        typeof parsed?.userId === 'string' &&
        parsed.userId &&
        typeof parsed?.userName === 'string' &&
        parsed.userName
      ) {
        return { userId: parsed.userId, userName: parsed.userName };
      }
      return null;
    } catch {
      return null;
    }
  }
}
