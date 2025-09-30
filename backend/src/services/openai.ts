import OpenAI from 'openai';
import { config } from '../config';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  async generateResponse(userMessage: string, systemPrompt?: string): Promise<string> {
    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt,
        });
      }

      messages.push({
        role: 'user',
        content: userMessage,
      });

      const completion = await this.client.chat.completions.create({
        model: config.openai.model,
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content;

      if (!response) {
        throw new Error('No response generated from OpenAI');
      }

      return response.trim();
    } catch (error: any) {
      console.error('❌ OpenAI API Error:', error.message);

      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key');
      }

      if (error.status === 429) {
        throw new Error('OpenAI rate limit exceeded');
      }

      throw new Error('Failed to generate AI response');
    }
  }

  async generateResponseWithContext(
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt?: string
  ): Promise<string> {
    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt,
        });
      }

      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });

      messages.push({
        role: 'user',
        content: userMessage,
      });

      const completion = await this.client.chat.completions.create({
        model: config.openai.model,
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content;

      if (!response) {
        throw new Error('No response generated from OpenAI');
      }

      return response.trim();
    } catch (error: any) {
      console.error('❌ OpenAI API Error:', error.message);
      throw new Error('Failed to generate AI response with context');
    }
  }
}