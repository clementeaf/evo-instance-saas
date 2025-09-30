import type { BotContext } from "./runtime";
import { ReservationsBasicBot } from "./ReservationsBasicBot";
import { SimpleAI } from "./SimpleAI";

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
      await ctx.setState({
        botKey: SimpleAI.key,
        fsm: "CHAT",
        data: {}
      });
      await ctx.sendText(ctx.from, "🤖 *Asistente IA activado*\n\nAhora puedes hacerme cualquier pregunta. Escribe *MENÚ* para volver al inicio.");
      return;
    }

    if (text === "4") {
      await ctx.sendText(ctx.from, "👤 *Conectándote con un agente...*\n\nEn breve te contactaremos. Responde *MENÚ* para volver al inicio.");
      return;
    }

    // Show main menu (default behavior)
    const menu = [
      "👋 *Bienvenido*",
      "1) Reservar una cita",
      "2) Consultar/confirmar pago",
      "3) Asistente IA 🤖",
      "4) Hablar con un agente",
      "",
      "Responde con el número de la opción."
    ].join("\n");

    await ctx.sendText(ctx.from, menu);
  }
}