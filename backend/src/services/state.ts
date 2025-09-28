export interface ConversationState {
  botKey: string;      // p.ej. "menu-basic" | "reservas-basic"
  fsm?: string;        // p.ej. "WELCOME" | "SLOT_HELD" | "CONFIRMED"
  data?: Record<string, any>;
  updatedAt: number;
}

export interface StateStore {
  get(key: string): Promise<ConversationState | null>;
  set(key: string, value: ConversationState): Promise<void>;
  clear(key: string): Promise<void>;
}

export class InMemoryStateStore implements StateStore {
  private store = new Map<string, ConversationState>();

  async get(key: string): Promise<ConversationState | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: ConversationState): Promise<void> {
    this.store.set(key, {
      ...value,
      updatedAt: Date.now(),
    });
  }

  async clear(key: string): Promise<void> {
    this.store.delete(key);
  }
}

export function createStateStore(): StateStore {
  return new InMemoryStateStore();
}