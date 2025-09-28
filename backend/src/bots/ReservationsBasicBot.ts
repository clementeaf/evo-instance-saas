import type { BotContext } from "./runtime";
import { holdSlot, confirmSlot, getSlot } from "../services/bookingRepo";

export class ReservationsBasicBot {
  static key = "reservas-basic";

  static async handleMessage(ctx: BotContext) {
    const fsm = ctx.state?.fsm ?? "WELCOME";
    const text = (ctx.text ?? "").trim();
    const resourceId = "default";
    const holdMs = Number(process.env.SLOT_HOLD_MS ?? 180000);

    if (fsm === "WELCOME") {
      // Configure example slots
      const now = new Date();
      const startA = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 16, 0, 0);
      const startB = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0, 0);
      const endA = new Date(startA.getTime() + 60 * 60 * 1000); // +60 min
      const endB = new Date(startB.getTime() + 60 * 60 * 1000); // +60 min

      const startA_ISO = startA.toISOString();
      const endA_ISO = endA.toISOString();
      const startB_ISO = startB.toISOString();
      const endB_ISO = endB.toISOString();

      // Try to hold both slots
      const [holdResultA, holdResultB] = await Promise.all([
        holdSlot({
          tenantId: ctx.tenantId,
          resourceId,
          startISO: startA_ISO,
          endISO: endA_ISO,
          holdMs
        }),
        holdSlot({
          tenantId: ctx.tenantId,
          resourceId,
          startISO: startB_ISO,
          endISO: endB_ISO,
          holdMs
        })
      ]);

      // Build menu with availability
      const optionA = holdResultA.success
        ? "A) Hoy 16:00"
        : "A) Hoy 16:00 (no disponible)";

      const optionB = holdResultB.success
        ? "B) Mañana 10:00"
        : "B) Mañana 10:00 (no disponible)";

      await ctx.sendText(ctx.from,
        "🗓️ *Reservas*\n" +
        "Opciones rápidas:\n" +
        `${optionA}\n` +
        `${optionB}\n` +
        "Responde *A* o *B* para tomar el horario."
      );

      // Store slot info for later confirmation
      await ctx.setState({
        fsm: "SLOT_HELD",
        data: {
          slots: {
            A: {
              available: holdResultA.success,
              slotId: holdResultA.slotId,
              startISO: startA_ISO,
              endISO: endA_ISO,
              display: "Hoy 16:00"
            },
            B: {
              available: holdResultB.success,
              slotId: holdResultB.slotId,
              startISO: startB_ISO,
              endISO: endB_ISO,
              display: "Mañana 10:00"
            }
          }
        }
      });
      return;
    }

    if (fsm === "SLOT_HELD") {
      const choice = text.toUpperCase();

      if (!["A", "B"].includes(choice)) {
        await ctx.sendText(ctx.from, "❓ Opción inválida. Responde *A* (Hoy 16:00) o *B* (Mañana 10:00).");
        return;
      }

      const selectedSlot = ctx.state?.data?.slots?.[choice];

      if (!selectedSlot) {
        await ctx.sendText(ctx.from, "❌ Error interno. Responde *MENÚ* para volver al inicio.");
        return;
      }

      if (!selectedSlot.available) {
        await ctx.sendText(ctx.from, `❌ ${selectedSlot.display} no está disponible. Elige otra opción.`);
        return;
      }

      // Check if slot still held and try to confirm
      const currentSlot = await getSlot(selectedSlot.slotId);
      if (!currentSlot || currentSlot.status !== 'held' || (currentSlot.holdUntil && currentSlot.holdUntil < Date.now())) {
        // Try to hold again
        const reholdResult = await holdSlot({
          tenantId: ctx.tenantId,
          resourceId,
          startISO: selectedSlot.startISO,
          endISO: selectedSlot.endISO,
          holdMs
        });

        if (!reholdResult.success) {
          await ctx.sendText(ctx.from, "⏳ Expiró el hold, intenta otra vez.");
          await ctx.setState({ fsm: "WELCOME", data: {} });
          return;
        }
      }

      // Confirm the slot
      const confirmResult = await confirmSlot({
        tenantId: ctx.tenantId,
        waNumber: ctx.from,
        resourceId,
        startISO: selectedSlot.startISO,
        endISO: selectedSlot.endISO
      });

      if (!confirmResult.success) {
        await ctx.sendText(ctx.from, "⏳ Expiró el hold, intenta otra vez.");
        await ctx.setState({ fsm: "WELCOME", data: {} });
        return;
      }

      await ctx.setState({
        fsm: "CONFIRMED",
        data: {
          ...ctx.state?.data,
          bookingId: confirmResult.bookingId,
          confirmedSlot: selectedSlot.display
        }
      });

      await ctx.sendText(ctx.from,
        `✅ *Reserva confirmada* para ${selectedSlot.display}. ` +
        `Te enviaremos un recordatorio.\n\n` +
        `ID: ${confirmResult.bookingId}`
      );
      return;
    }

    if (fsm === "CONFIRMED") {
      const confirmedSlot = ctx.state?.data?.confirmedSlot || "tu horario";
      await ctx.sendText(ctx.from,
        `✅ Tu reserva para ${confirmedSlot} ya está confirmada. ` +
        `Responde *MENÚ* para volver al inicio.`
      );
      return;
    }
  }
}