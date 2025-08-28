#!/usr/bin/env node

// Test script for comment monitoring API
const BASE_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('🧪 Testing Comment Monitoring API...\n');

  try {
    // Test 1: Get initial monitors (should be empty)
    console.log('📋 Test 1: GET /api/comment-monitors');
    const response1 = await fetch(`${BASE_URL}/api/comment-monitors`);
    const data1 = await response1.json();
    console.log('Response:', data1);
    console.log('✅ Expected: Empty monitors list\n');

    // Test 2: Get initial stats
    console.log('📊 Test 2: GET /api/comment-monitors/stats');
    const response2 = await fetch(`${BASE_URL}/api/comment-monitors/stats`);
    const data2 = await response2.json();
    console.log('Response:', data2);
    console.log('✅ Expected: All zeros\n');

    // Test 3: Create a new monitor
    console.log('➕ Test 3: POST /api/comment-monitors');
    const testMonitor = {
      postUrl: 'https://www.instagram.com/p/ABC123/',
      keyword: 'giveaway',
      autoReplyMessage: 'Hi! You commented "giveaway" on my post. Thanks for engaging with my content!'
    };
    
    const response3 = await fetch(`${BASE_URL}/api/comment-monitors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMonitor)
    });
    
    const data3 = await response3.json();
    console.log('Response:', data3);
    
    if (data3.success) {
      console.log('✅ Monitor created successfully');
      const monitorId = data3.monitor.id;
      
      // Test 4: Get monitors again (should have 1)
      console.log('\n📋 Test 4: GET /api/comment-monitors (after creation)');
      const response4 = await fetch(`${BASE_URL}/api/comment-monitors`);
      const data4 = await response4.json();
      console.log('Response:', data4);
      console.log('✅ Expected: 1 monitor\n');

      // Test 5: Get specific monitor
      console.log(`🔍 Test 5: GET /api/comment-monitors/${monitorId}`);
      const response5 = await fetch(`${BASE_URL}/api/comment-monitors/${monitorId}`);
      const data5 = await response5.json();
      console.log('Response:', data5);
      console.log('✅ Expected: Specific monitor details\n');

      // Test 6: Update monitor
      console.log(`✏️ Test 6: PUT /api/comment-monitors/${monitorId}`);
      const response6 = await fetch(`${BASE_URL}/api/comment-monitors/${monitorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword: 'contest',
          isActive: false
        })
      });
      
      const data6 = await response6.json();
      console.log('Response:', data6);
      console.log('✅ Expected: Updated monitor\n');

      // Test 7: Get updated stats
      console.log('📊 Test 7: GET /api/comment-monitors/stats (after updates)');
      const response7 = await fetch(`${BASE_URL}/api/comment-monitors/stats`);
      const data7 = await response7.json();
      console.log('Response:', data7);
      console.log('✅ Expected: 1 total monitor, 0 active (since we deactivated it)\n');

      // Test 8: Delete monitor
      console.log(`🗑️ Test 8: DELETE /api/comment-monitors/${monitorId}`);
      const response8 = await fetch(`${BASE_URL}/api/comment-monitors/${monitorId}`, {
        method: 'DELETE'
      });
      
      const data8 = await response8.json();
      console.log('Response:', data8);
      console.log('✅ Expected: Success message\n');

      // Test 9: Verify deletion
      console.log('📋 Test 9: GET /api/comment-monitors (after deletion)');
      const response9 = await fetch(`${BASE_URL}/api/comment-monitors`);
      const data9 = await response9.json();
      console.log('Response:', data9);
      console.log('✅ Expected: Empty monitors list again\n');

    } else {
      console.log('❌ Failed to create monitor:', data3.error);
    }

    console.log('🎉 API Testing Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/comment-monitors/stats`);
    if (response.ok) {
      console.log('🟢 Server is running at', BASE_URL);
      return true;
    }
  } catch (error) {
    console.log('🔴 Server is not running at', BASE_URL);
    console.log('Please start the development server with: bun run dev');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testAPI();
  }
}

main();