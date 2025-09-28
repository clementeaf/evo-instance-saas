import { StateStore, ConversationState } from "../services/state";

export interface BotContext {
  tenantId: string;
  instanceName: string;
  from: string;
  text?: string;
  stateStore: StateStore;
  stateKey: string;
  state: ConversationState | null;
  setState: (patch: Partial<ConversationState>) => Promise<void>;
  clearState: () => Promise<void>;
  sendText: (to: string, body: string) => Promise<void>;
}

export function extractText(evt: any): string {
  return evt.message?.text?.body ?? "";
}

export function buildStateKey(tenantId: string, from: string): string {
  return `${tenantId}:${from}`;
}

export function createStateHelpers(
  stateStore: StateStore,
  stateKey: string,
  currentState: ConversationState | null
) {
  const setState = async (patch: Partial<ConversationState>): Promise<void> => {
    const newState: ConversationState = {
      botKey: currentState?.botKey ?? patch.botKey ?? "menu-basic",
      fsm: patch.fsm,
      data: patch.data,
      updatedAt: Date.now(),
      ...patch,
    };
    await stateStore.set(stateKey, newState);
  };

  const clearState = async (): Promise<void> => {
    await stateStore.clear(stateKey);
  };

  return { setState, clearState };
}