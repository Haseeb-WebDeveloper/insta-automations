import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Test endpoint to simulate Instagram comment webhook
export async function POST(request: NextRequest) {
  try {
    const { postId, commentText, commenterId, testType } = await request.json();
    
    logger.info('Testing comment webhook simulation', 'WEBHOOK_TEST', {
      postId,
      commentText,
      commenterId,
      testType
    });

    // Create a simulated Instagram webhook payload for comment events
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
              id: commenterId || '123456789',
              username: 'testuser'
            },
            created_time: new Date().toISOString()
          }
        }]
      }]
    };

    console.log('=== SIMULATING COMMENT WEBHOOK ===');
    console.log('Payload:', JSON.stringify(webhookPayload, null, 2));

    // Send the simulated webhook to our webhook endpoint
    const webhookUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000/api/instagram/webhook'
      : `${process.env.VERCEL_URL || 'https://your-domain.com'}/api/instagram/webhook`;

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bypass-signature': 'development' // Bypass signature verification for testing
      },
      body: JSON.stringify(webhookPayload)
    });

    const webhookResult = await webhookResponse.text();
    
    logger.info('Webhook simulation completed', 'WEBHOOK_TEST', {
      status: webhookResponse.status,
      response: webhookResult
    });

    return NextResponse.json({
      success: true,
      message: 'Comment webhook simulation completed',
      simulatedPayload: webhookPayload,
      webhookStatus: webhookResponse.status,
      webhookResponse: webhookResult,
      testDetails: {
        postId: postId || 'DFICIYYCurs',
        commentText: commentText || 'test comment',
        commenterId: commenterId || '123456789',
        testType: testType || 'basic'
      }
    });

  } catch (error) {
    console.error('Webhook test error:', error);
    logger.error('Error in webhook test', 'WEBHOOK_TEST', {}, error as Error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to simulate webhook',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}