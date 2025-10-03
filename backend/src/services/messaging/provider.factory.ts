import { MessagingProvider } from './provider.interface';
import { EvolutionProvider } from './evolution.provider';
import { MetaProvider } from './meta.provider';
import { config } from '../../config';

/**
 * Messaging Provider Factory
 *
 * Creates and returns the appropriate messaging provider based on configuration.
 * This allows for easy switching between providers without changing application code.
 *
 * Usage:
 *   const provider = MessagingProviderFactory.create();
 *   const instance = await provider.createInstance(...);
 *
 * Configuration:
 *   Set MESSAGING_PROVIDER env variable to 'evolution' or 'meta'
 *   Default is 'evolution'
 */
export class MessagingProviderFactory {
  private static instance: MessagingProvider | null = null;

  /**
   * Create a messaging provider instance
   * @param type - Provider type ('evolution' or 'meta'). If not specified, uses env variable or default
   * @returns MessagingProvider instance
   */
  static create(type?: string): MessagingProvider {
    const providerType = type || process.env.MESSAGING_PROVIDER || 'evolution';

    switch (providerType.toLowerCase()) {
      case 'evolution':
        return new EvolutionProvider(
          config.evolutionApi.baseUrl,
          config.evolutionApi.token
        );

      case 'meta':
        return new MetaProvider(
          process.env.META_ACCESS_TOKEN,
          process.env.META_PHONE_NUMBER_ID
        );

      default:
        console.warn(`⚠️ Unknown provider type: ${providerType}. Defaulting to Evolution API.`);
        return new EvolutionProvider(
          config.evolutionApi.baseUrl,
          config.evolutionApi.token
        );
    }
  }

  /**
   * Get or create a singleton instance of the messaging provider
   * Useful for reusing the same provider instance across the application
   * @param type - Provider type ('evolution' or 'meta')
   * @returns MessagingProvider singleton instance
   */
  static getInstance(type?: string): MessagingProvider {
    if (!this.instance) {
      this.instance = this.create(type);
    }
    return this.instance;
  }

  /**
   * Reset the singleton instance (useful for testing or switching providers at runtime)
   */
  static resetInstance(): void {
    this.instance = null;
  }

  /**
   * Get list of available providers
   * @returns Array of provider names
   */
  static getAvailableProviders(): string[] {
    return ['evolution', 'meta'];
  }

  /**
   * Check if a provider type is valid
   * @param type - Provider type to check
   * @returns boolean
   */
  static isValidProvider(type: string): boolean {
    return this.getAvailableProviders().includes(type.toLowerCase());
  }
}
