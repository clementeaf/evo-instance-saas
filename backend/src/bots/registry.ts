import { MenuBot } from "./MenuBot";
import { ReservationsBasicBot } from "./ReservationsBasicBot";
import { SimpleAI } from "./SimpleAI";

export const BotRegistry = {
  get(key: string) {
    if (key === ReservationsBasicBot.key) return ReservationsBasicBot;
    if (key === MenuBot.key) return MenuBot;
    if (key === SimpleAI.key) return SimpleAI;
    return MenuBot; // fallback
  }
};