import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import storage from '@/lib/comment-monitor-storage';

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();
    
    switch (action) {
      case 'test_keyword_detection':
        return await testKeywordDetection(params);
      case 'simulate_comment':
        return await simulateComment(params);
      case 'check_monitors':
        return await checkMonitors();
      case 'add_test_monitor':
        return await addTestMonitor(params);
      case 'test_multiple_scenarios':
        return await testMultipleScenarios();
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function testKeywordDetection(params: any) {
  const { keyword, commentText } = params;
  
  const result = {
    keyword: keyword || 'test',
    commentText: commentText || 'this is a test comment',
    match: false,
    caseSensitive: false,
    partialMatch: false
  };
  
  const lowerKeyword = result.keyword.toLowerCase();
  const lowerComment = result.commentText.toLowerCase();
  
  result.match = lowerComment.includes(lowerKeyword);
  result.caseSensitive = result.commentText.includes(result.keyword);
  result.partialMatch = lowerComment.indexOf(lowerKeyword) !== -1;
  
  return NextResponse.json({
    success: true,
    action: 'test_keyword_detection',
    result,
    explanation: `Keyword '${result.keyword}' ${result.match ? 'FOUND' : 'NOT FOUND'} in comment '${result.commentText}'`
  });
}

async function simulateComment(params: any) {
  const { postId, commentText, commenterId, skipDM } = params;
  
  const webhookPayload = {
    object: 'instagram',
    entry: [{
      id: process.env.INSTAGRAM_ACCOUNT_ID || '12345',
      time: Math.floor(Date.now() / 1000),
      changes: [{
        field: 'comments',
        value: {
          id: `comment_${Date.now()}`,
          media_id: postId || 'DFICIYYCurs',
          text: commentText || 'test comment',
          from: {
            id: commenterId || (skipDM ? 'test_user' : '123456789'),
            username: 'testuser'
          },
          created_time: new Date().toISOString()
        }
      }]
    }]
  };

  // Send to webhook
  const webhookUrl = 'http://localhost:3000/api/instagram/webhook';
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bypass-signature': 'development'
    },
    body: JSON.stringify(webhookPayload)
  });

  const webhookResult = await response.text();
  
  return NextResponse.json({
    success: true,
    action: 'simulate_comment',
    simulatedPayload: webhookPayload,
    webhookStatus: response.status,
    webhookResponse: webhookResult,
    skipDM
  });
}

async function checkMonitors() {
  const monitors = storage.getAllMonitors();
  const activeMonitors = storage.getActiveMonitors();
  const stats = storage.getStats();
  
  return NextResponse.json({
    success: true,
    action: 'check_monitors',
    totalMonitors: monitors.length,
    activeMonitors: activeMonitors.length,
    monitors: monitors.map(m => ({
      id: m.id,
      postId: m.postId,
      keyword: m.keyword,
      isActive: m.isActive,
      detectionCount: m.detectionCount,
      lastDetection: m.lastDetection
    })),
    stats
  });
}

async function addTestMonitor(params: any) {
  const { postUrl, keyword, autoReplyMessage } = params;
  
  const monitor = {
    id: `test_monitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    postUrl: postUrl || 'https://www.instagram.com/p/DFICIYYCurs/',
    postId: 'DFICIYYCurs',
    keyword: keyword || 'test',
    autoReplyMessage: autoReplyMessage || 'Hi! You commented [keyword] on my post. Thanks for engaging!',
    isActive: true,
    createdAt: new Date().toISOString(),
    detectionCount: 0,
  };
  
  storage.addMonitor(monitor);
  
  return NextResponse.json({
    success: true,
    action: 'add_test_monitor',
    monitor
  });
}

async function testMultipleScenarios() {
  const scenarios = [
    {
      name: 'Exact keyword match',
      commentText: 'test',
      keyword: 'test',
      shouldMatch: true
    },
    {
      name: 'Keyword in sentence',
      commentText: 'this is a test comment',
      keyword: 'test',
      shouldMatch: true
    },
    {
      name: 'Case insensitive match',
      commentText: 'This is a TEST comment',
      keyword: 'test',
      shouldMatch: true
    },
    {
      name: 'No match',
      commentText: 'this is a great post',
      keyword: 'test',
      shouldMatch: false
    },
    {
      name: 'Partial word match',
      commentText: 'testing this out',
      keyword: 'test',
      shouldMatch: true
    }
  ];
  
  const results = scenarios.map(scenario => {
    const lowerKeyword = scenario.keyword.toLowerCase();
    const lowerComment = scenario.commentText.toLowerCase();
    const actualMatch = lowerComment.includes(lowerKeyword);
    
    return {
      ...scenario,
      actualMatch,
      passed: actualMatch === scenario.shouldMatch,
      status: actualMatch === scenario.shouldMatch ? 'PASS' : 'FAIL'
    };
  });
  
  return NextResponse.json({
    success: true,
    action: 'test_multiple_scenarios',
    totalTests: scenarios.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    results
  });
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Comment System Test API',
    availableActions: [
      'test_keyword_detection',
      'simulate_comment', 
      'check_monitors',
      'add_test_monitor',
      'test_multiple_scenarios'
    ],
    usage: {
      'test_keyword_detection': { keyword: 'test', commentText: 'this is a test' },
      'simulate_comment': { postId: 'DFICIYYCurs', commentText: 'test comment', commenterId: '123456789', skipDM: true },
      'check_monitors': {},
      'add_test_monitor': { keyword: 'test', postUrl: 'https://instagram.com/p/ABC123/' },
      'test_multiple_scenarios': {}
    }
  });
}