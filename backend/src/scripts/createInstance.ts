import 'dotenv/config';
import { EvolutionClient } from '../services/evolution';

async function createInstance() {
  const EVOLUTION_API_BASE_URL = process.env.EVOLUTION_API_BASE_URL;
  const EVOLUTION_API_TOKEN = process.env.EVOLUTION_API_TOKEN;
  const PUBLIC_WEBHOOK_URL = process.env.PUBLIC_WEBHOOK_URL;

  if (!PUBLIC_WEBHOOK_URL) {
    console.error('❌ PUBLIC_WEBHOOK_URL is required');
    process.exit(1);
  }

  if (!EVOLUTION_API_BASE_URL) {
    console.error('❌ EVOLUTION_API_BASE_URL is required');
    process.exit(1);
  }

  const client = new EvolutionClient(EVOLUTION_API_BASE_URL, EVOLUTION_API_TOKEN);

  try {
    console.log('🚀 Creating instance "wa-mvp"...');

    const createResult = await client.createInstance({
      instanceName: 'wa-mvp',
      webhook: {
        url: `${PUBLIC_WEBHOOK_URL}/webhooks/wa`,
        headers: {
          'X-Tenant': 'mvp'
        }
      }
    });

    console.log('✅ Instance creation result:');
    console.log(JSON.stringify(createResult, null, 2));

    console.log('\n🔍 Verifying instance...');

    const instanceInfo = await client.getInstance('wa-mvp');

    console.log('✅ Instance verification result:');
    console.log(JSON.stringify(instanceInfo, null, 2));

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.status) {
      console.error('Status:', error.status);
    }
    if (error.data) {
      console.error('Data:', JSON.stringify(error.data, null, 2));
    }
    process.exit(1);
  }
}

createInstance();