# Bot Development Guide

## Available Bots

### 1. MenuBot (`menu-basic`)
Main menu with 4 options.

### 2. ReservationsBasicBot (`reservations-basic`)
FSM-based booking system with states: WELCOME → GET_NAME → GET_DATE → GET_TIME → CONFIRMED

### 3. SimpleAI (`simple-ai`)
OpenAI-powered conversational bot.

## Activating Bots

```bash
# 1. Start worker
npm run worker

# 2. Send message to your WhatsApp
# Bot will respond automatically
```

## Creating Custom Bots

```typescript
// src/bots/MyBot.ts
export class MyBot {
  static key = "my-bot";

  static async handleMessage(ctx: BotContext) {
    await ctx.sendText(ctx.from, "Hello!");
    
    await ctx.setState({
      botKey: "my-bot",
      fsm: "NEXT_STATE",
      data: {}
    });
  }
}
```

Register in `src/bots/registry.ts`.

See `src/bots/` for complete examples.
