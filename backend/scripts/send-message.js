#!/usr/bin/env node

const axios = require('axios');

const PHONE_NUMBER = '+56959263366'; // Your phone number
const INSTANCE_NAME = 'my-whatsapp';

console.log('📤 Sending Test Message');
console.log('======================\n');

async function sendMessage() {
  try {
    console.log(`📱 Sending message to: ${PHONE_NUMBER}`);
    console.log(`📋 Instance: ${INSTANCE_NAME}\n`);

    // Send via backend API (recommended way)
    const response = await axios.post('http://localhost:8200/api/v1/messages/send', {
      instance_id: INSTANCE_NAME,
      to: PHONE_NUMBER,
      message: '🚀 Test message from your WhatsApp SaaS!\n\n✅ Everything is working perfectly.\n\nTime: ' + new Date().toLocaleString()
    }, {
      headers: {
        'Authorization': 'Bearer pk_live_test',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (response.data.success) {
      console.log('✅ Message sent successfully!');
      console.log('📱 Check your phone for the message');
      console.log('\nResponse:', JSON.stringify(response.data, null, 2));
    } else {
      console.log('⚠️  Message failed to send');
      console.log('Error:', response.data.error);
    }

  } catch (error) {
    console.error('❌ Failed to send message:');

    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }

    console.log('\n💡 Make sure:');
    console.log('• WhatsApp is connected (run: npm run setup-whatsapp)');
    console.log('• Backend is running (npm run dev)');
    console.log('• Evolution API is running (docker-compose up)');
  }
}

sendMessage();