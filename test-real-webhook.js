// Test script for real Instagram webhook handling
const fs = require('fs');

// Real Instagram webhook payload structure
const realWebhookPayload = {
  "entry": [
    {
      "id": "17841463755973016", 
      "time": 1756374809, 
      "changes": [
        {
          "value": {
            "from": {
              "id": "1470586027524842", 
              "username": "haseebahmedrazakhandeveloper"
            }, 
            "media": {
              "id": "18053482142033648", 
              "media_product_type": "FEED"
            }, 
            "id": "18050043134260182", 
            "text": "test"
          }, 
          "field": "comments"
        }
      ]
    }
  ], 
  "object": "instagram"
};

async function testRealWebhook() {
  try {
    console.log('🧪 Testing Real Instagram Webhook Handler');
    console.log('='.repeat(50));
    
    // 1. Test webhook payload structure
    console.log('1. Webhook Payload Structure:');
    console.log(JSON.stringify(realWebhookPayload, null, 2));
    
    // 2. Test media ID extraction
    const commentData = realWebhookPayload.entry[0].changes[0].value;
    const mediaId = commentData.media_id || commentData.media?.id;
    console.log('\n2. Media ID Extraction:');
    console.log('   commentData.media_id:', commentData.media_id);
    console.log('   commentData.media?.id:', commentData.media?.id);
    console.log('   Extracted mediaId:', mediaId);
    
    // 3. Test the real webhook endpoint
    console.log('\n3. Testing Real Webhook Endpoint...');
    
    const response = await fetch('http://localhost:3000/api/instagram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bypass-signature': 'development'
      },
      body: JSON.stringify(realWebhookPayload)
    });
    
    const result = await response.text();
    console.log('   Status:', response.status);
    console.log('   Response:', result);
    
    // 4. Add a monitor for testing
    console.log('\n4. Adding Test Monitor...');
    const monitorResponse = await fetch('http://localhost:3000/api/comment-monitors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        postUrl: 'https://www.instagram.com/p/DFICIYYCurs/',
        keyword: 'test',
        autoReplyMessage: 'Thanks for your test comment!'
      })
    });
    
    const monitorResult = await monitorResponse.json();
    console.log('   Monitor created:', monitorResult.success);
    if (monitorResult.monitor) {
      console.log('   Monitor ID:', monitorResult.monitor.id);
      console.log('   Post ID:', monitorResult.monitor.postId);
    }
    
    // 5. Link media ID to monitor
    if (monitorResult.success && monitorResult.monitor) {
      console.log('\n5. Linking Media ID to Monitor...');
      const linkResponse = await fetch('http://localhost:3000/api/link-media-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          monitorId: monitorResult.monitor.id,
          mediaId: '18053482142033648'
        })
      });
      
      const linkResult = await linkResponse.json();
      console.log('   Link result:', linkResult.success);
      console.log('   Message:', linkResult.message);
    }
    
    // 6. Test webhook again with linked monitor
    console.log('\n6. Testing Webhook with Linked Monitor...');
    const finalResponse = await fetch('http://localhost:3000/api/instagram/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bypass-signature': 'development'
      },
      body: JSON.stringify(realWebhookPayload)
    });
    
    const finalResult = await finalResponse.text();
    console.log('   Final Status:', finalResponse.status);
    console.log('   Final Response:', finalResult);
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRealWebhook();