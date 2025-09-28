import { MenuBot } from "./MenuBot";
import { ReservationsBasicBot } from "./ReservationsBasicBot";

export const BotRegistry = {
  get(key: string) {
    if (key === ReservationsBasicBot.key) return ReservationsBasicBot;
    if (key === MenuBot.key) return MenuBot;
    return MenuBot; // fallback
  }
};