import { NextRequest, NextResponse } from 'next/server';
import { instagramAPI } from '@/lib/instagram-api';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    logger.info('Running Instagram API test', 'TEST');
    
    // Test 1: Get account info
    const accountInfo = await instagramAPI.getAccountInfo();
    
    // Test 2: Validate token
    const isTokenValid = await instagramAPI.validateToken();
    
    // Test 3: Check environment variables
    const envCheck = {
      hasAppId: !!process.env.NEXT_PUBLIC_META_APP_ID,
      hasAppSecret: !!process.env.META_APP_SECRET,
      hasWebhookToken: !!process.env.WEBHOOK_VERIFY_TOKEN,
      hasAccountId: !!process.env.INSTAGRAM_ACCOUNT_ID,
      hasAccessToken: !!process.env.INSTAGRAM_ACCESS_TOKEN
    };
    
    const testResults = {
      timestamp: new Date().toISOString(),
      environment: envCheck,
      tokenValid: isTokenValid,
      accountInfo: accountInfo.error ? { error: accountInfo.error } : {
        id: accountInfo.id,
        username: accountInfo.username,
        name: accountInfo.name
      },
      webhookUrl: `${request.nextUrl.origin}/api/instagram/webhook`,
      status: isTokenValid && !accountInfo.error ? 'success' : 'error'
    };
    
    logger.info('Instagram API test completed', 'TEST', testResults);
    
    return NextResponse.json(testResults);
    
  } catch (error) {
    logger.error('Instagram API test failed', 'TEST', {}, error as Error);
    
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, recipientId, message } = body;
    
    if (action === 'send_test_message') {
      if (!recipientId || !message) {
        return NextResponse.json({
          error: 'Missing recipientId or message'
        }, { status: 400 });
      }
      
      logger.info('Sending test message', 'TEST', { recipientId, message });
      
      const result = await instagramAPI.sendMessage(recipientId, message);
      
      return NextResponse.json({
        success: !result.error,
        result,
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      error: 'Unknown action'
    }, { status: 400 });
    
  } catch (error) {
    logger.error('Test POST request failed', 'TEST', {}, error as Error);
    
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}