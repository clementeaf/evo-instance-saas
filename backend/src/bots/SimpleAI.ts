import type { BotContext } from "./runtime";
import { OpenAIService } from "../services/openai";

export class SimpleAI {
  static key = "simple-ai";
  private static openaiService = new OpenAIService();

  static async handleMessage(ctx: BotContext) {
    try {
      const userMessage = (ctx.text ?? "").trim();

      if (!userMessage) {
        await ctx.sendText(ctx.from, "👋 ¡Hola! Soy tu asistente de IA. ¿En qué puedo ayudarte?");
        return;
      }

      const systemPrompt = `Eres un asistente virtual amigable para un negocio de WhatsApp.

INSTRUCCIONES:
- Responde de manera concisa y útil
- Usa emojis apropiadamente
- Si te preguntan sobre reservas, menciona que pueden usar el comando "reservas"
- Si te preguntan sobre el menú, menciona que pueden usar "menú"
- Mantén un tono profesional pero amigable
- Responde en español
- Máximo 2-3 líneas por respuesta

CONTEXTO DEL NEGOCIO:
- Empresa: ${ctx.tenantId}
- Ofrecemos servicios de reservas
- Tenemos bots especializados para diferentes funciones`;

      console.log(`🤖 Processing AI message from ${ctx.from}: "${userMessage}"`);

      const aiResponse = await this.openaiService.generateResponse(userMessage, systemPrompt);

      console.log(`🤖 AI Response generated: "${aiResponse}"`);

      await ctx.sendText(ctx.from, aiResponse);

    } catch (error: any) {
      console.error('❌ Error in SimpleAI:', error.message);

      await ctx.sendText(
        ctx.from,
        "🔧 Lo siento, hay un problema técnico. Por favor intenta de nuevo o escribe *MENÚ* para ver las opciones disponibles."
      );
    }
  }
}