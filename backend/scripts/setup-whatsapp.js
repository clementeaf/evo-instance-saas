#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');

const API_KEY = 'evolution-api-key-2024';
const INSTANCE_NAME = 'my-whatsapp';

console.log('📱 WhatsApp Setup - Simple & Clean');
console.log('==================================\n');

async function setupWhatsApp() {
  try {
    console.log('1️⃣ Creating WhatsApp instance...');

    // Create instance
    const createResponse = await axios.post('http://localhost:8080/instance/create', {
      instanceName: INSTANCE_NAME,
      webhook: 'http://host.docker.internal:8200/webhooks/wa'
    }, {
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json'
      },
      validateStatus: () => true
    });

    if (createResponse.status !== 201) {
      console.log('⚠️  Instance might already exist:', createResponse.data);
    } else {
      console.log('✅ Instance created successfully');
    }

    console.log('\n2️⃣ Generating QR Code...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const qrResponse = await axios.get(`http://localhost:8080/instance/connect/${INSTANCE_NAME}`, {
      headers: { 'apikey': API_KEY }
    });

    if (qrResponse.data?.base64) {
      // Save QR code
      const qrData = qrResponse.data.base64.replace('data:image/png;base64,', '');
      fs.writeFileSync('whatsapp-qr.png', qrData, 'base64');
      console.log('💾 QR Code saved as: whatsapp-qr.png');

      // Open QR code
      require('child_process').exec('open whatsapp-qr.png');

      console.log('\n📱 SCAN THIS QR WITH YOUR PHONE:');
      console.log('==============================');
      console.log('1. Open WhatsApp on your phone');
      console.log('2. Go to Settings > Linked Devices');
      console.log('3. Tap "Link a Device"');
      console.log('4. Scan the QR code that opened');
      console.log('');

      // Monitor connection
      console.log('⏳ Waiting for connection...');

      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
          const statusResponse = await axios.get(`http://localhost:8080/instance/connectionState/${INSTANCE_NAME}`, {
            headers: { 'apikey': API_KEY }
          });

          const state = statusResponse.data?.instance?.state;
          process.stdout.write(`\r📡 Status: ${state || 'connecting...'}  `);

          if (state === 'open') {
            console.log('\n\n✅ WhatsApp connected successfully!');
            console.log('\n🎉 Setup complete! You can now:');
            console.log('• Run: npm run send-message');
            console.log('• Or use the API endpoints');
            return;
          }
        } catch (error) {
          process.stdout.write('\r⏳ Connecting...  ');
        }
      }

      console.log('\n\n⚠️  Connection timeout. QR may have expired.');
      console.log('Try running: npm run setup-whatsapp again');

    } else {
      console.log('❌ Could not generate QR code');
      console.log('Response:', qrResponse.data);
    }

  } catch (error) {
    console.error('❌ Setup failed:', error.message);

    if (error.response) {
      console.log('Error details:', error.response.data);
    }
  }
}

setupWhatsApp();