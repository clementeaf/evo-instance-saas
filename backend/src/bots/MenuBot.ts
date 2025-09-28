import type { BotContext } from "./runtime";
import { ReservationsBasicBot } from "./ReservationsBasicBot";

export class MenuBot {
  static key = "menu-basic";

  static async handleMessage(ctx: BotContext) {
    const text = (ctx.text ?? "").trim();

    // Handle menu options
    if (text === "1") {
      await ctx.setState({
        botKey: ReservationsBasicBot.key,
        fsm: "WELCOME",
        data: {}
      });
      return ReservationsBasicBot.handleMessage(ctx);
    }

    if (text === "2") {
      await ctx.sendText(ctx.from, "💳 *Pagos en construcción*\n\nEsta funcionalidad estará disponible pronto. Responde *MENÚ* para volver al inicio.");
      return;
    }

    if (text === "3") {
      await ctx.sendText(ctx.from, "👤 *Conectándote con un agente...*\n\nEn breve te contactaremos. Responde *MENÚ* para volver al inicio.");
      return;
    }

    // Show main menu (default behavior)
    const menu = [
      "👋 *Bienvenido*",
      "1) Reservar una cita",
      "2) Consultar/confirmar pago",
      "3) Hablar con un agente",
      "",
      "Responde con el número de la opción."
    ].join("\n");

    await ctx.sendText(ctx.from, menu);
  }
}